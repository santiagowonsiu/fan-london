'use client';

import { useEffect, useState } from 'react';
import { fetchExternalOrders, createExternalOrder, updateExternalOrder, fetchItems } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function ExternalOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Add order form
  const [showAddForm, setShowAddForm] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [compiledMode, setCompiledMode] = useState(false); // Assign same supplier to all items

  useEffect(() => {
    loadOrders();
    const today = new Date().toISOString().split('T')[0];
    setOrderDate(today);
  }, [statusFilter]);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchExternalOrders({ status: statusFilter === 'all' ? undefined : statusFilter });
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
      costPerUnit: '',
      totalCost: ''
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
    
    // Calculate quantities
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

    // Auto-calculate cost
    if (field === 'costPerUnit') {
      const costPerUnit = Number(value) || 0;
      const qty = updated[index].quantityPack || updated[index].quantity || 0;
      updated[index].totalCost = (costPerUnit * qty).toFixed(2);
    }
    if (field === 'totalCost') {
      const totalCost = Number(value) || 0;
      const qty = updated[index].quantityPack || updated[index].quantity || 1;
      updated[index].costPerUnit = (totalCost / qty).toFixed(2);
    }
    
    setOrderItems(updated);
  }

  async function submitOrder() {
    if (!supplier.trim()) {
      alert('Supplier name is required');
      return;
    }
    if (orderItems.length === 0) {
      alert('Add at least one item');
      return;
    }

    const itemsToSave = orderItems.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      quantityBase: item.quantityBase,
      quantityPack: item.quantityPack,
      unitUsed: item.unitUsed,
      costPerUnit: Number(item.costPerUnit) || 0,
      totalCost: Number(item.totalCost) || 0
    }));

    try {
      await createExternalOrder({
        supplier: supplier.trim(),
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        items: itemsToSave,
        notes: orderNotes.trim() || undefined
      });
      setShowAddForm(false);
      setSupplier('');
      setOrderItems([]);
      setOrderNotes('');
      setCompiledMode(false);
      loadOrders();
      alert('External order created');
    } catch (e) {
      alert(e.message);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      await updateExternalOrder(orderId, { status: newStatus });
      loadOrders();
    } catch (e) {
      alert(e.message);
    }
  }

  const totalOrderValue = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>External Orders (to Suppliers)</h2>

      {/* Controls */}
      <div className="controls" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className="button primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ New Order'}
        </button>

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button type="button" className="button" onClick={loadOrders} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600 }}>
          Total Value: £{totalOrderValue.toFixed(2)}
        </div>
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
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>New External Order</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Supplier <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="input input-full"
                placeholder="Enter supplier name"
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value);
                  if (compiledMode) {
                    // Auto-apply to all items
                    setOrderItems(orderItems.map(item => ({ ...item, supplier: e.target.value })));
                  }
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Order Date
              </label>
              <input
                type="date"
                className="input input-full"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={compiledMode}
                onChange={(e) => setCompiledMode(e.target.checked)}
              />
              Compiled Order Mode (assign same supplier to all items)
            </label>
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
                    <th className="th">Cost/Unit (£)</th>
                    <th className="th">Total Cost (£)</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, idx) => (
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
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.costPerUnit}
                          onChange={(e) => updateOrderItem(idx, 'costPerUnit', e.target.value)}
                          style={{ width: 100 }}
                        />
                      </td>
                      <td className="td">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.totalCost}
                          onChange={(e) => updateOrderItem(idx, 'totalCost', e.target.value)}
                          style={{ width: 100 }}
                        />
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
                  ))}
                  <tr>
                    <td className="td" colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>
                      Order Total (ex VAT):
                    </td>
                    <td className="td" style={{ fontWeight: 700, fontSize: 16 }}>
                      £{orderItems.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0).toFixed(2)}
                    </td>
                    <td className="td"></td>
                  </tr>
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

          <div style={{ 
            padding: '12px 16px', 
            background: '#fef3c7', 
            borderRadius: 6, 
            marginBottom: 16,
            fontSize: 13,
            color: '#92400e'
          }}>
            📸 <strong>Note:</strong> Receipt upload feature coming soon - for now, save the order and track manually
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="button" onClick={() => { setShowAddForm(false); setOrderItems([]); setSupplier(''); }}>
              Cancel
            </button>
            <button type="button" className="button primary" onClick={submitOrder}>
              Create Order
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
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
                    {order.supplier}
                  </h3>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    Order Date: {new Date(order.orderDate).toLocaleDateString()} • 
                    Created: {new Date(order.createdAt).toLocaleString()}
                  </div>
                  {order.notes && (
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: '#4b5563', marginTop: 4 }}>
                      Note: {order.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Total (ex VAT)</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>£{(order.totalAmount || 0).toFixed(2)}</div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 
                      order.status === 'received' ? '#d1fae5' : 
                      order.status === 'ordered' ? '#dbeafe' : 
                      order.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                    color: 
                      order.status === 'received' ? '#065f46' : 
                      order.status === 'ordered' ? '#1e40af' : 
                      order.status === 'cancelled' ? '#991b1b' : '#92400e'
                  }}>
                    {order.status.toUpperCase()}
                  </span>
                  {order.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="button"
                        onClick={() => updateOrderStatus(order._id, 'ordered')}
                        style={{ fontSize: 13 }}
                      >
                        Mark Ordered
                      </button>
                      <button
                        type="button"
                        className="button"
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        style={{ background: '#dc2626', color: 'white', fontSize: 13 }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {order.status === 'ordered' && (
                    <button
                      type="button"
                      className="button"
                      onClick={() => updateOrderStatus(order._id, 'received')}
                      style={{ background: '#059669', color: 'white', fontSize: 13 }}
                    >
                      Mark Received
                    </button>
                  )}
                </div>
              </div>

              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th className="th">Item</th>
                    <th className="th">Type</th>
                    <th className="th" style={{ textAlign: 'right' }}>Quantity</th>
                    <th className="th" style={{ textAlign: 'right' }}>Cost/Unit</th>
                    <th className="th" style={{ textAlign: 'right' }}>Total</th>
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
                      <td className="td" style={{ textAlign: 'right' }}>
                        £{(item.costPerUnit || 0).toFixed(2)}
                      </td>
                      <td className="td" style={{ textAlign: 'right', fontWeight: 600 }}>
                        £{(item.totalCost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

