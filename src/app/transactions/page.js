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
  const [observations, setObservations] = useState('');
  const [personName, setPersonName] = useState('');
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

  function currentUnitInfo() {
    if (!selectedItem) return null;
    return {
      base: `${selectedItem.baseContentValue || 1} ${selectedItem.baseContentUnit || 'unit'}`,
      pack: `${selectedItem.purchasePackQuantity || 1} ${selectedItem.purchasePackUnit || 'unit'}`
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!selectedItem) return alert('Select an item');
    const qtyNum = Number(quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return alert('Enter a valid quantity');
    
    setSubmitting(true);
    try {
      await postTransaction({ 
        itemId: selectedItem._id, 
        direction, 
        quantity: qtyNum,
        observations: observations.trim(),
        personName: personName.trim()
      });
      
      // Reset form
      setQuery('');
      setSelectedItem(null);
      setSuggestions([]);
      setQuantity('');
      setObservations('');
      setPersonName('');
      setUsePack(false);
      
      alert('Transaction saved successfully');
    } catch (e2) {
      alert(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  const unitInfo = currentUnitInfo();

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>New Transaction</h2>
      
      <form onSubmit={onSubmit} style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* 1. Direction Toggle */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            1. Transaction Type
          </label>
          <div style={{ 
            display: 'inline-flex', 
            border: '2px solid #e5e7eb', 
            borderRadius: 8, 
            overflow: 'hidden',
            width: '100%',
            maxWidth: 300
          }}>
            <button 
              type="button" 
              className="button" 
              style={{ 
                flex: 1,
                border: 'none', 
                background: direction === 'in' ? '#059669' : 'white', 
                color: direction === 'in' ? 'white' : '#111',
                fontWeight: 600,
                padding: '12px 24px',
                fontSize: 16
              }} 
              onClick={() => setDirection('in')}
            >
              Input
            </button>
            <button 
              type="button" 
              className="button" 
              style={{ 
                flex: 1,
                border: 'none', 
                background: direction === 'out' ? '#dc2626' : 'white', 
                color: direction === 'out' ? 'white' : '#111',
                fontWeight: 600,
                padding: '12px 24px',
                fontSize: 16
              }} 
              onClick={() => setDirection('out')}
            >
              Output
            </button>
          </div>
        </div>

        {/* 2. Select Item */}
        <div style={{ marginBottom: 24, position: 'relative' }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            2. Select Item <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            className="input input-full"
            placeholder="Search for an item..."
            value={selectedItem ? selectedItem.name : query}
            onChange={(e) => { 
              setSelectedItem(null); 
              setQuery(e.target.value); 
            }}
            style={{ 
              width: '100%', 
              padding: '12px 16px',
              fontSize: 15,
              border: selectedItem ? '2px solid #059669' : '1px solid #e5e7eb'
            }}
            required
          />
          {suggestions.length > 0 && !selectedItem && (
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
              maxHeight: 300, 
              overflowY: 'auto',
              marginTop: 4,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
              {suggestions.map((it) => (
                <div 
                  key={it._id} 
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6'
                  }} 
                  onClick={() => { 
                    setSelectedItem(it); 
                    setQuery(''); 
                    setSuggestions([]); 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{it.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{it.type}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    Base: {it.baseContentValue} {it.baseContentUnit || 'unit'} • 
                    Pack: {it.purchasePackQuantity} {it.purchasePackUnit || 'unit'}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedItem && unitInfo && (
            <div style={{ 
              marginTop: 12, 
              padding: '12px 16px', 
              background: '#f0fdf4', 
              borderRadius: 8,
              border: '1px solid #86efac'
            }}>
              <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginBottom: 6 }}>
                ✓ Selected: {selectedItem.name}
              </div>
              <div style={{ fontSize: 12, color: '#4b5563' }}>
                Base Content: <strong>{unitInfo.base}</strong> • 
                Purchase Pack: <strong>{unitInfo.pack}</strong>
              </div>
            </div>
          )}
        </div>

        {/* 3. Unit Type Toggle */}
        {selectedItem && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              3. Unit Type
            </label>
            <div style={{ 
              display: 'inline-flex', 
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
                  background: !usePack ? '#111' : 'white', 
                  color: !usePack ? 'white' : '#111',
                  padding: '10px 20px'
                }} 
                onClick={() => setUsePack(false)}
              >
                Base Content ({selectedItem.baseContentUnit || 'unit'})
              </button>
              <button 
                type="button" 
                className="button" 
                style={{ 
                  flex: 1,
                  border: 'none', 
                  background: usePack ? '#111' : 'white', 
                  color: usePack ? 'white' : '#111',
                  padding: '10px 20px'
                }} 
                onClick={() => setUsePack(true)}
              >
                Purchase Pack ({selectedItem.purchasePackUnit || 'unit'})
              </button>
            </div>
          </div>
        )}

        {/* 4. Quantity */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            4. Quantity <span style={{ color: '#dc2626' }}>*</span>
            {selectedItem && (
              <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                (in {currentUnitLabel()})
              </span>
            )}
          </label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', fontSize: 16 }}
            required
          />
        </div>

        {/* 5. Observations */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            5. Observations <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
          </label>
          <textarea
            className="input"
            placeholder="Any notes or observations about this transaction..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* 6. Person Name */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            6. Person Name <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            className="input"
            type="text"
            placeholder="Enter your name"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
            required
          />
        </div>

        {/* Submit Button */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          justifyContent: 'flex-end',
          paddingTop: 16,
          borderTop: '1px solid #e5e7eb'
        }}>
          <button 
            type="button"
            className="button"
            onClick={() => {
              setSelectedItem(null);
              setQuery('');
              setSuggestions([]);
              setQuantity('');
              setObservations('');
              setPersonName('');
              setUsePack(false);
            }}
            disabled={submitting}
          >
            Clear Form
          </button>
          <button 
            type="submit" 
            className="button primary" 
            disabled={submitting}
            style={{ 
              padding: '12px 32px',
              fontSize: 16,
              fontWeight: 600,
              background: direction === 'in' ? '#059669' : '#dc2626',
              color: 'white'
            }}
          >
            {submitting ? 'Saving...' : `Confirm ${direction === 'in' ? 'Input' : 'Output'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
