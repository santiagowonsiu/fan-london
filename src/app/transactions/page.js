'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

const API_BASE = '/api';

async function fetchItems(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.includeArchived === false) query.set('archived', 'false');
  const res = await fetch(`${API_BASE}/items?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

async function postTransaction(data) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create transaction');
  }
  return res.json();
}

export default function TransactionsPage() {
  const [direction, setDirection] = useState('out');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [usePack, setUsePack] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const run = async () => {
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        return;
      }
      try {
        const data = await fetchItems({ q, limit: 10, includeArchived: false });
        setSuggestions(data.items || []);
      } catch {
        // ignore
      }
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [query]);

  function currentUnitLabel() {
    if (!selectedItem) return '';
    if (usePack) return selectedItem.purchasePackUnit || 'unit';
    return selectedItem.baseContentUnit || 'unit';
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!selectedItem) return alert('Select an item');
    const qtyNum = Number(quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return alert('Enter a valid quantity');
    setSubmitting(true);
    try {
      await postTransaction({ itemId: selectedItem._id, direction, quantity: qtyNum });
      setQuery('');
      setSelectedItem(null);
      setSuggestions([]);
      setQuantity('');
      alert('Transaction saved');
    } catch (e2) {
      alert(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Transactions</h2>
      <form onSubmit={onSubmit} className="controls" style={{ gap: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          <button type="button" className="button" style={{ border: 'none', background: direction === 'in' ? '#111' : 'white', color: direction === 'in' ? 'white' : '#111' }} onClick={() => setDirection('in')}>Input</button>
          <button type="button" className="button" style={{ border: 'none', background: direction === 'out' ? '#111' : 'white', color: direction === 'out' ? 'white' : '#111' }} onClick={() => setDirection('out')}>Output</button>
        </div>

        <div style={{ position: 'relative', minWidth: 320, flex: '1 1 420px' }}>
          <input
            className="input input-full"
            placeholder="Search item..."
            value={selectedItem ? selectedItem.name : query}
            onChange={(e) => { setSelectedItem(null); setQuery(e.target.value); }}
          />
          {suggestions.length > 0 && !selectedItem && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', zIndex: 10, borderRadius: 6, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
              {suggestions.map((it) => (
                <div key={it._id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }} onClick={() => { setSelectedItem(it); setQuery(''); setSuggestions([]); }}>
                  <div style={{ fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{it.type}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Base: {it.baseContentValue} {it.baseContentUnit || 'unit'} • Pack: {it.purchasePackQuantity} {it.purchasePackUnit || 'unit'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ width: 120 }}
            required
          />
          <label className="checkbox" title="Toggle quantity unit between base content and purchase pack">
            <input type="checkbox" checked={usePack} onChange={(e) => setUsePack(e.target.checked)} />
            Use Pack
          </label>
          <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{currentUnitLabel()}</span>
        </div>

        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Confirm'}
        </button>
      </form>
    </div>
  );
}

