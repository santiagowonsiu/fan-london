'use client';

import { useEffect, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { fetchDirectPurchases, createDirectPurchase, updateDirectPurchase } from '@/lib/api';

export default function DirectPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  
  // Add purchase form
  const [showAddForm, setShowAddForm] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPurchases();
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
    setPaymentDate(today);
  }, [statusFilter, paymentFilter]);

  async function loadPurchases() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDirectPurchases({ status: statusFilter, payment: paymentFilter });
      setPurchases(data.purchases || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitPurchase() {
    if (!supplier.trim()) {
      alert('Supplier name is required');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    if (isPaid && !paymentMethod.trim()) {
      alert('Payment method is required when marked as paid');
      return;
    }

    try {
      await createDirectPurchase({
        supplier: supplier.trim(),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        description: description.trim(),
        amount: Number(amount),
        invoiceUrl: invoiceUrl || undefined,
        isPaid,
        paymentMethod: paymentMethod.trim() || undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        notes: notes.trim() || undefined
      });
      
      setShowAddForm(false);
      setSupplier('');
      setDescription('');
      setAmount('');
      setInvoiceUrl('');
      setIsPaid(false);
      setPaymentMethod('');
      setNotes('');
      loadPurchases();
      alert('Direct purchase created');
    } catch (e) {
      alert(e.message);
    }
  }

  async function updatePurchaseStatus(purchaseId, field, value) {
    try {
      await updateDirectPurchase(purchaseId, { [field]: value });
      loadPurchases();
    } catch (e) {
      alert(e.message);
    }
  }

  const totalAmount = purchases
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paidAmount = purchases
    .filter(p => p.isPaid)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const unpaidAmount = totalAmount - paidAmount;

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Direct Purchases</h2>

      {/* Controls */}
      <div className="controls" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className="button primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ New Purchase'}
        </button>

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <select
          className="select"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">All Payment Methods</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="other">Other</option>
        </select>

        <button type="button" className="button" onClick={loadPurchases} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600 }}>
          Total Amount: £{totalAmount.toFixed(2)}
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      {/* Add Purchase Form */}
      {showAddForm && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: '#f9fafb', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>New Direct Purchase</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Supplier <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="input input-full"
                placeholder="Enter supplier name"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Purchase Date
              </label>
              <input
                type="date"
                className="input input-full"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              className="input input-full"
              placeholder="Describe what was purchased"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Amount (£) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                className="input input-full"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Invoice Upload <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
              </label>
              <ImageUpload
                currentImageUrl={invoiceUrl}
                onImageUploaded={setInvoiceUrl}
                uploadPreset="fan_invoices"
                folder="fan-invoices"
                allowPdf={true}
                label="Add Invoice"
              />
              {invoiceUrl && (
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#1e40af', textDecoration: 'underline', marginTop: 8, display: 'block' }}>
                  View Invoice
                </a>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
              />
              Mark as Paid
            </label>
          </div>

          {isPaid && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Payment Method <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  className="select input-full"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="">Select method</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Payment Date
                </label>
                <input
                  type="date"
                  className="input input-full"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Notes <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
            </label>
            <textarea
              className="input"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="button" className="button primary" onClick={submitPurchase}>
              Create Purchase
            </button>
          </div>
        </div>
      )}

      {/* Purchases List */}
      <div>
        {loading ? (
          <div>Loading...</div>
        ) : purchases.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>No direct purchases found</div>
        ) : (
          purchases.map(purchase => (
            <div
              key={purchase._id}
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
                    {purchase.supplier} - {purchase.description}
                  </h3>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    Purchase Date: {new Date(purchase.purchaseDate).toLocaleDateString()}
                    {purchase.isPaid && purchase.paymentDate && ` • Paid: ${new Date(purchase.paymentDate).toLocaleDateString()}`}
                  </div>
                  {purchase.notes && (
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: '#4b5563', marginTop: 4 }}>
                      Note: {purchase.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Amount</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>£{(purchase.amount || 0).toFixed(2)}</div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: purchase.isPaid ? '#d1fae5' : '#fef3c7',
                    color: purchase.isPaid ? '#065f46' : '#92400e'
                  }}>
                    {purchase.isPaid ? 'PAID' : 'UNPAID'}
                  </span>
                  {!purchase.isPaid && (
                    <button
                      type="button"
                      className="button"
                      onClick={() => updatePurchaseStatus(purchase._id, 'isPaid', true)}
                      style={{ background: '#059669', color: 'white', fontSize: 13 }}
                    >
                      Mark Paid
                    </button>
                  )}
                  {purchase.invoiceUrl && (
                    <a 
                      href={purchase.invoiceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="button"
                      style={{ fontSize: 13, background: '#e0f2fe', color: '#0369a1' }}
                    >
                      View Invoice
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
