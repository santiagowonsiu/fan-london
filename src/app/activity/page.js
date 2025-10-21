'use client';

import { useEffect, useState } from 'react';
import { fetchActivityLogs } from '@/lib/api';

export const dynamic = 'force-dynamic';

const ACTION_LABELS = {
  product_added: 'Product Added',
  product_edited: 'Product Edited',
  product_deleted: 'Product Deleted',
  transaction_added: 'Transaction Added',
  transaction_edited: 'Transaction Edited',
  transaction_deleted: 'Transaction Deleted'
};

const ACTION_COLORS = {
  product_added: { bg: '#d1fae5', color: '#065f46' },
  product_edited: { bg: '#dbeafe', color: '#1e40af' },
  product_deleted: { bg: '#fee2e2', color: '#991b1b' },
  transaction_added: { bg: '#d1fae5', color: '#065f46' },
  transaction_edited: { bg: '#dbeafe', color: '#1e40af' },
  transaction_deleted: { bg: '#fee2e2', color: '#991b1b' }
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [actionFilter, entityFilter]);

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 200 };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (entityFilter !== 'all') params.entityType = entityFilter;
      const data = await fetchActivityLogs(params);
      setLogs(data.logs || []);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  function formatDetails(log) {
    if (!log.details) return null;

    if (log.action.startsWith('transaction')) {
      if (log.action === 'transaction_deleted') {
        return (
          <div style={{ fontSize: 13, color: '#4b5563' }}>
            <div>Direction: {log.details.direction}</div>
            <div>Quantity: {log.details.quantity}</div>
            <div>Original Date: {new Date(log.details.date).toLocaleString()}</div>
          </div>
        );
      }
      if (log.action === 'transaction_edited' && log.details.before && log.details.after) {
        return (
          <div style={{ fontSize: 13, color: '#4b5563', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Before:</div>
              <div>Item: {log.details.before.itemName}</div>
              <div>Direction: {log.details.before.direction}</div>
              <div>Quantity: {log.details.before.quantity}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>After:</div>
              <div>Item: {log.details.after.itemName}</div>
              <div>Direction: {log.details.after.direction}</div>
              <div>Quantity: {log.details.after.quantity}</div>
            </div>
          </div>
        );
      }
    }

    if (log.action.startsWith('product')) {
      if (log.action === 'product_added') {
        return (
          <div style={{ fontSize: 13, color: '#4b5563' }}>
            <div>Type: {log.details.type}</div>
            <div>Base Content: {log.details.baseContentValue} {log.details.baseContentUnit}</div>
            <div>Purchase Pack: {log.details.purchasePackQuantity} {log.details.purchasePackUnit}</div>
          </div>
        );
      }
      if (log.action === 'product_edited' && log.details.before && log.details.after) {
        const changes = [];
        if (log.details.before.name !== log.details.after.name) {
          changes.push({ field: 'Name', before: log.details.before.name, after: log.details.after.name });
        }
        if (log.details.before.type !== log.details.after.type) {
          changes.push({ field: 'Type', before: log.details.before.type, after: log.details.after.type });
        }
        if (log.details.before.archived !== log.details.after.archived) {
          changes.push({ field: 'Archived', before: String(log.details.before.archived), after: String(log.details.after.archived) });
        }
        
        return (
          <div style={{ fontSize: 13, color: '#4b5563' }}>
            {changes.length > 0 ? (
              changes.map((change, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  <strong>{change.field}:</strong> {change.before} → {change.after}
                </div>
              ))
            ) : (
              <div>Minor field updates</div>
            )}
          </div>
        );
      }
      if (log.action === 'product_deleted') {
        return (
          <div style={{ fontSize: 13, color: '#4b5563' }}>
            <div>Type: {log.details.type}</div>
            <div>Name: {log.details.name}</div>
          </div>
        );
      }
    }

    return null;
  }

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Activity Log</h2>
      
      <div className="controls" style={{ marginBottom: 20 }}>
        <select
          className="select"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="all">All Entities</option>
          <option value="product">Products</option>
          <option value="transaction">Transactions</option>
        </select>

        <select
          className="select"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All Actions</option>
          <option value="product_added">Product Added</option>
          <option value="product_edited">Product Edited</option>
          <option value="product_deleted">Product Deleted</option>
          <option value="transaction_added">Transaction Added</option>
          <option value="transaction_edited">Transaction Edited</option>
          <option value="transaction_deleted">Transaction Deleted</option>
        </select>

        <button type="button" className="button" onClick={loadLogs} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Date/Time</th>
              <th className="th">Action</th>
              <th className="th">Entity</th>
              <th className="th">Justification</th>
              <th className="th">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="td" colSpan={5}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td className="td" colSpan={5}>No activity logs</td></tr>
            ) : logs.map((log) => (
              <>
                <tr key={log._id}>
                  <td className="td" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="td">
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: ACTION_COLORS[log.action]?.bg || '#f3f4f6',
                      color: ACTION_COLORS[log.action]?.color || '#374151'
                    }}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="td">
                    <div style={{ fontWeight: 500 }}>{log.entityName || '-'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{log.entityType}</div>
                  </td>
                  <td className="td">
                    {log.justification ? (
                      <div style={{ fontSize: 13, fontStyle: 'italic', color: '#4b5563' }}>
                        "{log.justification}"
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>-</span>
                    )}
                  </td>
                  <td className="td">
                    {log.details && (
                      <button
                        type="button"
                        className="button"
                        onClick={() => toggleExpanded(log._id)}
                        style={{ fontSize: 12, padding: '4px 8px' }}
                      >
                        {expandedId === log._id ? 'Hide' : 'Show'} Details
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === log._id && (
                  <tr>
                    <td className="td" colSpan={5} style={{ background: '#f9fafb', padding: 16 }}>
                      {formatDetails(log)}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

