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
    console.log('=== UPDATE ITEM STATUS ===');
    console.log('Order ID:', orderId);
    console.log('Item Index:', itemIndex);
    console.log('New Status:', newStatus);
    
    try {
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        console.error('❌ Order not found in state:', orderId);
        return;
      }

      console.log('✓ Found order:', order._id);
      console.log('  - Total items:', order.items.length);
      console.log('  - Item to update:', order.items[itemIndex]);

      // Create a complete copy of items with the updated status
      const updatedItems = order.items.map((item, idx) => {
        const itemData = {
          itemId: item.itemId?._id || item.itemId,
          quantity: item.quantity,
          quantityBase: item.quantityBase,
          quantityPack: item.quantityPack,
          unitUsed: item.unitUsed,
          hasStock: item.hasStock,
          needsToBuy: item.needsToBuy,
          status: idx === itemIndex ? newStatus : (item.status || 'pending'),
          _id: item._id
        };
        
        if (idx === itemIndex) {
          console.log('  ✓ Updating item', idx, 'status to:', newStatus);
        }
        
        return itemData;
      });

      console.log('📤 Sending API request...');
      console.log('  Payload:', { items: updatedItems });
      
      const response = await updateInternalOrder(orderId, { items: updatedItems });
      
      console.log('📥 API Response received:', response);
      console.log('  - Response has items:', response.items?.length);
      console.log('  - Item statuses:', response.items?.map(i => i.status));
      
      // Update local state
      setOrders(prevOrders => {
        const newOrders = prevOrders.map(o => 
          o._id === orderId ? response : o
        );
        console.log('✓ Local state updated');
        return newOrders;
      });
      
      console.log('=== UPDATE COMPLETE ===\n');
    } catch (e) {
      console.error('❌ Update error:', e);
      alert('Failed to update: ' + e.message);
    }
  }

  async function deleteOrder(orderId) {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const orderLabel = order.orderNumber || `Order from ${new Date(order.createdAt).toLocaleString()}`;
    const justification = prompt(`Why are you deleting order ${orderLabel}?`);
    if (!justification || !justification.trim()) {
      alert('Justification is required');
      return;
    }
    if (!confirm(`Are you sure you want to delete this entire order (${order.items.length} items)?`)) return;

    try {
      // Log to activity BEFORE deleting
      const logRes = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'internal_order_deleted',
          entityType: 'internal_order',
          entityId: orderId,
          entityName: orderLabel,
          justification: justification.trim(),
          details: {
            orderNumber: order.orderNumber,
            department: order.department,
            orderGroup: order.orderGroup,
            itemCount: order.items.length,
            items: order.items.map(item => ({
              name: item.itemId?.name,
              quantity: item.quantityPack || item.quantity,
              status: item.status
            })),
            createdAt: order.createdAt
          }
        })
      });

      if (!logRes.ok) {
        console.error('Failed to log activity');
      }

      // Then delete the order
      const res = await fetch(`/api/internal-orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete order');

      loadOrders();
      alert('Order deleted');
    } catch (e) {
      alert(e.message);
    }
  }

  async function deleteOrderItem(orderId, itemIndex) {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const itemToDelete = order.items[itemIndex];
    const orderLabel = order.orderNumber || `Order from ${new Date(order.createdAt).toLocaleString()}`;
    
    const justification = prompt(`Why are you deleting "${itemToDelete.itemId?.name}" from ${orderLabel}?`);
    if (!justification || !justification.trim()) {
      alert('Justification is required');
      return;
    }
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      // Log to activity
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'internal_order_deleted',
          entityType: 'internal_order',
          entityId: orderId,
          entityName: itemToDelete.itemId?.name || 'Unknown Item',
          justification: justification.trim(),
          details: {
            orderNumber: order.orderNumber,
            department: order.department,
            orderGroup: order.orderGroup,
            action: 'item_removed',
            itemName: itemToDelete.itemId?.name,
            itemType: itemToDelete.itemId?.type,
            quantity: itemToDelete.quantityPack || itemToDelete.quantity,
            itemStatus: itemToDelete.status || 'pending'
          }
        })
      });

      const updatedItems = order.items.filter((_, idx) => idx !== itemIndex);
      
      if (updatedItems.length === 0) {
        // If last item, delete whole order
        await deleteOrder(orderId);
        return;
      }

      await updateInternalOrder(orderId, { items: updatedItems });
      loadOrders();
      alert('Item removed from order');
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
              const isCompleted = (order.overallStatus || 'pending') !== 'pending';

              return (
                <div
                  key={order._id}
                  style={{
                    marginBottom: 16,
                    padding: 16,
                    background: isCompleted ? '#f9fafb' : 'white',
                    border: `1px solid ${isCompleted ? '#d1d5db' : '#e5e7eb'}`,
                    borderRadius: 8,
                    opacity: isCompleted ? 0.75 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 700,
                          background: '#e0e7ff',
                          color: '#3730a3'
                        }}>
                          {order.department || 'Kitchen'}
                        </span>
                        {order.orderNumber && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background: '#f3f4f6',
                            color: '#374151',
                            fontFamily: 'monospace'
                          }}>
                            {order.orderNumber}
                          </span>
                        )}
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                          {new Date(order.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </h3>
                        <button
                          type="button"
                          onClick={() => deleteOrder(order._id)}
                          style={{
                            border: '1px solid #dc2626',
                            background: 'white',
                            color: '#dc2626',
                            fontSize: 12,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            borderRadius: 4
                          }}
                          title="Delete entire order"
                        >
                          🗑 Delete Order
                        </button>
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
                        <th className="th" style={{ minWidth: 200 }}>Item</th>
                        <th className="th" style={{ minWidth: 120 }}>Type</th>
                        <th className="th" style={{ textAlign: 'right', minWidth: 100 }}>Quantity</th>
                        <th className="th" style={{ minWidth: 110 }}>Stock Status</th>
                        <th className="th" style={{ minWidth: 100 }}>Item Status</th>
                        <th className="th" style={{ minWidth: 150 }}>Actions</th>
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
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateItemStatus(order._id, idx, 'purchased');
                                }}
                                disabled={item.status === 'purchased'}
                                style={{ 
                                  border: '1px solid #059669',
                                  background: item.status === 'purchased' ? '#d1fae5' : 'white',
                                  color: '#059669',
                                  fontSize: 18,
                                  padding: '6px',
                                  cursor: item.status === 'purchased' ? 'default' : 'pointer',
                                  borderRadius: 6,
                                  lineHeight: 1,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: item.status === 'purchased' ? 0.5 : 1
                                }}
                                title="Mark as purchased"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateItemStatus(order._id, idx, 'rejected');
                                }}
                                disabled={item.status === 'rejected'}
                                style={{ 
                                  border: '1px solid #dc2626',
                                  background: item.status === 'rejected' ? '#fee2e2' : 'white',
                                  color: '#dc2626',
                                  fontSize: 18,
                                  padding: '6px',
                                  cursor: item.status === 'rejected' ? 'default' : 'pointer',
                                  borderRadius: 6,
                                  lineHeight: 1,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: item.status === 'rejected' ? 0.5 : 1
                                }}
                                title="Reject item"
                              >
                                ✗
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateItemStatus(order._id, idx, 'pending');
                                }}
                                disabled={item.status === 'pending'}
                                style={{ 
                                  border: '1px solid #f59e0b',
                                  background: item.status === 'pending' ? '#fef3c7' : 'white',
                                  color: '#f59e0b',
                                  fontSize: 18,
                                  padding: '6px',
                                  cursor: item.status === 'pending' ? 'default' : 'pointer',
                                  borderRadius: 6,
                                  lineHeight: 1,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: item.status === 'pending' ? 0.5 : 1
                                }}
                                title="Mark as pending"
                              >
                                ↺
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  deleteOrderItem(order._id, idx);
                                }}
                                style={{ 
                                  border: '1px solid #6b7280',
                                  background: 'white',
                                  color: '#6b7280',
                                  fontSize: 16,
                                  padding: '6px',
                                  cursor: 'pointer',
                                  borderRadius: 6,
                                  lineHeight: 1,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Delete item"
                              >
                                🗑
                              </button>
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
                <th className="th" style={{ minWidth: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="td" colSpan={8}>Loading...</td></tr>
              ) : allPendingItems.length === 0 ? (
                <tr><td className="td" colSpan={8}>No pending items</td></tr>
              ) : allPendingItems.map((item, globalIdx) => {
                // Find the order and item index
                const order = orders.find(o => o._id === item.orderId);
                const itemIdx = order?.items.findIndex(i => i._id === item._id);
                
                return (
                  <tr key={globalIdx}>
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
                    <td className="td">
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (order && itemIdx !== undefined) {
                              updateItemStatus(item.orderId, itemIdx, 'purchased');
                            }
                          }}
                          style={{ 
                            border: '1px solid #059669',
                            background: 'white',
                            color: '#059669',
                            fontSize: 18,
                            padding: '6px',
                            cursor: 'pointer',
                            borderRadius: 6,
                            lineHeight: 1,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Mark as purchased"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (order && itemIdx !== undefined) {
                              updateItemStatus(item.orderId, itemIdx, 'rejected');
                            }
                          }}
                          style={{ 
                            border: '1px solid #dc2626',
                            background: 'white',
                            color: '#dc2626',
                            fontSize: 18,
                            padding: '6px',
                            cursor: 'pointer',
                            borderRadius: 6,
                            lineHeight: 1,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Reject item"
                        >
                          ✗
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
