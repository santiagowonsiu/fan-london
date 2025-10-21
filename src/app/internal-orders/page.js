'use client';

import { useEffect, useState } from 'react';
import { fetchInternalOrders, createInternalOrder, updateInternalOrder, fetchItems, fetchStock } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function InternalOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('byOrder'); // 'byOrder' or 'allPending'
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Add order form
  const [showAddForm, setShowAddForm] = useState(false);
  const [orderGroup, setOrderGroup] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [stockData, setStockData] = useState({});

  useEffect(() => {
    loadOrders();
    loadStock();
  }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchInternalOrders({ status: statusFilter === 'all' ? undefined : statusFilter });
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStock() {
    try {
      const data = await fetchStock();
      const stockMap = {};
      (data.stock || []).forEach(item => {
        stockMap[item.itemId] = {
          stockBase: item.stockBase || 0,
          stockPack: item.stockPack || 0
        };
      });
      setStockData(stockMap);
    } catch (e) {
      console.error('Failed to load stock:', e);
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!itemSearch.trim()) {
        setItemSuggestions([]);
        return;
      }
      try {
        const data = await fetchItems({ q: itemSearch, limit: 10, includeArchived: false });
        setItemSuggestions(data.items || []);
      } catch (e) {
        console.error(e);
      }
    };
    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [itemSearch]);

  function addItemToOrder(item) {
    setOrderItems([...orderItems, {
      itemId: item._id,
      itemName: item.name,
      itemType: item.type,
      baseContentValue: item.baseContentValue || 1,
      baseContentUnit: item.baseContentUnit || 'unit',
      purchasePackUnit: item.purchasePackUnit || 'unit',
      quantity: 1,
      unitUsed: 'pack'
    }]);
    setItemSearch('');
    setItemSuggestions([]);
  }

  function removeItemFromOrder(index) {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }

  function updateOrderItem(index, field, value) {
    const updated = [...orderItems];
    updated[index][field] = value;
    
    // Calculate both quantities
    if (field === 'quantity' || field === 'unitUsed') {
      const qty = Number(updated[index].quantity);
      const baseContent = updated[index].baseContentValue;
      
      if (updated[index].unitUsed === 'pack') {
        updated[index].quantityPack = qty;
        updated[index].quantityBase = qty * baseContent;
      } else {
        updated[index].quantityBase = qty;
        updated[index].quantityPack = qty / baseContent;
      }
    }
    
    setOrderItems(updated);
  }

  async function submitOrder() {
    if (orderItems.length === 0) {
      alert('Add at least one item');
      return;
    }

    const itemsToSave = orderItems.map(item => {
      const stock = stockData[item.itemId] || { stockPack: 0 };
      const hasStock = stock.stockPack >= item.quantityPack;
      
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        quantityBase: item.quantityBase,
        quantityPack: item.quantityPack,
        unitUsed: item.unitUsed,
        hasStock,
        needsToBuy: !hasStock
      };
    });

    try {
      await createInternalOrder({
        orderGroup: orderGroup || `Order - ${new Date().toLocaleDateString()}`,
        items: itemsToSave
      });
      setShowAddForm(false);
      setOrderGroup('');
      setOrderItems([]);
      loadOrders();
      alert('Internal order created');
    } catch (e) {
      alert(e.message);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      await updateInternalOrder(orderId, { status: newStatus });
      loadOrders();
    } catch (e) {
      alert(e.message);
    }
  }

  // Flatten all items for "All Pending" view
  const allPendingItems = orders
    .filter(order => order.status === 'pending')
    .flatMap(order => 
      order.items.map(item => ({
        ...item,
        orderId: order._id,
        orderGroup: order.orderGroup,
        orderCreatedAt: order.createdAt
      }))
    );

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Internal Orders</h2>

      {/* Controls */}
      <div className="controls" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className="button primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ New Order'}
        </button>

        <div style={{ display: 'inline-flex', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
          <button
            type="button"
            className="button"
            style={{
              border: 'none',
              background: viewMode === 'byOrder' ? '#111' : 'white',
              color: viewMode === 'byOrder' ? 'white' : '#111'
            }}
            onClick={() => setViewMode('byOrder')}
          >
            By Order
          </button>
          <button
            type="button"
            className="button"
            style={{
              border: 'none',
              background: viewMode === 'allPending' ? '#111' : 'white',
              color: viewMode === 'allPending' ? 'white' : '#111'
            }}
            onClick={() => setViewMode('allPending')}
          >
            All Pending Items
          </button>
        </div>

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="purchased">Purchased</option>
          <option value="rejected">Rejected</option>
        </select>

        <button type="button" className="button" onClick={loadOrders} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      {/* Add Order Form */}
      {showAddForm && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: '#f9fafb', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>New Internal Order</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Order Group <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
            </label>
            <input
              className="input"
              placeholder="e.g., Morning - Oct 21, Afternoon, etc."
              value={orderGroup}
              onChange={(e) => setOrderGroup(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>

          <div style={{ marginBottom: 16, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Add Items
            </label>
            <input
              className="input input-full"
              placeholder="Search items to add..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
            {itemSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                maxHeight: 200,
                overflowY: 'auto',
                zIndex: 10,
                marginTop: 4
              }}>
                {itemSuggestions.map(item => (
                  <div
                    key={item._id}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                    onClick={() => addItemToOrder(item)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {item.type} • Base: {item.baseContentValue} {item.baseContentUnit}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Items Table */}
          {orderItems.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th className="th">Item</th>
                    <th className="th">Unit</th>
                    <th className="th">Quantity</th>
                    <th className="th">Stock Status</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, idx) => {
                    const stock = stockData[item.itemId] || { stockPack: 0 };
                    const hasStock = stock.stockPack >= (item.quantityPack || item.quantity);
                    
                    return (
                      <tr key={idx}>
                        <td className="td">
                          <div style={{ fontWeight: 500 }}>{item.itemName}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{item.itemType}</div>
                        </td>
                        <td className="td">
                          <select
                            className="select"
                            value={item.unitUsed}
                            onChange={(e) => updateOrderItem(idx, 'unitUsed', e.target.value)}
                            style={{ width: 120 }}
                          >
                            <option value="pack">{item.purchasePackUnit}</option>
                            <option value="base">{item.baseContentUnit}</option>
                          </select>
                        </td>
                        <td className="td">
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(idx, 'quantity', e.target.value)}
                            style={{ width: 100 }}
                          />
                        </td>
                        <td className="td">
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background: hasStock ? '#d1fae5' : '#fee2e2',
                            color: hasStock ? '#065f46' : '#991b1b'
                          }}>
                            {hasStock ? '✓ In Stock' : '✗ Need to Buy'}
                          </span>
                        </td>
                        <td className="td">
                          <button
                            type="button"
                            className="button"
                            onClick={() => removeItemFromOrder(idx)}
                            style={{ background: '#dc2626', color: 'white', fontSize: 12, padding: '4px 8px' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="button" onClick={() => { setShowAddForm(false); setOrderItems([]); }}>
              Cancel
            </button>
            <button type="button" className="button primary" onClick={submitOrder}>
              Create Order
            </button>
          </div>
        </div>
      )}

      {/* View by Order */}
      {viewMode === 'byOrder' && (
        <div>
          {loading ? (
            <div>Loading...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>No orders found</div>
          ) : (
            orders.map(order => (
              <div
                key={order._id}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>
                      {order.orderGroup || 'Unnamed Order'}
                    </h3>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: order.status === 'purchased' ? '#d1fae5' : order.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: order.status === 'purchased' ? '#065f46' : order.status === 'rejected' ? '#991b1b' : '#92400e'
                    }}>
                      {order.status.toUpperCase()}
                    </span>
                    {order.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="button"
                          onClick={() => updateOrderStatus(order._id, 'purchased')}
                          style={{ background: '#059669', color: 'white', fontSize: 13 }}
                        >
                          Mark Purchased
                        </button>
                        <button
                          type="button"
                          className="button"
                          onClick={() => updateOrderStatus(order._id, 'rejected')}
                          style={{ background: '#dc2626', color: 'white', fontSize: 13 }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th className="th">Item</th>
                      <th className="th">Type</th>
                      <th className="th" style={{ textAlign: 'right' }}>Quantity</th>
                      <th className="th">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="td">{item.itemId?.name || '-'}</td>
                        <td className="td" style={{ color: '#6b7280' }}>{item.itemId?.type || '-'}</td>
                        <td className="td" style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>
                            {(item.quantityPack || item.quantity || 0).toFixed(2)} {item.itemId?.purchasePackUnit || 'unit'}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>
                            ({(item.quantityBase || item.quantity || 0).toFixed(2)} {item.itemId?.baseContentUnit || 'unit'})
                          </div>
                        </td>
                        <td className="td">
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background: item.hasStock ? '#d1fae5' : '#fee2e2',
                            color: item.hasStock ? '#065f46' : '#991b1b'
                          }}>
                            {item.hasStock ? '✓ In Stock' : '✗ Need to Buy'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Pending Items View */}
      {viewMode === 'allPending' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Order Group</th>
                <th className="th">Date/Time</th>
                <th className="th">Item</th>
                <th className="th">Type</th>
                <th className="th" style={{ textAlign: 'right' }}>Quantity</th>
                <th className="th">Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="td" colSpan={6}>Loading...</td></tr>
              ) : allPendingItems.length === 0 ? (
                <tr><td className="td" colSpan={6}>No pending items</td></tr>
              ) : allPendingItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="td">{item.orderGroup || '-'}</td>
                  <td className="td" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(item.orderCreatedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="td">{item.itemId?.name || '-'}</td>
                  <td className="td" style={{ color: '#6b7280' }}>{item.itemId?.type || '-'}</td>
                  <td className="td" style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>
                      {(item.quantityPack || item.quantity || 0).toFixed(2)} {item.itemId?.purchasePackUnit || 'unit'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      ({(item.quantityBase || item.quantity || 0).toFixed(2)} {item.itemId?.baseContentUnit || 'unit'})
                    </div>
                  </td>
                  <td className="td">
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: item.hasStock ? '#d1fae5' : '#fee2e2',
                      color: item.hasStock ? '#065f46' : '#991b1b'
                    }}>
                      {item.hasStock ? '✓ In Stock' : '✗ Need to Buy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

