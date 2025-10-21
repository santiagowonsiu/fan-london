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
              <th className="th">Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={3}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="td" colSpan={3}>No data</td></tr>
            ) : rows.map((r) => (
              <tr key={r.itemId}>
                <td className="td">{r.name}</td>
                <td className="td">{r.type}</td>
                <td className="td">{r.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

