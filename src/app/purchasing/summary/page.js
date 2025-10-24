'use client';

import { useEffect, useState } from 'react';
import { fetchPurchasingSummary } from '@/lib/api';

export default function PurchasingSummaryPage() {
  const [summary, setSummary] = useState({
    externalOrders: { total: 0, paid: 0, unpaid: 0, count: 0 },
    directPurchases: { total: 0, paid: 0, unpaid: 0, count: 0 },
    personalExpenses: { total: 0, count: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    loadSummary();
  }, [dateRange, supplierFilter, paymentFilter]);

  async function loadSummary() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPurchasingSummary({ 
        dateRange, 
        supplier: supplierFilter, 
        payment: paymentFilter 
      });
      setSummary(data.summary);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const grandTotal = summary.externalOrders.total + summary.directPurchases.total + summary.personalExpenses.total;
  const totalPaid = summary.externalOrders.paid + summary.directPurchases.paid;
  const totalUnpaid = summary.externalOrders.unpaid + summary.directPurchases.unpaid;

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Purchasing Summary</h2>

      {/* Controls */}
      <div className="controls" style={{ marginBottom: 20 }}>
        <select
          className="select"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>

        <button type="button" className="button" onClick={loadSummary} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
            {/* Grand Total */}
            <div className="section" style={{ padding: 20, background: '#e0f2fe', border: '1px solid #90cdf4' }}>
              <h3 style={{ marginTop: 0, color: '#0369a1' }}>Overall Purchasing</h3>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>£{grandTotal.toFixed(2)}</div>
              <div style={{ fontSize: 14, color: '#0369a1' }}>
                Total Paid: <span style={{ fontWeight: 600 }}>£{totalPaid.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#0369a1' }}>
                Total Unpaid: <span style={{ fontWeight: 600 }}>£{totalUnpaid.toFixed(2)}</span>
              </div>
            </div>

            {/* External Orders Summary */}
            <div className="section" style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>External Orders</h3>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>£{summary.externalOrders.total.toFixed(2)}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Paid: <span style={{ fontWeight: 600 }}>£{summary.externalOrders.paid.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Unpaid: <span style={{ fontWeight: 600 }}>£{summary.externalOrders.unpaid.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 5 }}>
                {summary.externalOrders.count} orders
              </div>
            </div>

            {/* Direct Purchases Summary */}
            <div className="section" style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Direct Purchases</h3>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>£{summary.directPurchases.total.toFixed(2)}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Paid: <span style={{ fontWeight: 600 }}>£{summary.directPurchases.paid.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Unpaid: <span style={{ fontWeight: 600 }}>£{summary.directPurchases.unpaid.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 5 }}>
                {summary.directPurchases.count} purchases
              </div>
            </div>

            {/* Personal Expenses Summary */}
            <div className="section" style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Personal Expenses</h3>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>£{summary.personalExpenses.total.toFixed(2)}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Reimbursed: <span style={{ fontWeight: 600 }}>£{summary.personalExpenses.reimbursed?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Pending: <span style={{ fontWeight: 600 }}>£{(summary.personalExpenses.total - (summary.personalExpenses.reimbursed || 0)).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 5 }}>
                {summary.personalExpenses.count} expenses
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="section" style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Export Data</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Download purchasing data for accounting or analysis</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="button primary">
                Export to CSV
              </button>
              <button className="button" style={{ background: '#059669', color: 'white' }}>
                Export to Excel
              </button>
              <button className="button" style={{ background: '#6b7280', color: 'white' }}>
                Generate Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}