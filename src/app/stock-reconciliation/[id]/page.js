'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchStockReconciliation } from '@/lib/api';

export default function StockReconciliationReportPage() {
  const params = useParams();
  const router = useRouter();
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('adjusted'); // adjusted, unchanged, invalid

  useEffect(() => {
    loadReconciliation();
  }, [params.id]);

  async function loadReconciliation() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStockReconciliation(params.id);
      setReconciliation(data.reconciliation);
    } catch (e) {
      setError(e.message || 'Failed to load reconciliation');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div>Loading reconciliation report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ color: '#b91c1c', marginBottom: 16 }}>{error}</div>
        <button type="button" className="button" onClick={() => router.back()}>
          ← Go Back
        </button>
      </div>
    );
  }

  if (!reconciliation) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div>Reconciliation not found</div>
      </div>
    );
  }

  const adjustedItems = reconciliation.adjustedItems || [];
  const unchangedItems = reconciliation.unchangedItems || [];
  const invalidItems = reconciliation.invalidItems || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button 
          type="button" 
          className="button" 
          onClick={() => router.push('/stock')}
          style={{ marginBottom: 16 }}
        >
          ← Back to Current Stock
        </button>
        
        <h2 className="page-title" style={{ fontSize: 20, marginBottom: 8 }}>
          Stock Reconciliation Report
        </h2>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          {new Date(reconciliation.reconciliationDate).toLocaleString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{
          padding: 20,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Total Items</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{reconciliation.totalItems}</div>
        </div>

        <div style={{
          padding: 20,
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>Adjusted</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#92400e' }}>
            {reconciliation.adjustedCount}
          </div>
        </div>

        <div style={{
          padding: 20,
          background: '#d1fae5',
          border: '1px solid #6ee7b7',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 13, color: '#065f46', marginBottom: 4 }}>Unchanged</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#065f46' }}>
            {reconciliation.unchangedCount}
          </div>
        </div>

        <div style={{
          padding: 20,
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>Invalid</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#991b1b' }}>
            {reconciliation.invalidCount}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{
        padding: 20,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        marginBottom: 24
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
          <div>
            <span style={{ color: '#6b7280' }}>Performed By:</span>{' '}
            <span style={{ fontWeight: 600 }}>{reconciliation.performedBy}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Upload Date:</span>{' '}
            <span>{new Date(reconciliation.uploadDate).toLocaleString()}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>File Name:</span>{' '}
            <span>{reconciliation.fileName}</span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>File Rows:</span>{' '}
            <span>{reconciliation.fileRows}</span>
          </div>
        </div>
        {reconciliation.notes && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Notes:</div>
            <div style={{ fontSize: 14 }}>{reconciliation.notes}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e5e7eb' }}>
          <button
            type="button"
            onClick={() => setActiveTab('adjusted')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'adjusted' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'adjusted' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'adjusted' ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: -2
            }}
          >
            Adjusted Items ({adjustedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unchanged')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'unchanged' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'unchanged' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'unchanged' ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: -2
            }}
          >
            Unchanged Items ({unchangedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invalid')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'invalid' ? '2px solid #3b82f6' : 'none',
              color: activeTab === 'invalid' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'invalid' ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: -2
            }}
          >
            Invalid Items ({invalidItems.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="table-wrap">
        {activeTab === 'adjusted' && (
          <table className="table">
            <thead>
              <tr>
                <th className="th">Type</th>
                <th className="th">Item</th>
                <th className="th" style={{ textAlign: 'right' }}>Previous Pack</th>
                <th className="th" style={{ textAlign: 'right' }}>New Pack</th>
                <th className="th" style={{ textAlign: 'right' }}>Pack Diff</th>
                <th className="th" style={{ textAlign: 'right' }}>Previous Base</th>
                <th className="th" style={{ textAlign: 'right' }}>New Base</th>
                <th className="th" style={{ textAlign: 'right' }}>Base Diff</th>
                <th className="th">Input</th>
              </tr>
            </thead>
            <tbody>
              {adjustedItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="td" style={{ textAlign: 'center', color: '#6b7280' }}>
                    No adjusted items
                  </td>
                </tr>
              ) : (
                adjustedItems.map((item, index) => (
                  <tr key={index}>
                    <td className="td">{item.type}</td>
                    <td className="td" style={{ fontWeight: 600 }}>{item.itemName}</td>
                    <td className="td" style={{ textAlign: 'right' }}>
                      {item.previousPackStock.toFixed(2)}
                    </td>
                    <td className="td" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {item.newPackStock.toFixed(2)}
                    </td>
                    <td className="td" style={{ 
                      textAlign: 'right', 
                      color: item.packDifference >= 0 ? '#059669' : '#dc2626',
                      fontWeight: 600
                    }}>
                      {item.packDifference >= 0 ? '+' : ''}{item.packDifference.toFixed(2)}
                    </td>
                    <td className="td" style={{ textAlign: 'right' }}>
                      {item.previousBaseStock.toFixed(2)}
                    </td>
                    <td className="td" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {item.newBaseStock.toFixed(2)}
                    </td>
                    <td className="td" style={{ 
                      textAlign: 'right', 
                      color: item.baseDifference >= 0 ? '#059669' : '#dc2626',
                      fontWeight: 600
                    }}>
                      {item.baseDifference >= 0 ? '+' : ''}{item.baseDifference.toFixed(2)}
                    </td>
                    <td className="td">
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#f3f4f6',
                        color: '#374151'
                      }}>
                        {item.inputField === 'pack' ? 'Pack' : item.inputField === 'base' ? 'Base' : 'Both'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'unchanged' && (
          <table className="table">
            <thead>
              <tr>
                <th className="th">Type</th>
                <th className="th">Item</th>
                <th className="th" style={{ textAlign: 'right' }}>Pack Stock</th>
                <th className="th" style={{ textAlign: 'right' }}>Base Stock</th>
                <th className="th">Input</th>
              </tr>
            </thead>
            <tbody>
              {unchangedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="td" style={{ textAlign: 'center', color: '#6b7280' }}>
                    No unchanged items
                  </td>
                </tr>
              ) : (
                unchangedItems.map((item, index) => (
                  <tr key={index}>
                    <td className="td">{item.type}</td>
                    <td className="td">{item.itemName}</td>
                    <td className="td" style={{ textAlign: 'right' }}>
                      {item.newPackStock.toFixed(2)}
                    </td>
                    <td className="td" style={{ textAlign: 'right' }}>
                      {item.newBaseStock.toFixed(2)}
                    </td>
                    <td className="td">
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#f3f4f6',
                        color: '#374151'
                      }}>
                        {item.inputField === 'pack' ? 'Pack' : item.inputField === 'base' ? 'Base' : 'Both'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'invalid' && (
          <table className="table">
            <thead>
              <tr>
                <th className="th">Row #</th>
                <th className="th">Type</th>
                <th className="th">Item Name</th>
                <th className="th">Pack Input</th>
                <th className="th">Base Input</th>
                <th className="th">Error Message</th>
              </tr>
            </thead>
            <tbody>
              {invalidItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="td" style={{ textAlign: 'center', color: '#6b7280' }}>
                    No invalid items
                  </td>
                </tr>
              ) : (
                invalidItems.map((item, index) => (
                  <tr key={index}>
                    <td className="td">{item.rowNumber}</td>
                    <td className="td">{item.type}</td>
                    <td className="td">{item.itemName}</td>
                    <td className="td">{item.inputPackValue || '-'}</td>
                    <td className="td">{item.inputBaseValue || '-'}</td>
                    <td className="td" style={{ color: '#dc2626' }}>
                      {item.errorMessage}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Download Report Button */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          type="button"
          className="button"
          onClick={() => {
            // Generate CSV report
            let csvContent = `Stock Reconciliation Report\n`;
            csvContent += `Date: ${new Date(reconciliation.reconciliationDate).toLocaleString()}\n`;
            csvContent += `Performed By: ${reconciliation.performedBy}\n`;
            csvContent += `\n`;
            csvContent += `Summary:\n`;
            csvContent += `Total Items,${reconciliation.totalItems}\n`;
            csvContent += `Adjusted,${reconciliation.adjustedCount}\n`;
            csvContent += `Unchanged,${reconciliation.unchangedCount}\n`;
            csvContent += `Invalid,${reconciliation.invalidCount}\n`;
            csvContent += `\n`;
            
            if (adjustedItems.length > 0) {
              csvContent += `\nAdjusted Items:\n`;
              csvContent += `Type,Item,Previous Pack,New Pack,Pack Diff,Previous Base,New Base,Base Diff\n`;
              adjustedItems.forEach(item => {
                csvContent += `${item.type},${item.itemName},${item.previousPackStock},${item.newPackStock},${item.packDifference},${item.previousBaseStock},${item.newBaseStock},${item.baseDifference}\n`;
              });
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reconciliation-report-${new Date(reconciliation.reconciliationDate).toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
        >
          📥 Download Report CSV
        </button>
      </div>
    </div>
  );
}

