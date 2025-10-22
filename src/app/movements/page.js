'use client';

import { useEffect, useState } from 'react';
import { fetchItems, fetchTransactions, updateTransaction, deleteTransaction, postTransaction } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function InventoryMovementsPage() {
  const [allRows, setAllRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  
  // For item suggestions
  const [items, setItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState({ direction: '', quantity: '' });
  const [expandedId, setExpandedId] = useState(null);

  // New transaction panel
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [newTx, setNewTx] = useState({
    direction: 'out',
    selectedItem: null,
    quantity: '',
    usePack: true,
    observations: '',
    personName: ''
  });
  const [txQuery, setTxQuery] = useState('');
  const [txSuggestions, setTxSuggestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    loadTransactions();
    loadItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRows, startDate, endDate, selectedItems, directionFilter]);

  useEffect(() => {
    const run = async () => {
      const q = txQuery.trim();
      if (!q) {
        setTxSuggestions([]);
        return;
      }
      try {
        const data = await fetchItems({ q, limit: 10, includeArchived: false });
        setTxSuggestions(data.items || []);
      } catch {
        // ignore
      }
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [txQuery]);

  async function loadTransactions() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTransactions({ limit: 1000 });
      setAllRows(data.transactions || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function loadItems() {
    try {
      const data = await fetchItems({ limit: 1000 });
      setItems(data.items || []);
    } catch (e) {
      console.error('Failed to load items:', e);
    }
  }

  function applyFilters() {
    let filtered = [...allRows];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tx => new Date(tx.createdAt) <= end);
    }

    if (selectedItems.length > 0) {
      filtered = filtered.filter(tx => {
        const itemName = tx.itemId?.name?.toLowerCase() || '';
        return selectedItems.some(selected => 
          itemName.includes(selected.toLowerCase())
        );
      });
    }

    if (directionFilter !== 'all') {
      filtered = filtered.filter(tx => tx.direction === directionFilter);
    }

    setFilteredRows(filtered);
  }

  function clearFilters() {
    setStartDate('');
    setEndDate('');
    setItemSearch('');
    setSelectedItems([]);
    setDirectionFilter('all');
    setPage(1);
  }

  const totalInput = filteredRows
    .filter(tx => tx.direction === 'in')
    .reduce((acc, tx) => acc + (tx.quantityPack || tx.quantity || 0), 0);
  const totalOut = filteredRows
    .filter(tx => tx.direction === 'out')
    .reduce((acc, tx) => acc + (tx.quantityPack || tx.quantity || 0), 0);

  const filteredItemSuggestions = items.filter(item =>
    itemSearch && item.name.toLowerCase().includes(itemSearch.toLowerCase())
  ).slice(0, 10);

  function toggleExpanded(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  // Calculate running stock
  const reversedRows = [...filteredRows].reverse();
  const rowsWithStock = reversedRows.map((tx, index) => {
    const itemId = tx.itemId?._id;
    const stockUpToHere = reversedRows
      .slice(0, index + 1)
      .filter(t => t.itemId?._id === itemId)
      .reduce((acc, t) => {
        const packQty = t.quantityPack || t.quantity || 0;
        return acc + (t.direction === 'in' ? packQty : -packQty);
      }, 0);

    return { ...tx, stockAtTime: stockUpToHere };
  }).reverse();

  const totalPages = Math.ceil(rowsWithStock.length / itemsPerPage);
  const paginatedRows = rowsWithStock.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, selectedItems, directionFilter]);

  function startEdit(tx) {
    setEditId(tx._id);
    setEditDraft({ direction: tx.direction, quantity: tx.quantity });
  }

  function cancelEdit() {
    setEditId(null);
    setEditDraft({ direction: '', quantity: '' });
  }

  async function saveEdit(id, originalTx) {
    const justification = prompt('Please provide a justification for editing this transaction:');
    if (!justification || !justification.trim()) {
      alert('Justification is required to edit a transaction.');
      return;
    }
    try {
      const payload = {
        direction: editDraft.direction,
        quantity: Number(editDraft.quantity),
        justification: justification.trim()
      };
      const updated = await updateTransaction(id, payload);
      setAllRows(prev => prev.map(tx => (tx._id === id ? updated : tx)));
      cancelEdit();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onDelete(id) {
    const justification = prompt('Please provide a justification for deleting this transaction:');
    if (!justification || !justification.trim()) {
      alert('Justification is required to delete a transaction.');
      return;
    }
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(id, justification.trim());
      setAllRows(prev => prev.filter(tx => tx._id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  // New transaction functions
  async function submitNewTransaction(e) {
    e.preventDefault();
    if (!newTx.selectedItem) return alert('Select an item');
    const qtyNum = Number(newTx.quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return alert('Enter a valid quantity');
    
    let quantityBase, quantityPack;
    const baseContentValue = newTx.selectedItem.baseContentValue || 1;
    
    if (newTx.usePack) {
      quantityPack = qtyNum;
      quantityBase = qtyNum * baseContentValue;
    } else {
      quantityBase = qtyNum;
      quantityPack = qtyNum / baseContentValue;
    }
    
    setSubmitting(true);
    try {
      await postTransaction({ 
        itemId: newTx.selectedItem._id, 
        direction: newTx.direction, 
        quantity: newTx.usePack ? quantityPack : quantityBase,
        quantityBase,
        quantityPack,
        unitUsed: newTx.usePack ? 'pack' : 'base',
        observations: newTx.observations.trim() || undefined,
        personName: newTx.personName.trim()
      });
      
      // Reset and close
      setNewTx({
        direction: 'out',
        selectedItem: null,
        quantity: '',
        usePack: true,
        observations: '',
        personName: ''
      });
      setTxQuery('');
      setShowNewTransaction(false);
      loadTransactions();
      alert('Transaction saved successfully');
    } catch (e2) {
      alert(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  const cols = isEditMode ? 9 : 8;

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="page-title" style={{ fontSize: 20, margin: 0 }}>Inventory Movements</h2>
        <button
          type="button"
          className="button primary"
          onClick={() => setShowNewTransaction(true)}
          style={{ fontSize: 16, padding: '10px 20px' }}
        >
          + New Movement
        </button>
      </div>

      {/* Filters */}
      <div className="controls" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Date Range:</label>
          <input
            type="date"
            className="input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: 160 }}
          />
          <span>to</span>
          <input
            type="date"
            className="input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: 160 }}
          />
        </div>

        {/* Item Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
          <input
            className="input input-full"
            placeholder="Search item..."
            value={itemSearch}
            onChange={(e) => { setItemSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          />
          {showSuggestions && itemSearch && filteredItemSuggestions.length > 0 && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              background: 'white', 
              border: '1px solid #e5e7eb', 
              zIndex: 10, 
              borderRadius: 6, 
              overflow: 'hidden', 
              maxHeight: 200, 
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {filteredItemSuggestions.map((item) => (
                <div 
                  key={item._id} 
                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }} 
                  onClick={() => { 
                    setSelectedItems(prev => {
                      if (!prev.includes(item.name)) return [...prev, item.name];
                      return prev;
                    });
                    setItemSearch('');
                    setShowSuggestions(false);
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{item.type}</div>
                </div>
              ))}
            </div>
          )}
          {selectedItems.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {selectedItems.map(item => (
                <span key={item} style={{ 
                  background: '#e0e7ff', 
                  color: '#3730a3', 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  fontSize: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4 
                }}>
                  {item}
                  <button 
                    type="button" 
                    onClick={() => setSelectedItems(prev => prev.filter(i => i !== item))}
                    style={{ background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', fontSize: 14 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Direction Filter */}
        <select
          className="select"
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          style={{ width: 120 }}
        >
          <option value="all">All</option>
          <option value="in">Input</option>
          <option value="out">Output</option>
        </select>

        <button type="button" className="button" onClick={clearFilters}>Clear</button>
        <button type="button" className="button primary" onClick={loadTransactions} disabled={loading}>Refresh</button>
        <button 
          type="button" 
          className={`button ${isEditMode ? "primary" : ""}`} 
          onClick={() => setIsEditMode(!isEditMode)}
        >
          {isEditMode ? "Exit Edit" : "Edit Mode"}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 8, flex: '1 1 200px' }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Total Transactions</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{filteredRows.length}</div>
        </div>
        <div style={{ background: '#d1fae5', padding: 12, borderRadius: 8, flex: '1 1 200px' }}>
          <div style={{ fontSize: 13, color: '#065f46', fontWeight: 600 }}>Total Input (Pack Units)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>+{totalInput.toFixed(2)}</div>
        </div>
        <div style={{ background: '#fee2e2', padding: 12, borderRadius: 8, flex: '1 1 200px' }}>
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Total Output (Pack Units)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>-{totalOut.toFixed(2)}</div>
        </div>
        <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, flex: '1 1 200px' }}>
          <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>Net Movement (Pack Units)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: (totalInput - totalOut) >= 0 ? '#059669' : '#dc2626' }}>
            {(totalInput - totalOut).toFixed(2)}
          </div>
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      {/* Transaction Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th" style={{ minWidth: 140 }}>Date/Time</th>
              <th className="th" style={{ minWidth: 200 }}>Item</th>
              <th className="th" style={{ minWidth: 120 }}>Type</th>
              <th className="th" style={{ minWidth: 90 }}>Direction</th>
              <th className="th" style={{ textAlign: 'right', minWidth: 90 }} title="Quantity in base content units">Base Qty</th>
              <th className="th" style={{ textAlign: 'right', minWidth: 90 }} title="Quantity in purchase pack units">Pack Qty</th>
              <th className="th" style={{ textAlign: 'right', minWidth: 100 }} title="Cumulative stock at this point in time">Stock at Time</th>
              <th className="th" style={{ minWidth: 100 }}>Person</th>
              {isEditMode && <th className="th" style={{ minWidth: 180 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={cols}>Loading...</td></tr>
            ) : paginatedRows.length === 0 ? (
              <tr><td className="td" colSpan={cols}>No transactions found</td></tr>
            ) : paginatedRows.map((tx) => (
              <>
                <tr key={tx._id} style={{ cursor: tx.observations ? 'pointer' : 'default' }} onClick={() => tx.observations && toggleExpanded(tx._id)}>
                  <td className="td" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(tx.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="td" style={{ maxWidth: 300 }}>
                    <div style={{ wordBreak: 'break-word' }}>
                      {tx.itemId?.name || '-'}
                      {tx.observations && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#6b7280', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                          (has notes)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td" style={{ color: '#6b7280', fontSize: 13 }}>{tx.itemId?.type || '-'}</td>
                  <td className="td">
                    {editId === tx._id ? (
                      <select
                        className="select"
                        value={editDraft.direction}
                        onChange={(e) => setEditDraft(prev => ({ ...prev, direction: e.target.value }))}
                        style={{ width: 90 }}
                      >
                        <option value="in">Input</option>
                        <option value="out">Output</option>
                      </select>
                    ) : (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: tx.direction === 'in' ? '#d1fae5' : '#fee2e2',
                        color: tx.direction === 'in' ? '#065f46' : '#991b1b'
                      }}>
                        {tx.direction === 'in' ? 'Input' : 'Output'}
                      </span>
                    )}
                  </td>
                  <td className="td" style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontWeight: 600,
                      color: tx.direction === 'in' ? '#059669' : '#dc2626'
                    }}>
                      {tx.direction === 'in' ? '+' : '-'}{(tx.quantityBase || tx.quantity || 0).toFixed(2)}
                    </span>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                      {tx.itemId?.baseContentUnit || 'unit'}
                    </div>
                  </td>
                  <td className="td" style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontWeight: 600,
                      color: tx.direction === 'in' ? '#059669' : '#dc2626'
                    }}>
                      {tx.direction === 'in' ? '+' : '-'}{(tx.quantityPack || tx.quantity || 0).toFixed(2)}
                    </span>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                      {tx.itemId?.purchasePackUnit || 'unit'}
                    </div>
                  </td>
                  <td className="td" style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontWeight: 700,
                      fontSize: 15,
                      color: tx.stockAtTime >= 0 ? '#059669' : '#dc2626'
                    }}>
                      {tx.stockAtTime.toFixed(2)}
                    </span>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                      {tx.itemId?.purchasePackUnit || 'unit'}
                    </div>
                  </td>
                  <td className="td">
                    {tx.personName || <span style={{ color: '#9ca3af' }}>-</span>}
                  </td>
                  {isEditMode && (
                    <td className="td" style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                      {editId === tx._id ? (
                        <>
                          <button 
                            type="button" 
                            className="button" 
                            onClick={() => saveEdit(tx._id, tx)}
                          >
                            Save
                          </button>
                          <button 
                            type="button" 
                            className="button" 
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            type="button" 
                            className="button" 
                            onClick={() => startEdit(tx)}
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            className="button" 
                            onClick={() => onDelete(tx._id)}
                            style={{ background: '#dc2626', color: 'white' }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
                {expandedId === tx._id && tx.observations && (
                  <tr>
                    <td className="td" colSpan={cols} style={{ background: '#f9fafb', padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                        Observations:
                      </div>
                      <div style={{ fontSize: 14, color: '#4b5563', fontStyle: 'italic' }}>
                        "{tx.observations}"
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredRows.length > 0 && (
        <div className="pagination">
          <button 
            type="button" 
            className="button" 
            onClick={() => setPage(p => Math.max(p - 1, 1))} 
            disabled={page <= 1}
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages} • Showing {paginatedRows.length} of {filteredRows.length} transactions
          </span>
          <button 
            type="button" 
            className="button" 
            onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* New Transaction Slide-in Panel */}
      {showNewTransaction && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
            onClick={() => setShowNewTransaction(false)}
          />
          
          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 'min(600px, 90vw)',
            background: 'white',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflowY: 'auto',
            animation: 'slideInRight 0.3s ease'
          }}>
            <style jsx>{`
              @keyframes slideInRight {
                from {
                  transform: translateX(100%);
                }
                to {
                  transform: translateX(0);
                }
              }
            `}</style>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>New Movement</h2>
                <button
                  type="button"
                  onClick={() => setShowNewTransaction(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 28,
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={submitNewTransaction}>
                {/* Direction */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    1. Transaction Type <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <button 
                      type="button" 
                      className="button" 
                      style={{ 
                        flex: 1,
                        border: 'none', 
                        background: newTx.direction === 'in' ? '#059669' : 'white', 
                        color: newTx.direction === 'in' ? 'white' : '#111',
                        padding: '12px 20px',
                        fontSize: 16,
                        fontWeight: 600
                      }} 
                      onClick={() => setNewTx(prev => ({ ...prev, direction: 'in' }))}
                    >
                      Input
                    </button>
                    <button 
                      type="button" 
                      className="button" 
                      style={{ 
                        flex: 1,
                        border: 'none', 
                        background: newTx.direction === 'out' ? '#dc2626' : 'white', 
                        color: newTx.direction === 'out' ? 'white' : '#111',
                        padding: '12px 20px',
                        fontSize: 16,
                        fontWeight: 600
                      }} 
                      onClick={() => setNewTx(prev => ({ ...prev, direction: 'out' }))}
                    >
                      Output
                    </button>
                  </div>
                </div>

                {/* Item Selection */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    2. Select Item <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      placeholder="Search for an item..."
                      value={newTx.selectedItem ? newTx.selectedItem.name : txQuery}
                      onChange={(e) => { setNewTx(prev => ({ ...prev, selectedItem: null })); setTxQuery(e.target.value); }}
                      style={{ width: '100%', padding: '12px 16px', fontSize: 16 }}
                    />
                    {txSuggestions.length > 0 && !newTx.selectedItem && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        background: 'white', 
                        border: '1px solid #e5e7eb', 
                        zIndex: 10, 
                        borderRadius: 8, 
                        overflow: 'hidden', 
                        maxHeight: 260, 
                        overflowY: 'auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        {txSuggestions.map((it) => (
                          <div 
                            key={it._id} 
                            style={{ 
                              padding: '10px 16px', 
                              cursor: 'pointer', 
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex',
                              flexDirection: 'column'
                            }} 
                            onClick={() => { setNewTx(prev => ({ ...prev, selectedItem: it })); setTxQuery(''); setTxSuggestions([]); }}
                          >
                            <div style={{ fontWeight: 600, color: '#1f2937' }}>{it.name}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{it.type}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                              Base: {it.baseContentValue} {it.baseContentUnit || "unit"} • Pack: {it.purchasePackQuantity} {it.purchasePackUnit || "unit"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {newTx.selectedItem && (
                      <div style={{ 
                        marginTop: 12, 
                        padding: '12px 16px', 
                        background: '#d1fae5', 
                        borderRadius: 8, 
                        border: '1px solid #059669',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#065f46' }}>{newTx.selectedItem.name}</div>
                          <div style={{ fontSize: 13, color: '#065f46' }}>{newTx.selectedItem.type}</div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setNewTx(prev => ({ ...prev, selectedItem: null }))} 
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#065f46', 
                            fontSize: 20, 
                            cursor: 'pointer',
                            padding: '4px 8px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unit Toggle */}
                {newTx.selectedItem && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      3. Select Unit Type <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: 8, 
                      overflow: 'hidden',
                      width: '100%',
                      maxWidth: 400
                    }}>
                      <button 
                        type="button" 
                        className="button" 
                        style={{ 
                          flex: 1,
                          border: 'none', 
                          background: !newTx.usePack ? '#111' : 'white', 
                          color: !newTx.usePack ? 'white' : '#111',
                          padding: '10px 20px',
                          fontSize: 15,
                          fontWeight: 600
                        }} 
                        onClick={() => setNewTx(prev => ({ ...prev, usePack: false }))}
                      >
                        {newTx.selectedItem.baseContentUnit || 'unit'}
                      </button>
                      <button 
                        type="button" 
                        className="button" 
                        style={{ 
                          flex: 1,
                          border: 'none', 
                          background: newTx.usePack ? '#111' : 'white', 
                          color: newTx.usePack ? 'white' : '#111',
                          padding: '10px 20px',
                          fontSize: 15,
                          fontWeight: 600
                        }} 
                        onClick={() => setNewTx(prev => ({ ...prev, usePack: true }))}
                      >
                        {newTx.selectedItem.purchasePackUnit || 'unit'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    4. Quantity <span style={{ color: '#dc2626' }}>*</span>
                    {newTx.selectedItem && (
                      <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                        (in {newTx.usePack ? newTx.selectedItem.purchasePackUnit : newTx.selectedItem.baseContentUnit || 'unit'})
                      </span>
                    )}
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter quantity"
                    value={newTx.quantity}
                    onChange={(e) => setNewTx(prev => ({ ...prev, quantity: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', fontSize: 16 }}
                    required
                  />
                  
                  {newTx.selectedItem && newTx.quantity && Number(newTx.quantity) > 0 && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: '10px 12px', 
                      background: '#f0f9ff', 
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#0369a1'
                    }}>
                      {newTx.usePack ? (
                        <>
                          <strong>{newTx.quantity} {newTx.selectedItem.purchasePackUnit || 'unit'}</strong> = {(Number(newTx.quantity) * (newTx.selectedItem.baseContentValue || 1)).toFixed(2)} {newTx.selectedItem.baseContentUnit || 'unit'}
                        </>
                      ) : (
                        <>
                          <strong>{newTx.quantity} {newTx.selectedItem.baseContentUnit || 'unit'}</strong> = {(Number(newTx.quantity) / (newTx.selectedItem.baseContentValue || 1)).toFixed(2)} {newTx.selectedItem.purchasePackUnit || 'unit'}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Observations */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    5. Observations <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
                  </label>
                  <textarea
                    className="input"
                    placeholder="Add any relevant notes..."
                    value={newTx.observations}
                    onChange={(e) => setNewTx(prev => ({ ...prev, observations: e.target.value }))}
                    rows="3"
                    style={{ width: '100%', padding: '12px 16px', fontSize: 16 }}
                  ></textarea>
                </div>

                {/* Person Name */}
                <div style={{ marginBottom: 30 }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    6. Person Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="Enter your name"
                    value={newTx.personName}
                    onChange={(e) => setNewTx(prev => ({ ...prev, personName: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', fontSize: 16 }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="button" 
                    onClick={() => setShowNewTransaction(false)}
                    style={{ padding: '12px 24px', fontSize: 16 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="button" 
                    style={{ 
                      background: newTx.direction === 'in' ? '#059669' : '#dc2626', 
                      color: 'white',
                      padding: '12px 24px',
                      fontSize: 16,
                      fontWeight: 600
                    }} 
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : `Save ${newTx.direction === 'in' ? 'Input' : 'Output'}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

