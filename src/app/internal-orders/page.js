'use client';

import { useEffect, useState } from 'react';
import { fetchInternalOrders, createInternalOrder, updateInternalOrder, fetchItems, fetchStock } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function InternalOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('byOrder');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Add order form
  const [showAddForm, setShowAddForm] = useState(false);
  const [department, setDepartment] = useState('Kitchen');
  const [orderGroup, setOrderGroup] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [stockData, setStockData] = useState({});
  const [orderNotes, setOrderNotes] = useState('');

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
      unitUsed: 'pack',
      status: 'pending'
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
      const hasStock = stock.stockPack >= (item.quantityPack || item.quantity);
      
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        quantityBase: item.quantityBase,
        quantityPack: item.quantityPack,
        unitUsed: item.unitUsed,
        hasStock,
        needsToBuy: !hasStock,
        status: 'pending'
      };
    });

    try {
      await createInternalOrder({
        department,
        orderGroup: orderGroup.trim() || undefined,
        items: itemsToSave,
        notes: orderNotes.trim() || undefined
      });
      setShowAddForm(false);
      setDepartment('Kitchen');
      setOrderGroup('');
      setOrderItems([]);
      setOrderNotes('');
      loadOrders();
      alert('Internal order created');
    } catch (e) {
      alert(e.message);
    }
  }

  async function updateItemStatus(orderId, itemIndex, newStatus) {
    try {
      const order = orders.find(o => o._id === orderId);
      if (!order) return;

      const updatedItems = [...order.items];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: newStatus };

      await updateInternalOrder(orderId, { items: updatedItems });
      loadOrders();
    } catch (e) {
      alert(e.message);
    }
  }

  // Flatten all items for "All Pending" view
  const allPendingItems = orders
    .filter(order => {
      const status = order.overallStatus || 'pending';
      return status !== 'completed' && status !== 'rejected';
    })
    .flatMap(order => 
      order.items
        .filter(item => (item.status || 'pending') === 'pending')
        .map(item => ({
          ...item,
          orderId: order._id,
          department: order.department,
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
          <option value="completed">Completed</option>
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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Department <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                className="select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%' }}
                required
              >
                <option value="Kitchen">Kitchen</option>
                <option value="Bar">Bar</option>
                <option value="FOH">FOH (Front of House)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Order Name <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
              </label>
              <input
                className="input input-full"
                placeholder="e.g., Morning order, Lunch prep, etc."
                value={orderGroup}
                onChange={(e) => setOrderGroup(e.target.value)}
              />
            </div>
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Notes <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
            </label>
            <textarea
              className="input"
              placeholder="Order notes..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="button" onClick={() => { 
              setShowAddForm(false); 
              setOrderItems([]); 
              setOrderGroup('');
              setOrderNotes('');
              setDepartment('Kitchen');
            }}>
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
            orders.map(order => {
              const pendingCount = order.items.filter(i => (i.status || 'pending') === 'pending').length;
              const purchasedCount = order.items.filter(i => i.status === 'purchased').length;
              const rejectedCount = order.items.filter(i => i.status === 'rejected').length;

              return (
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                          {new Date(order.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </h3>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#e0e7ff',
                          color: '#3730a3'
                        }}>
                          {order.department}
                        </span>
                      </div>
                      {order.orderGroup && (
                        <div style={{ fontSize: 14, color: '#4b5563', marginBottom: 4 }}>
                          {order.orderGroup}
                        </div>
                      )}
                      {order.notes && (
                        <div style={{ fontSize: 13, fontStyle: 'italic', color: '#6b7280', marginTop: 6 }}>
                          Note: {order.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        background: 
                          order.overallStatus === 'completed' ? '#d1fae5' : 
                          order.overallStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: 
                          order.overallStatus === 'completed' ? '#065f46' : 
                          order.overallStatus === 'rejected' ? '#991b1b' : '#92400e'
                      }}>
                        {(order.overallStatus || 'pending').toUpperCase()}
                      </span>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                        {purchasedCount > 0 && `${purchasedCount} purchased`}
                        {purchasedCount > 0 && rejectedCount > 0 && ', '}
                        {rejectedCount > 0 && `${rejectedCount} rejected`}
                        {pendingCount > 0 && `, ${pendingCount} pending`}
                      </div>
                    </div>
                  </div>

                  <table className="table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th className="th">Item</th>
                        <th className="th">Type</th>
                        <th className="th" style={{ textAlign: 'right' }}>Quantity</th>
                        <th className="th">Stock Status</th>
                        <th className="th">Item Status</th>
                        <th className="th">Actions</th>
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
                          <td className="td">
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              background: 
                                item.status === 'purchased' ? '#d1fae5' : 
                                item.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                              color: 
                                item.status === 'purchased' ? '#065f46' : 
                                item.status === 'rejected' ? '#991b1b' : '#92400e'
                            }}>
                              {(item.status || 'pending').toUpperCase()}
                            </span>
                          </td>
                          <td className="td">
                            <div style={{ display: 'flex', gap: 6 }}>
                              {item.status !== 'purchased' && (
                                <button
                                  type="button"
                                  className="button"
                                  onClick={() => updateItemStatus(order._id, idx, 'purchased')}
                                  style={{ background: '#059669', color: 'white', fontSize: 12, padding: '4px 10px' }}
                                >
                                  ✓ Purchased
                                </button>
                              )}
                              {item.status !== 'rejected' && (
                                <button
                                  type="button"
                                  className="button"
                                  onClick={() => updateItemStatus(order._id, idx, 'rejected')}
                                  style={{ background: '#dc2626', color: 'white', fontSize: 12, padding: '4px 10px' }}
                                >
                                  ✗ Reject
                                </button>
                              )}
                              {item.status !== 'pending' && (
                                <button
                                  type="button"
                                  className="button"
                                  onClick={() => updateItemStatus(order._id, idx, 'pending')}
                                  style={{ fontSize: 12, padding: '4px 10px' }}
                                >
                                  ↺ Pending
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* All Pending Items View */}
      {viewMode === 'allPending' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="th" style={{ minWidth: 140 }}>Date/Time</th>
                <th className="th" style={{ minWidth: 90 }}>Department</th>
                <th className="th" style={{ minWidth: 140 }}>Order Name</th>
                <th className="th" style={{ minWidth: 200 }}>Item</th>
                <th className="th" style={{ minWidth: 120 }}>Type</th>
                <th className="th" style={{ textAlign: 'right', minWidth: 90 }}>Quantity</th>
                <th className="th" style={{ minWidth: 100 }}>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="td" colSpan={7}>Loading...</td></tr>
              ) : allPendingItems.length === 0 ? (
                <tr><td className="td" colSpan={7}>No pending items</td></tr>
              ) : allPendingItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="td" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(item.orderCreatedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="td">
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: '#e0e7ff',
                      color: '#3730a3'
                    }}>
                      {item.department}
                    </span>
                  </td>
                  <td className="td" style={{ fontSize: 13 }}>{item.orderGroup || '-'}</td>
                  <td className="td">{item.itemId?.name || '-'}</td>
                  <td className="td" style={{ color: '#6b7280', fontSize: 13 }}>{item.itemId?.type || '-'}</td>
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
