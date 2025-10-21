'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

const API_BASE = '/api';

async function fetchTransactions(params = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', String(params.limit || 1000)); // Get all for filtering
  if (params.direction) query.set('direction', params.direction);
  if (params.itemId) query.set('itemId', params.itemId);
  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

async function fetchItems(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  query.set('limit', '1000');
  query.set('archived', 'false');
  const res = await fetch(`${API_BASE}/items?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export default function TransactionLogsPage() {
  const [allRows, setAllRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all'); // 'all', 'in', 'out'
  
  // For item suggestions
  const [items, setItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); // Array of item names

  useEffect(() => {
    loadTransactions();
    loadItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRows, startDate, endDate, selectedItems, directionFilter]);

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

    // Filter by date range
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

    // Filter by selected items (name match)
    if (selectedItems.length > 0) {
      filtered = filtered.filter(tx => {
        const itemName = tx.itemId?.name?.toLowerCase() || '';
        return selectedItems.some(selected => 
          itemName.includes(selected.toLowerCase())
        );
      });
    }

    // Filter by direction
    if (directionFilter !== 'all') {
      filtered = filtered.filter(tx => tx.direction === directionFilter);
    }

    setFilteredRows(filtered);
  }

  function addItemFilter(itemName) {
    if (!selectedItems.includes(itemName)) {
      setSelectedItems([...selectedItems, itemName]);
    }
    setItemSearch('');
    setShowSuggestions(false);
  }

  function removeItemFilter(itemName) {
    setSelectedItems(selectedItems.filter(name => name !== itemName));
  }

  function clearFilters() {
    setStartDate('');
    setEndDate('');
    setItemSearch('');
    setSelectedItems([]);
    setDirectionFilter('all');
  }

  // Calculate net movements
  const netMovement = filteredRows.reduce((acc, tx) => {
    if (tx.direction === 'in') {
      return acc + tx.quantity;
    } else {
      return acc - tx.quantity;
    }
  }, 0);

  const totalIn = filteredRows
    .filter(tx => tx.direction === 'in')
    .reduce((acc, tx) => acc + tx.quantity, 0);

  const totalOut = filteredRows
    .filter(tx => tx.direction === 'out')
    .reduce((acc, tx) => acc + tx.quantity, 0);

  const filteredItemSuggestions = items.filter(item =>
    itemSearch && item.name.toLowerCase().includes(itemSearch.toLowerCase())
  ).slice(0, 10);

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Transaction Logs</h2>
      
      {/* Filters Section */}
      <div className="controls" style={{ flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Date Range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Start Date</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: 160 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>End Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: 160 }}
            />
          </div>

          {/* Direction Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Direction</label>
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
          </div>

          {/* Item Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', flex: 1, minWidth: 250 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Filter by Item</label>
            <input
              type="text"
              className="input input-full"
              placeholder="Search items..."
              value={itemSearch}
              onChange={(e) => {
                setItemSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && filteredItemSuggestions.length > 0 && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                background: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: 6, 
                maxHeight: 200, 
                overflowY: 'auto', 
                zIndex: 10,
                marginTop: 4
              }}>
                {filteredItemSuggestions.map(item => (
                  <div
                    key={item._id}
                    style={{ 
                      padding: '8px 12px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f3f4f6' 
                    }}
                    onClick={() => addItemFilter(item.name)}
                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{item.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="button" 
            onClick={clearFilters}
            style={{ alignSelf: 'flex-end' }}
          >
            Clear Filters
          </button>
        </div>

        {/* Selected Items Tags */}
        {selectedItems.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>Filtering by:</span>
            {selectedItems.map(itemName => (
              <div
                key={itemName}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: '#f3f4f6',
                  borderRadius: 16,
                  fontSize: 13
                }}
              >
                <span>{itemName}</span>
                <button
                  onClick={() => removeItemFilter(itemName)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: 0,
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div style={{ 
          display: 'flex', 
          gap: 20, 
          padding: '12px 16px', 
          background: '#f9fafb', 
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Total Transactions</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{filteredRows.length}</div>
          </div>
          <div style={{ borderLeft: '1px solid #e5e7eb' }} />
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Total Input</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>+{totalIn.toFixed(2)}</div>
          </div>
          <div style={{ borderLeft: '1px solid #e5e7eb' }} />
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Total Output</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>-{totalOut.toFixed(2)}</div>
          </div>
          <div style={{ borderLeft: '1px solid #e5e7eb' }} />
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Net Movement</div>
            <div style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              color: netMovement >= 0 ? '#059669' : '#dc2626' 
            }}>
              {netMovement >= 0 ? '+' : ''}{netMovement.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      {/* Transaction Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Date/Time</th>
              <th className="th">Item</th>
              <th className="th">Type</th>
              <th className="th">Direction</th>
              <th className="th" style={{ textAlign: 'right' }}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={5}>Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td className="td" colSpan={5}>No transactions found</td></tr>
            ) : filteredRows.map((tx) => (
              <tr key={tx._id}>
                <td className="td" style={{ whiteSpace: 'nowrap' }}>
                  {new Date(tx.createdAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="td">{tx.itemId?.name || '-'}</td>
                <td className="td" style={{ color: '#6b7280' }}>{tx.itemId?.type || '-'}</td>
                <td className="td">
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: tx.direction === 'in' ? '#d1fae5' : '#fee2e2',
                    color: tx.direction === 'in' ? '#065f46' : '#991b1b'
                  }}>
                    {tx.direction === 'in' ? 'Input' : 'Output'}
                  </span>
                </td>
                <td className="td" style={{ 
                  textAlign: 'right', 
                  fontWeight: 600,
                  color: tx.direction === 'in' ? '#059669' : '#dc2626'
                }}>
                  {tx.direction === 'in' ? '+' : '-'}{tx.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
