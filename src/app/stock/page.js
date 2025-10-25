'use client';

import { useEffect, useState } from 'react';
import { downloadStockTemplate, uploadStockReconciliation } from '@/lib/api';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

const API_BASE = '/api';

async function fetchStock() {
  const res = await fetch(`${API_BASE}/transactions/stock`);
  if (!res.ok) throw new Error('Failed to fetch stock');
  return res.json();
}

async function fetchTypes() {
  const res = await fetch(`${API_BASE}/types`);
  if (!res.ok) throw new Error('Failed to fetch types');
  return res.json();
}

export default function CurrentStockPage() {
  const router = useRouter();
  const [allRows, setAllRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [types, setTypes] = useState([]);
  
  // Stock Reconciliation Modal
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [reconciliationFile, setReconciliationFile] = useState(null);
  const [reconciliationDate, setReconciliationDate] = useState('');
  const [reconciliationTime, setReconciliationTime] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStock();
    loadTypes();
    // Set default date and time to now
    const now = new Date();
    setReconciliationDate(now.toISOString().split('T')[0]);
    setReconciliationTime(now.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRows, searchQuery, selectedItems, selectedType]);

  async function loadStock() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStock();
      setAllRows(data.stock || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function loadTypes() {
    try {
      const data = await fetchTypes();
      setTypes(data || []);
    } catch (e) {
      console.error('Failed to load types:', e);
    }
  }

  async function handleDownloadTemplate() {
    try {
      await downloadStockTemplate();
    } catch (e) {
      alert('Error downloading template: ' + e.message);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }
      setReconciliationFile(file);
    }
  }

  async function handleUploadReconciliation() {
    if (!reconciliationFile) {
      alert('Please select a file');
      return;
    }
    if (!reconciliationDate || !reconciliationTime) {
      alert('Please enter date and time');
      return;
    }
    if (!performedBy) {
      alert('Please enter who performed the count');
      return;
    }

    setUploading(true);
    try {
      // Combine date and time
      const dateTime = new Date(`${reconciliationDate}T${reconciliationTime}`);
      
      const formData = new FormData();
      formData.append('file', reconciliationFile);
      formData.append('reconciliationDate', dateTime.toISOString());
      formData.append('performedBy', performedBy);
      if (reconciliationNotes) {
        formData.append('notes', reconciliationNotes);
      }

      const result = await uploadStockReconciliation(formData);
      
      let message = `Stock reconciliation completed!\n\nAdjusted: ${result.summary.adjusted}\nUnchanged: ${result.summary.unchanged}\nInvalid: ${result.summary.invalid}`;
      if (result.summary.minStockChanged > 0) {
        message += `\nMin Stock Updated: ${result.summary.minStockChanged}`;
      }
      alert(message);
      
      // Close modal and reset
      setShowReconciliationModal(false);
      setReconciliationFile(null);
      setPerformedBy('');
      setReconciliationNotes('');
      
      // Reload stock
      loadStock();
      
      // Navigate to reconciliation report
      router.push(`/stock-reconciliation/${result.reconciliationId}`);
      
    } catch (e) {
      alert('Error uploading reconciliation: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  function applyFilters() {
    let filtered = [...allRows];

    // Filter by selected items
    if (selectedItems.length > 0) {
      filtered = filtered.filter(row => 
        selectedItems.some(selected => 
          row.name.toLowerCase().includes(selected.toLowerCase())
        )
      );
    }

    // Filter by search query (if no specific items selected)
    if (searchQuery && selectedItems.length === 0) {
      filtered = filtered.filter(row =>
        row.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(row => row.type === selectedType);
    }

    setFilteredRows(filtered);
  }

  function addItemFilter(itemName) {
    if (!selectedItems.includes(itemName)) {
      setSelectedItems([...selectedItems, itemName]);
    }
    setSearchQuery('');
  }

  function removeItemFilter(itemName) {
    setSelectedItems(selectedItems.filter(name => name !== itemName));
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedItems([]);
    setSelectedType('all');
  }

  const searchSuggestions = allRows.filter(row =>
    searchQuery && row.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="page-title" style={{ fontSize: 20, margin: 0 }}>Current Stock</h2>
        <button
          type="button"
          className="button primary"
          onClick={() => setShowReconciliationModal(true)}
          style={{ fontSize: 14, padding: '10px 20px' }}
        >
          📊 Stock Reconciliation
        </button>
      </div>
      
      {/* Filters */}
      <div className="controls" style={{ flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', flex: 1, minWidth: 300 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Search Items</label>
            <input
              type="text"
              className="input input-full"
              placeholder="Search by item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && searchSuggestions.length > 0 && (
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
                {searchSuggestions.map(item => (
                  <div
                    key={item.itemId}
                    style={{ 
                      padding: '8px 12px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f3f4f6' 
                    }}
                    onClick={() => addItemFilter(item.name)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {item.type} • Stock: {(item.stockPack || 0).toFixed(2)} {item.purchasePackUnit || 'unit'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Type</label>
            <select
              className="select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type._id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="button" 
            className="button" 
            onClick={clearFilters}
            style={{ alignSelf: 'flex-end' }}
          >
            Clear Filters
          </button>

          <button 
            type="button" 
            className="button" 
            onClick={loadStock}
            disabled={loading}
            style={{ alignSelf: 'flex-end' }}
          >
            Refresh
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

        {/* Summary */}
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          Showing {filteredRows.length} of {allRows.length} items
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th" style={{ minWidth: 200 }}>Item</th>
              <th className="th" style={{ minWidth: 120 }}>Type</th>
              <th className="th" style={{ textAlign: 'right', minWidth: 100 }} title="Stock in base content units">Base Stock</th>
              <th className="th" style={{ textAlign: 'right', minWidth: 100 }} title="Stock in purchase pack units">Pack Stock</th>
              <th className="th" style={{ textAlign: 'center', width: 100 }} title="Minimum stock level">Min Stock</th>
              <th className="th" style={{ textAlign: 'center', width: 120 }} title="Status indicator">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={6}>Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td className="td" colSpan={6}>No items found</td></tr>
            ) : filteredRows.map((r) => {
              const minStock = r.minStock || 0;
              const currentStock = r.stockPack || 0;
              const needsRestocking = currentStock < minStock;
              
              return (
              <tr key={r.itemId} style={{ background: needsRestocking ? '#fef2f2' : 'transparent' }}>
                <td className="td" style={{ maxWidth: 300 }}>
                  <div style={{ wordBreak: 'break-word' }}>{r.name}</div>
                </td>
                <td className="td" style={{ color: '#6b7280', fontSize: 13 }}>{r.type}</td>
                <td className="td" style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontWeight: 600,
                    color: (r.stockBase || 0) < 0 ? '#dc2626' : (r.stockBase || 0) === 0 ? '#6b7280' : '#059669'
                  }}>
                    {(r.stockBase || 0).toFixed(2)}
                  </span>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                    {r.baseContentUnit || 'unit'}
                  </div>
                </td>
                <td className="td" style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontWeight: 600,
                    color: (r.stockPack || 0) < 0 ? '#dc2626' : (r.stockPack || 0) === 0 ? '#6b7280' : '#059669'
                  }}>
                    {(r.stockPack || 0).toFixed(2)}
                  </span>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                    {r.purchasePackUnit || 'unit'}
                  </div>
                </td>
                <td className="td" style={{ textAlign: 'center' }}>
                  <span style={{ 
                    fontWeight: 600,
                    color: minStock > 0 ? '#1f2937' : '#9ca3af'
                  }}>
                    {minStock}
                  </span>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                    {r.purchasePackUnit || 'unit'}
                  </div>
                </td>
                <td className="td" style={{ textAlign: 'center' }}>
                  {minStock > 0 ? (
                    needsRestocking ? (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#fee2e2',
                        color: '#dc2626',
                        display: 'inline-block'
                      }}>
                        ⚠️ RESTOCK
                      </span>
                    ) : (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#d1fae5',
                        color: '#059669',
                        display: 'inline-block'
                      }}>
                        ✓ OK
                      </span>
                    )
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Reconciliation Modal */}
      {showReconciliationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 32,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20 }}>Stock Reconciliation</h3>
            
            <div style={{ marginBottom: 20, padding: 16, background: '#eff6ff', borderRadius: 8, border: '1px solid #93c5fd' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#1e40af', marginBottom: 12 }}>
                <strong>How it works:</strong>
              </p>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#1e40af' }}>
                <li>Download the template CSV (includes all product details as reference)</li>
                <li>Count your physical stock and fill in <strong>PACK STOCK</strong> (packages/boxes) OR <strong>BASE STOCK</strong> (individual units)</li>
                <li>The reference columns (Base Content, Unit, etc.) are pre-filled to help you</li>
                <li>Upload the completed file with the count date/time</li>
                <li>System will automatically calculate and adjust your stock</li>
              </ol>
            </div>

            <div style={{ marginBottom: 20 }}>
              <button
                type="button"
                className="button"
                onClick={handleDownloadTemplate}
                style={{ width: '100%', marginBottom: 12, fontSize: 14 }}
              >
                ⬇️ Download Template CSV
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Upload Completed Template <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="input input-full"
              />
              {reconciliationFile && (
                <div style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>
                  ✓ {reconciliationFile.name}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Count Date <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="date"
                  className="input input-full"
                  value={reconciliationDate}
                  onChange={(e) => setReconciliationDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Count Time <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="time"
                  className="input input-full"
                  value={reconciliationTime}
                  onChange={(e) => setReconciliationTime(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Performed By <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                className="input input-full"
                placeholder="Enter your name"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Notes (Optional)
              </label>
              <textarea
                className="input"
                style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                rows={3}
                placeholder="Any notes about this stock count..."
                value={reconciliationNotes}
                onChange={(e) => setReconciliationNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setShowReconciliationModal(false);
                  setReconciliationFile(null);
                }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleUploadReconciliation}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload & Reconcile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
