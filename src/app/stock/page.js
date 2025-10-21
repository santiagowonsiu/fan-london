'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

const API_BASE = '/api';

async function fetchStock() {
  const res = await fetch(`${API_BASE}/transactions/stock`);
  if (!res.ok) throw new Error('Failed to fetch stock');
  return res.json();
}

export default function CurrentStockPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchStock();
        setRows(data.stock || []);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Current Stock</h2>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Item</th>
              <th className="th">Type</th>
              <th className="th" style={{ textAlign: 'right' }} title="Stock in base content units">Base Stock</th>
              <th className="th" style={{ textAlign: 'right' }} title="Stock in purchase pack units">Pack Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={4}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="td" colSpan={4}>No data</td></tr>
            ) : rows.map((r) => (
              <tr key={r.itemId}>
                <td className="td">{r.name}</td>
                <td className="td" style={{ color: '#6b7280' }}>{r.type}</td>
                <td className="td" style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontWeight: 600,
                    color: (r.stockBase || 0) < 0 ? '#dc2626' : '#059669'
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
                    color: (r.stockPack || 0) < 0 ? '#dc2626' : '#059669'
                  }}>
                    {(r.stockPack || 0).toFixed(2)}
                  </span>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                    {r.purchasePackUnit || 'unit'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

