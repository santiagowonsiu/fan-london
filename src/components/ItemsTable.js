'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createItem, fetchItems, toggleArchive, updateItem, deleteItem } from '@/lib/api';
import AddItemModal from './AddItemModal';
import ImageUpload from './ImageUpload';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ItemsTable() {
  const [items, setItems] = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({
    type: '',
    name: '',
    baseContentValue: '',
    baseContentUnit: '',
    purchasePackQuantity: '',
    purchasePackUnit: '',
    minStock: '',
    imageUrl: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inactiveProducts, setInactiveProducts] = useState([]);
  const [showInactiveNotification, setShowInactiveNotification] = useState(false);
  const [loadingInactive, setLoadingInactive] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const filtered = useMemo(() => items, [items]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchItems({ includeArchived, q: query, page, limit });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadInactiveProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived, query, page, limit]);

  async function loadInactiveProducts() {
    setLoadingInactive(true);
    try {
      const res = await fetch(`${API_BASE}/api/items/inactive`);
      if (!res.ok) throw new Error('Failed to fetch inactive products');
      const data = await res.json();
      setInactiveProducts(data);
    } catch (e) {
      console.error('Failed to load inactive products:', e);
    } finally {
      setLoadingInactive(false);
    }
  }

  async function archiveInactiveProducts(productIds) {
    if (!window.confirm(`Are you sure you want to archive ${productIds.length} inactive product(s)?`)) {
      return;
    }

    try {
      for (const id of productIds) {
        await toggleArchive(id);
      }
      alert(`Successfully archived ${productIds.length} product(s)!`);
      setShowInactiveNotification(false);
      load();
      loadInactiveProducts();
    } catch (e) {
      alert('Failed to archive some products: ' + e.message);
    }
  }

  function startEdit(item) {
    setEditId(item._id);
    setDraft({
      type: item.type,
      name: item.name,
      baseContentValue: item.baseContentValue ?? '',
      baseContentUnit: item.baseContentUnit ?? '',
      purchasePackQuantity: item.purchasePackQuantity ?? '',
      purchasePackUnit: item.purchasePackUnit ?? '',
      minStock: item.minStock ?? '',
      imageUrl: item.imageUrl ?? '',
    });
  }

  function cancelEdit() {
    setEditId(null);
    setDraft({
      type: '',
      name: '',
      baseContentValue: '',
      baseContentUnit: '',
      purchasePackQuantity: '',
      purchasePackUnit: '',
      minStock: '',
      imageUrl: '',
    });
  }

  async function saveEdit(id) {
    try {
      const payload = {
        type: draft.type,
        name: draft.name,
        baseContentValue: draft.baseContentValue === '' ? undefined : Number(draft.baseContentValue),
        baseContentUnit: draft.baseContentUnit || undefined,
        purchasePackQuantity: draft.purchasePackQuantity === '' ? undefined : Number(draft.purchasePackQuantity),
        purchasePackUnit: draft.purchasePackUnit || undefined,
        minStock: draft.minStock === '' ? 0 : Number(draft.minStock),
        imageUrl: draft.imageUrl || undefined,
      };
      console.log('Saving item with payload:', payload);
      const updated = await updateItem(id, payload);
      console.log('Updated item received:', updated);
      setItems((prev) => prev.map((it) => (it._id === id ? updated : it)));
      cancelEdit();
    } catch (e) {
      alert(e.message);
    }
  }

  async function onToggleArchive(id) {
    try {
      const updated = await toggleArchive(id);
      setItems((prev) => prev.map((it) => (it._id === id ? updated : it)));
    } catch (e) {
      alert(e.message);
    }
  }

  async function onDelete(id) {
    const justification = prompt('Please provide a justification for deleting this item:');
    if (!justification || !justification.trim()) {
      alert('Justification is required to delete an item.');
      return;
    }
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem(id, justification.trim());
      setItems((prev) => prev.filter((it) => it._id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  function handleItemAdded() {
    setPage(1);
    load();
  }

  function exportToCSV() {
    // Prepare CSV headers
    const headers = [
      'Type',
      'Item Name',
      'Base Content Value',
      'Base Content Unit',
      'Purchase Pack Quantity',
      'Purchase Pack Unit',
      'Min Stock',
      'Archived',
      'Image URL'
    ];

    // Prepare CSV rows
    const rows = items.map(item => [
      item.type || '',
      item.name || '',
      item.baseContentValue || '',
      item.baseContentUnit || '',
      item.purchasePackQuantity || '',
      item.purchasePackUnit || '',
      item.minStock || 0,
      item.archived ? 'Yes' : 'No',
      item.imageUrl || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell content
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `fan-products-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const baseCols = 9; // Image, Product ID, Type, Item, Base Content, Unit, Purchase Pack, Pack Unit, Min Stock
  const cols = isEditMode ? baseCols + 2 : baseCols;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="page-title" style={{ fontSize: 20, margin: 0 }}>Product List</h2>
        {inactiveProducts.length > 0 && (
          <button
            className="button"
            onClick={() => setShowInactiveNotification(!showInactiveNotification)}
            style={{ 
              background: '#f59e0b',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>⚠️</span>
            <span>{inactiveProducts.length} Inactive Product{inactiveProducts.length !== 1 ? 's' : ''}</span>
            {inactiveProducts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                {inactiveProducts.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Inactive Products Notification */}
      {showInactiveNotification && inactiveProducts.length > 0 && (
        <div style={{ 
          marginBottom: 20,
          padding: 20, 
          background: '#fef3c7', 
          borderRadius: 8, 
          border: '2px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, color: '#92400e' }}>
                ⚠️ Inactive Products ({inactiveProducts.length})
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
                The following products haven't had any movements in the last 30 days. Consider archiving them:
              </p>
            </div>
            <button
              onClick={() => setShowInactiveNotification(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                color: '#92400e',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ 
            maxHeight: 300, 
            overflowY: 'auto',
            marginBottom: 16,
            background: 'white',
            borderRadius: 6,
            border: '1px solid #fbbf24'
          }}>
            <table style={{ width: '100%', fontSize: 14 }}>
              <thead style={{ background: '#fef3c7', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Days Inactive</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Last Movement</th>
                </tr>
              </thead>
              <tbody>
                {inactiveProducts.map((product, idx) => (
                  <tr key={product._id} style={{ borderBottom: idx < inactiveProducts.length - 1 ? '1px solid #fef3c7' : 'none' }}>
                    <td style={{ padding: 12 }}>{product.name}</td>
                    <td style={{ padding: 12 }}>{product.type}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        background: product.daysSinceLastMovement > 60 ? '#fee2e2' : '#fed7aa',
                        color: product.daysSinceLastMovement > 60 ? '#991b1b' : '#9a3412',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        {product.daysSinceLastMovement} days
                      </span>
                    </td>
                    <td style={{ padding: 12, color: '#6b7280' }}>
                      {product.lastMovement ? new Date(product.lastMovement).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="button"
              onClick={() => archiveInactiveProducts(inactiveProducts.map(p => p._id))}
              style={{ background: '#ef4444' }}
            >
              📦 Archive All {inactiveProducts.length} Products
            </button>
            <button
              className="button"
              onClick={() => setShowInactiveNotification(false)}
              style={{ background: '#6b7280' }}
            >
              Keep for Now
            </button>
          </div>
        </div>
      )}

      <div className="controls">
        <input
          className="input input-full"
          placeholder="Search..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => { setIncludeArchived(e.target.checked); setPage(1); }}
          />
          Show archived
        </label>
        <select className="select" value={String(limit)} onChange={(e) => { const v = e.target.value; setLimit(v === 'all' ? 'all' : parseInt(v, 10)); setPage(1); }}>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="all">All</option>
        </select>
        <button type="button" className="button" onClick={load} disabled={loading}>
          Refresh
        </button>
        <button 
          type="button" 
          className="button" 
          onClick={exportToCSV}
          disabled={items.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>📥</span>
          <span>Export CSV</span>
        </button>
        <button 
          type="button" 
          className={`button ${isEditMode ? 'primary' : ''}`} 
          onClick={() => {
            if (isEditMode) {
              // Exit edit mode - close any open edits
              cancelEdit();
            }
            setIsEditMode(!isEditMode);
          }}
        >
          {isEditMode ? 'Exit Edit' : 'Edit Mode'}
        </button>
        <button 
          type="button" 
          className="button primary" 
          onClick={() => setShowAddModal(true)}
        >
          Add Item
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th" style={{ width: 80 }}>Image</th>
              <th className="th" style={{ width: 110 }}>Product ID</th>
              <th className="th">Type</th>
              <th className="th">Item</th>
              <th className="th" title="Base Content: intrinsic quantity per product. Example: 'X 100 Bags' → 100 bags; '400 ML' → 400 ml.">Base Content</th>
              <th className="th" title="Unit of the base content (e.g., g, kg, ml, l, bags, pieces).">Unit</th>
              <th className="th" title="Purchase Pack: how many base units are in one purchasable unit (defaults to 1).">Purchase Pack</th>
              <th className="th" title="Unit for the purchase pack (e.g., unit, box, bag, pack).">Pack Unit</th>
              <th className="th" style={{ width: 100 }} title="Minimum stock level to maintain (in pack units). Alert when stock falls below this number.">Min Stock</th>
              {isEditMode && <th className="th">Archived</th>}
              {isEditMode && <th className="th">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td" colSpan={cols}>Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="td" colSpan={cols}>No items</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <React.Fragment key={item._id}>
                <tr className={item.archived ? 'row-archived' : undefined}>
                  <td className="td" style={{ padding: 4 }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 60,
                        height: 60,
                        background: '#f3f4f6',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: '#d1d5db'
                      }}>
                        📦
                      </div>
                    )}
                  </td>
                  <td className="td" style={{ 
                    fontFamily: 'monospace', 
                    fontSize: 13, 
                    fontWeight: 600,
                    color: '#6b7280',
                    backgroundColor: '#f9fafb'
                  }}>
                    {item.sku || 'N/A'}
                  </td>
                  <td className="td">
                    {editId === item._id ? (
                      <input
                        className="input"
                        value={draft.type}
                        onChange={(e) => setDraft((s) => ({ ...s, type: e.target.value }))}
                        style={{ width: 220 }}
                      />
                    ) : (
                      item.type
                    )}
                  </td>
                  <td className="td">
                    {editId === item._id ? (
                      <input
                        className="input input-full"
                        value={draft.name}
                        onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="td" style={{ width: 120 }}>
                    {editId === item._id ? (
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={draft.baseContentValue}
                        onChange={(e) => setDraft((s) => ({ ...s, baseContentValue: e.target.value }))}
                        style={{ width: '100%', maxWidth: 110, boxSizing: 'border-box' }}
                      />
                    ) : (
                      item.baseContentValue ?? '-'
                    )}
                  </td>
                  <td className="td" style={{ width: 140 }}>
                    {editId === item._id ? (
                      <input
                        className="input"
                        value={draft.baseContentUnit}
                        onChange={(e) => setDraft((s) => ({ ...s, baseContentUnit: e.target.value }))}
                        placeholder="e.g., g, ml"
                        style={{ width: '100%', maxWidth: 130, boxSizing: 'border-box' }}
                      />
                    ) : (
                      item.baseContentUnit ?? '-'
                    )}
                  </td>
                  <td className="td" style={{ width: 120 }}>
                    {editId === item._id ? (
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={draft.purchasePackQuantity}
                        onChange={(e) => setDraft((s) => ({ ...s, purchasePackQuantity: e.target.value }))}
                        style={{ width: '100%', maxWidth: 110, boxSizing: 'border-box' }}
                      />
                    ) : (
                      item.purchasePackQuantity ?? '-'
                    )}
                  </td>
                  <td className="td" style={{ width: 140 }}>
                    {editId === item._id ? (
                      <input
                        className="input"
                        value={draft.purchasePackUnit}
                        onChange={(e) => setDraft((s) => ({ ...s, purchasePackUnit: e.target.value }))}
                        placeholder="e.g., unit, box"
                        style={{ width: '100%', maxWidth: 130, boxSizing: 'border-box' }}
                      />
                    ) : (
                      item.purchasePackUnit ?? '-'
                    )}
                  </td>
                  <td className="td" style={{ width: 100, textAlign: 'center' }}>
                    {editId === item._id ? (
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="1"
                        value={draft.minStock}
                        onChange={(e) => setDraft((s) => ({ ...s, minStock: e.target.value }))}
                        style={{ width: '100%', maxWidth: 90, textAlign: 'center', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <span style={{ 
                        fontWeight: 600,
                        color: (item.minStock || 0) > 0 ? '#1f2937' : '#9ca3af'
                      }}>
                        {item.minStock || 0}
                      </span>
                    )}
                  </td>
                  {isEditMode && (
                    <td className="td">
                      <span>{item.archived ? 'Yes' : 'No'}</span>
                    </td>
                  )}
                  {isEditMode && (
                    <td className="td" style={{ display: 'flex', gap: 8 }}>
                      {editId === item._id ? (
                        <>
                          <button type="button" className="button" onClick={() => saveEdit(item._id)}>Save</button>
                          <button type="button" className="button" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="button" onClick={() => startEdit(item)}>Edit</button>
                          <button type="button" className="button" onClick={() => onToggleArchive(item._id)}>
                            {item.archived ? 'Unarchive' : 'Archive'}
                          </button>
                          <button type="button" className="button" onClick={() => onDelete(item._id)} style={{ background: '#dc2626', color: 'white' }}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
                {editId === item._id && isEditMode && (
                  <tr>
                    <td className="td" colSpan={cols} style={{ background: '#f9fafb', padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                        Product Image
                      </div>
                      <ImageUpload
                        currentImageUrl={draft.imageUrl}
                        onImageUploaded={(url) => setDraft((s) => ({ ...s, imageUrl: url || '' }))}
                      />
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {limit !== 'all' && (
        <div className="pagination">
          <button type="button" className="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}>Prev</button>
          <span>
            Page {page} / {pages} • Total {total}
          </span>
          <button type="button" className="button" onClick={() => setPage((p) => Math.min(p + 1, pages))} disabled={page >= pages}>Next</button>
        </div>
      )}

      <AddItemModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
}

