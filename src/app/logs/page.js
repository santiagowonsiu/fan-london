'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

const API_BASE = '/api';

async function fetchTransactions(params = {}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page || 1));
  query.set('limit', String(params.limit || 50));
  if (params.direction) query.set('direction', params.direction);
  if (params.itemId) query.set('itemId', params.itemId);
  const res = await fetch(`${API_BASE}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export default function TransactionLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchTransactions({ limit: 50 });
        setRows(data.transactions || []);
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
      <h2 className="page-title" style={{ fontSize: 20 }}>Transaction Logs</h2>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Item</th>
              <th className="th">Direction</th>
              <th className="th">Quantity</th>
              <th className="th">Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={4}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="td" colSpan={4}>No transactions</td></tr>
            ) : rows.map((tx) => (
              <tr key={tx._id}>
                <td className="td">{tx.itemId?.name || '-'}</td>
                <td className="td">{tx.direction}</td>
                <td className="td">{tx.quantity}</td>
                <td className="td">{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

