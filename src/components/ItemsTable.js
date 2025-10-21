'use client';

import { useEffect, useMemo, useState } from 'react';
import { createItem, fetchItems, toggleArchive, updateItem, deleteItem } from '@/lib/api';
import AddItemModal from './AddItemModal';

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
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived, query, page, limit]);

  function startEdit(item) {
    setEditId(item._id);
    setDraft({
      type: item.type,
      name: item.name,
      baseContentValue: item.baseContentValue ?? '',
      baseContentUnit: item.baseContentUnit ?? '',
      purchasePackQuantity: item.purchasePackQuantity ?? '',
      purchasePackUnit: item.purchasePackUnit ?? '',
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
      };
      const updated = await updateItem(id, payload);
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
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((it) => it._id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  function handleItemAdded() {
    setPage(1);
    load();
  }

  const baseCols = 6;
  const cols = isEditMode ? baseCols + 2 : baseCols;

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Product List</h2>
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
          className={`button ${isEditMode ? 'primary' : ''}`} 
          onClick={() => setIsEditMode(!isEditMode)}
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
              <th className="th">Type</th>
              <th className="th">Item</th>
              <th className="th" title="Base Content: intrinsic quantity per product. Example: 'X 100 Bags' → 100 bags; '400 ML' → 400 ml.">Base Content</th>
              <th className="th" title="Unit of the base content (e.g., g, kg, ml, l, bags, pieces).">Unit</th>
              <th className="th" title="Purchase Pack: how many base units are in one purchasable unit (defaults to 1).">Purchase Pack</th>
              <th className="th" title="Unit for the purchase pack (e.g., unit, box, bag, pack).">Pack Unit</th>
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
                <tr key={item._id} className={item.archived ? 'row-archived' : undefined}>
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
                        style={{ width: 120 }}
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
                        placeholder="e.g., g, kg, ml, l, pieces"
                        style={{ width: 140 }}
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
                        style={{ width: 120 }}
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
                        placeholder="e.g., pieces, unit, bag, box"
                        style={{ width: 140 }}
                      />
                    ) : (
                      item.purchasePackUnit ?? '-'
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

