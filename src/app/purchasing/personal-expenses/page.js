'use client';

import { useEffect, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { fetchPersonalExpenses, createPersonalExpense, updatePersonalExpense } from '@/lib/api';

// Helper function to get proper Cloudinary URL for viewing/downloading
function getCloudinaryUrl(url, forceDownload = false) {
  if (!url) return url;
  
  // For Cloudinary URLs with PDFs
  if (url.includes('res.cloudinary.com') && url.toLowerCase().includes('.pdf')) {
    // Convert /image/upload/ to /raw/upload/ for PDFs to ensure proper access
    // PDFs need to be served as 'raw' resource type in Cloudinary
    if (url.includes('/image/upload/')) {
      return url.replace('/image/upload/', '/raw/upload/');
    }
  }
  
  return url;
}

export default function PersonalExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Expanded and edit state for expense cards
  const [expandedExpenses, setExpandedExpenses] = useState({});
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  // Add expense form
  const [showAddForm, setShowAddForm] = useState(false);
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  
  // Mandatory expense type
  const [expenseType, setExpenseType] = useState('');
  
  // Amount and VAT
  const [totalAmount, setTotalAmount] = useState('');
  const [vatAmount, setVatAmount] = useState('');
  
  // Payroll discount fields
  const [suggestedDiscountAmount, setSuggestedDiscountAmount] = useState(0);
  const [confirmedDiscountAmount, setConfirmedDiscountAmount] = useState('');
  const [payrollDiscountDate, setPayrollDiscountDate] = useState('');
  
  // Reimbursement fields
  const [reimbursementAmount, setReimbursementAmount] = useState('');
  const [reimbursementDate, setReimbursementDate] = useState('');
  const [reimbursementTransactionId, setReimbursementTransactionId] = useState('');
  
  // Employee info
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  // Other fields
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  const expenseCategories = [
    'Travel',
    'Meals',
    'Office Supplies',
    'Equipment',
    'Training',
    'Marketing',
    'Utilities',
    'Entertainment',
    'Other'
  ];

  const expenseTypes = [
    { value: 'personal_requires_reimbursement', label: 'Personal Expense - Requires Reimbursement' },
    { value: 'personal_requires_payroll_discount', label: 'Personal Expense - Discount from Payroll' },
    { value: 'personal_no_reimbursement_no_discount', label: 'Personal Expense - No Reimbursement/Discount (VAT Only)' },
    { value: 'company_expense', label: 'Company Expense' }
  ];

  useEffect(() => {
    loadExpenses();
    const today = new Date().toISOString().split('T')[0];
    setExpenseDate(today);
    setPayrollDiscountDate(today);
    setReimbursementDate(today);
  }, [statusFilter, typeFilter]);

  // Calculate suggested discount when amounts change
  useEffect(() => {
    if (expenseType === 'personal_requires_payroll_discount' && totalAmount) {
      const total = Number(totalAmount) || 0;
      const vat = Number(vatAmount) || 0;
      const suggested = total - vat;
      setSuggestedDiscountAmount(suggested);
      
      // Auto-fill confirmed amount if not manually set
      if (!confirmedDiscountAmount) {
        setConfirmedDiscountAmount(suggested.toFixed(2));
      }
    }
  }, [totalAmount, vatAmount, expenseType, confirmedDiscountAmount]);

  async function loadExpenses() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPersonalExpenses({ status: statusFilter, type: typeFilter });
      setExpenses(data.expenses || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitExpense() {
    if (!expenseType) {
      alert('Expense type is required');
      return;
    }
    if (!description.trim()) {
      alert('Description is required');
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    if (!category) {
      alert('Category is required');
      return;
    }

    // Validation for payroll discount
    if (expenseType === 'personal_requires_payroll_discount') {
      if (!employeeName.trim()) {
        alert('Employee name is required for payroll discount');
        return;
      }
      if (!confirmedDiscountAmount) {
        alert('Please confirm the discount amount');
        return;
      }
    }

    // Validation for reimbursement
    if (expenseType === 'personal_requires_reimbursement') {
      if (!employeeName.trim()) {
        alert('Employee name is required for reimbursement');
        return;
      }
    }

    try {
      await createPersonalExpense({
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        description: description.trim(),
        expenseType,
        totalAmount: Number(totalAmount),
        vatAmount: Number(vatAmount) || 0,
        hasVAT: vatAmount && Number(vatAmount) > 0,
        suggestedDiscountAmount: expenseType === 'personal_requires_payroll_discount' ? suggestedDiscountAmount : undefined,
        confirmedDiscountAmount: expenseType === 'personal_requires_payroll_discount' ? Number(confirmedDiscountAmount) : undefined,
        payrollDiscountDate: expenseType === 'personal_requires_payroll_discount' && payrollDiscountDate ? new Date(payrollDiscountDate) : undefined,
        reimbursementAmount: expenseType === 'personal_requires_reimbursement' ? Number(reimbursementAmount || totalAmount) : undefined,
        reimbursementDate: expenseType === 'personal_requires_reimbursement' && reimbursementDate ? new Date(reimbursementDate) : undefined,
        reimbursementTransactionId: expenseType === 'personal_requires_reimbursement' ? reimbursementTransactionId.trim() || undefined : undefined,
        employeeName: employeeName.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
        category: category.trim(),
        receiptUrl: receiptUrl || undefined,
        notes: notes.trim() || undefined
      });
      
      resetForm();
      loadExpenses();
      alert('Personal expense created successfully');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  function resetForm() {
    setShowAddForm(false);
    setDescription('');
    setExpenseType('');
    setTotalAmount('');
    setCategory('');
    setVatAmount('');
    setSuggestedDiscountAmount(0);
    setConfirmedDiscountAmount('');
    setReimbursementAmount('');
    setReimbursementTransactionId('');
    setEmployeeName('');
    setEmployeeId('');
    setReceiptUrl('');
    setNotes('');
  }

  async function updateExpenseStatus(expenseId, updates) {
    try {
      await updatePersonalExpense(expenseId, updates);
      loadExpenses();
    } catch (e) {
      alert(e.message);
    }
  }

  function toggleExpanded(expenseId) {
    setExpandedExpenses(prev => ({
      ...prev,
      [expenseId]: !prev[expenseId]
    }));
  }

  function startEditing(expense) {
    setEditingExpense(expense._id);
    setEditFormData({
      payrollDiscountStatus: expense.payrollDiscountStatus || 'pending',
      payrollDiscountedMonth: expense.payrollDiscountedMonth || '',
      payrollNotes: expense.payrollNotes || '',
      reimbursementStatus: expense.reimbursementStatus || 'pending',
      reimbursementCompletedDate: expense.reimbursementCompletedDate ? new Date(expense.reimbursementCompletedDate).toISOString().split('T')[0] : '',
      reimbursementProofUrl: expense.reimbursementProofUrl || '',
      reimbursementNotes: expense.reimbursementNotes || ''
    });
  }

  function cancelEditing() {
    setEditingExpense(null);
    setEditFormData({});
  }

  async function saveEditing() {
    if (!editingExpense) return;
    
    try {
      const updates = { ...editFormData };
      
      // Add completion date if marking as completed
      if (updates.payrollDiscountStatus === 'completed' && !updates.payrollDiscountCompletedDate) {
        updates.payrollDiscountCompletedDate = new Date();
      }
      if (updates.reimbursementStatus === 'completed' && !updates.reimbursementCompletedDate) {
        updates.reimbursementCompletedDate = new Date();
      }
      
      await updatePersonalExpense(editingExpense, updates);
      setEditingExpense(null);
      setEditFormData({});
      loadExpenses();
      alert('Expense updated successfully');
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 20 }}>Personal Expenses</h2>

      {/* Controls */}
      <div className="controls" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className="button primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ New Expense'}
        </button>

        <select
          className="select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="personal_requires_reimbursement">Requires Reimbursement</option>
          <option value="personal_requires_payroll_discount">Payroll Discount</option>
          <option value="personal_no_reimbursement_no_discount">VAT Only</option>
          <option value="company_expense">Company Expense</option>
        </select>

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        <button type="button" className="button" onClick={loadExpenses} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600 }}>
          Total: £{totalExpenseAmount.toFixed(2)}
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      {/* Add Expense Form */}
      {showAddForm && (
        <div style={{ 
          marginBottom: 24, 
          padding: 20, 
          background: '#f9fafb', 
          borderRadius: 8, 
          border: '1px solid #e5e7eb' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>New Personal Expense</h3>
          
          {/* Step 1: Expense Type (Mandatory) */}
          <div style={{ 
            marginBottom: 20, 
            padding: 16, 
            background: '#eff6ff', 
            borderRadius: 6,
            border: '2px solid #3b82f6'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#1e40af' }}>
              Step 1: Select Expense Type <span style={{ color: '#dc2626' }}>*</span>
            </h4>
            <select
              className="select input-full"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              required
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              <option value="">-- Select Expense Type --</option>
              {expenseTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            
            {expenseType && (
              <div style={{ marginTop: 10, padding: 10, background: 'white', borderRadius: 4, fontSize: 13, color: '#4b5563' }}>
                <strong>Info:</strong> {
                  expenseType === 'personal_requires_reimbursement' ? 'Employee pays first, company reimburses full amount' :
                  expenseType === 'personal_requires_payroll_discount' ? 'Amount discounted from employee payroll (employee saves VAT if applicable)' :
                  expenseType === 'personal_no_reimbursement_no_discount' ? 'Receipt used for company VAT only, no money exchange' :
                  'Direct company expense, not personal'
                }
              </div>
            )}
          </div>

          {expenseType && (
            <>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Expense Date
                  </label>
                  <input
                    type="date"
                    className="input input-full"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Category <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="select input-full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  className="input input-full"
                  placeholder="Describe the expense"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Employee Info (for personal expenses) */}
              {expenseType !== 'company_expense' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Employee Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      className="input input-full"
                      placeholder="Enter employee name"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Employee ID <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
                    </label>
                    <input
                      className="input input-full"
                      placeholder="Enter employee ID"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Amount and VAT Section */}
              <div style={{ 
                marginBottom: 16, 
                padding: 16, 
                background: '#f0fdf4', 
                borderRadius: 6,
                border: '1px solid #86efac'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 600 }}>Amount Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Total Amount (£) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      className="input input-full"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      VAT Amount (£) <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(if applicable)</span>
                    </label>
                    <input
                      className="input input-full"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={vatAmount}
                      onChange={(e) => setVatAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Receipt Upload <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
                    </label>
                    <ImageUpload
                      currentImageUrl={receiptUrl}
                      onImageUploaded={setReceiptUrl}
                      uploadPreset="fan_receipts"
                      folder="fan-receipts"
                      allowPdf={true}
                      label="Add Receipt"
                    />
                  </div>
                </div>
              </div>

              {/* Payroll Discount Section */}
              {expenseType === 'personal_requires_payroll_discount' && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: 16, 
                  background: '#fef3c7', 
                  borderRadius: 6,
                  border: '1px solid #fbbf24'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 600 }}>Payroll Discount Calculation</h4>
                  
                  <div style={{ marginBottom: 12, padding: 12, background: 'white', borderRadius: 4 }}>
                    <div style={{ fontSize: 13, color: '#92400e', marginBottom: 8 }}>
                      <strong>💡 Employee Benefit:</strong> Employee pays amount minus VAT through payroll discount
                    </div>
                    <div style={{ fontSize: 13, color: '#92400e' }}>
                      <strong>🏢 Company Benefit:</strong> Company can claim VAT back, reducing corporate tax
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Suggested Discount (£)
                      </label>
                      <input
                        className="input input-full"
                        type="text"
                        value={suggestedDiscountAmount.toFixed(2)}
                        readOnly
                        style={{ background: '#fef3c7', fontWeight: 600, cursor: 'not-allowed' }}
                      />
                      <div style={{ fontSize: 11, color: '#92400e', marginTop: 4 }}>
                        Total (£{Number(totalAmount || 0).toFixed(2)}) - VAT (£{Number(vatAmount || 0).toFixed(2)})
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Confirmed Discount (£) <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        className="input input-full"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={confirmedDiscountAmount}
                        onChange={(e) => setConfirmedDiscountAmount(e.target.value)}
                        required
                      />
                      <div style={{ fontSize: 11, color: '#92400e', marginTop: 4 }}>
                        Adjust if needed
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Discount Date
                      </label>
                      <input
                        type="date"
                        className="input input-full"
                        value={payrollDiscountDate}
                        onChange={(e) => setPayrollDiscountDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reimbursement Section */}
              {expenseType === 'personal_requires_reimbursement' && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: 16, 
                  background: '#dbeafe', 
                  borderRadius: 6,
                  border: '1px solid #60a5fa'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 600 }}>Reimbursement Details</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Reimbursement Amount (£)
                      </label>
                      <input
                        className="input input-full"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={totalAmount || "0.00"}
                        value={reimbursementAmount}
                        onChange={(e) => setReimbursementAmount(e.target.value)}
                      />
                      <div style={{ fontSize: 11, color: '#1e40af', marginTop: 4 }}>
                        Defaults to total amount
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Reimbursement Date
                      </label>
                      <input
                        type="date"
                        className="input input-full"
                        value={reimbursementDate}
                        onChange={(e) => setReimbursementDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                        Transaction ID
                      </label>
                      <input
                        className="input input-full"
                        placeholder="Enter transaction ID"
                        value={reimbursementTransactionId}
                        onChange={(e) => setReimbursementTransactionId(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
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
                <button type="button" className="button" onClick={resetForm}>
                  Cancel
                </button>
                <button type="button" className="button primary" onClick={submitExpense}>
                  Create Expense
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Expenses List */}
      <div>
        {loading ? (
          <div>Loading...</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>No personal expenses found</div>
        ) : (
          expenses.map(expense => {
            const isExpanded = expandedExpenses[expense._id];
            const isEditing = editingExpense === expense._id;
            
            return (
              <div
                key={expense._id}
                style={{
                  marginBottom: 16,
                  padding: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  overflow: 'hidden'
                }}
              >
                {/* Summary View (Always Visible) */}
                <div 
                  style={{ 
                    padding: 16, 
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                  }}
                  onClick={() => toggleExpanded(expense._id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>
                          {expense.description}
                        </h3>
                        {expense.expenseType === 'personal_requires_payroll_discount' && (
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: expense.payrollDiscountStatus === 'completed' ? '#d1fae5' : 
                                       expense.payrollDiscountStatus === 'not_discounted' ? '#fee2e2' : '#fef3c7',
                            color: expense.payrollDiscountStatus === 'completed' ? '#065f46' : 
                                   expense.payrollDiscountStatus === 'not_discounted' ? '#991b1b' : '#92400e'
                          }}>
                            {expense.payrollDiscountStatus === 'completed' ? '✓ DISCOUNTED' :
                             expense.payrollDiscountStatus === 'not_discounted' ? '✗ NOT DISCOUNTED' : 'PENDING DISCOUNT'}
                          </span>
                        )}
                        {expense.expenseType === 'personal_requires_reimbursement' && (
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: expense.reimbursementStatus === 'completed' ? '#d1fae5' : 
                                       expense.reimbursementStatus === 'not_reimbursed' ? '#fee2e2' : '#dbeafe',
                            color: expense.reimbursementStatus === 'completed' ? '#065f46' : 
                                   expense.reimbursementStatus === 'not_reimbursed' ? '#991b1b' : '#1e40af'
                          }}>
                            {expense.reimbursementStatus === 'completed' ? '✓ REIMBURSED' :
                             expense.reimbursementStatus === 'not_reimbursed' ? '✗ NOT REIMBURSED' : 'PENDING REIMBURSEMENT'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(expense.expenseDate).toLocaleDateString()} • {expense.category}
                        {expense.employeeName && ` • ${expense.employeeName}`}
                        {expense.vatAmount > 0 && ` • VAT: £${expense.vatAmount.toFixed(2)}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>£{(expense.totalAmount || 0).toFixed(2)}</div>
                        {expense.expenseType === 'personal_requires_payroll_discount' && (
                          <div style={{ fontSize: 11, color: '#92400e' }}>
                            Discount: £{(expense.confirmedDiscountAmount || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 20, color: '#9ca3af' }}>
                        {isExpanded ? '▲' : '▼'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed View (Expandable) */}
                {isExpanded && (
                  <div style={{ padding: 16, background: '#f9fafb' }}>
                    {!isEditing ? (
                      <>
                        {/* View Mode */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Expense Type</div>
                            <div style={{ fontSize: 14 }}>{expenseTypes.find(t => t.value === expense.expenseType)?.label}</div>
                          </div>
                          {expense.employeeId && (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Employee ID</div>
                              <div style={{ fontSize: 14 }}>{expense.employeeId}</div>
                            </div>
                          )}
                        </div>

                        {/* Payroll Discount Details */}
                        {expense.expenseType === 'personal_requires_payroll_discount' && (
                          <div style={{ marginBottom: 16, padding: 12, background: 'white', borderRadius: 6 }}>
                            <h4 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Payroll Discount Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Suggested Amount</div>
                                <div style={{ fontSize: 13 }}>£{(expense.suggestedDiscountAmount || 0).toFixed(2)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Confirmed Amount</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>£{(expense.confirmedDiscountAmount || 0).toFixed(2)}</div>
                              </div>
                              {expense.payrollDiscountedMonth && (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Payroll Month</div>
                                  <div style={{ fontSize: 13 }}>{expense.payrollDiscountedMonth}</div>
                                </div>
                              )}
                            </div>
                            {expense.payrollNotes && (
                              <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>
                                Note: {expense.payrollNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reimbursement Details */}
                        {expense.expenseType === 'personal_requires_reimbursement' && (
                          <div style={{ marginBottom: 16, padding: 12, background: 'white', borderRadius: 6 }}>
                            <h4 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Reimbursement Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Amount</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>£{(expense.reimbursementAmount || 0).toFixed(2)}</div>
                              </div>
                              {expense.reimbursementTransactionId && (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Transaction ID</div>
                                  <div style={{ fontSize: 13 }}>{expense.reimbursementTransactionId}</div>
                                </div>
                              )}
                              {expense.reimbursementCompletedDate && (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Completed Date</div>
                                  <div style={{ fontSize: 13 }}>{new Date(expense.reimbursementCompletedDate).toLocaleDateString()}</div>
                                </div>
                              )}
                            </div>
                            {expense.reimbursementProofUrl && (
                              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                <a 
                                  href={getCloudinaryUrl(expense.reimbursementProofUrl, false)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{ fontSize: 12, color: '#1e40af', textDecoration: 'underline' }}
                                >
                                  📄 View Proof
                                </a>
                                <a 
                                  href={getCloudinaryUrl(expense.reimbursementProofUrl, true)} 
                                  download
                                  style={{ fontSize: 12, color: '#6b7280', textDecoration: 'underline' }}
                                >
                                  ⬇️ Download
                                </a>
                              </div>
                            )}
                            {expense.reimbursementNotes && (
                              <div style={{ marginTop: 8, fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>
                                Note: {expense.reimbursementNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {expense.notes && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>General Notes</div>
                            <div style={{ fontSize: 13, color: '#4b5563' }}>{expense.notes}</div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {expense.receiptUrl && (
                          <>
                            <a
                              href={getCloudinaryUrl(expense.receiptUrl, false)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="button"
                              style={{ fontSize: 13 }}
                            >
                              📄 View Receipt
                            </a>
                            <a
                              href={getCloudinaryUrl(expense.receiptUrl, true)}
                              download
                              className="button"
                              style={{ fontSize: 13, background: '#f3f4f6', color: '#374151' }}
                            >
                              ⬇️ Download
                            </a>
                          </>
                        )}
                          <button
                            type="button"
                            className="button primary"
                            onClick={(e) => { e.stopPropagation(); startEditing(expense); }}
                            style={{ fontSize: 13 }}
                          >
                            ✏️ Edit Status
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Edit Mode */}
                        <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 15 }}>Edit Expense Status</h4>
                        
                        {expense.expenseType === 'personal_requires_payroll_discount' && (
                          <div style={{ marginBottom: 16, padding: 12, background: '#fef3c7', borderRadius: 6 }}>
                            <h5 style={{ margin: 0, marginBottom: 12, fontSize: 14 }}>Payroll Discount Status</h5>
                            
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Status</label>
                              <select
                                className="select input-full"
                                value={editFormData.payrollDiscountStatus || 'pending'}
                                onChange={(e) => setEditFormData({...editFormData, payrollDiscountStatus: e.target.value})}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Discounted</option>
                                <option value="not_discounted">Not Discounted</option>
                              </select>
                            </div>

                            {editFormData.payrollDiscountStatus === 'completed' && (
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                                  Payroll Month (YYYY-MM)
                                </label>
                                <input
                                  type="month"
                                  className="input input-full"
                                  value={editFormData.payrollDiscountedMonth || ''}
                                  onChange={(e) => setEditFormData({...editFormData, payrollDiscountedMonth: e.target.value})}
                                />
                              </div>
                            )}

                            <div>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes</label>
                              <textarea
                                className="input"
                                style={{ width: '100%', fontFamily: 'inherit' }}
                                rows={2}
                                value={editFormData.payrollNotes || ''}
                                onChange={(e) => setEditFormData({...editFormData, payrollNotes: e.target.value})}
                                placeholder="Add notes about payroll discount..."
                              />
                            </div>
                          </div>
                        )}

                        {expense.expenseType === 'personal_requires_reimbursement' && (
                          <div style={{ marginBottom: 16, padding: 12, background: '#dbeafe', borderRadius: 6 }}>
                            <h5 style={{ margin: 0, marginBottom: 12, fontSize: 14 }}>Reimbursement Status</h5>
                            
                            <div style={{ marginBottom: 12 }}>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Status</label>
                              <select
                                className="select input-full"
                                value={editFormData.reimbursementStatus || 'pending'}
                                onChange={(e) => setEditFormData({...editFormData, reimbursementStatus: e.target.value})}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Reimbursed</option>
                                <option value="not_reimbursed">Not Reimbursed</option>
                              </select>
                            </div>

                            {editFormData.reimbursementStatus === 'completed' && (
                              <>
                                <div style={{ marginBottom: 12 }}>
                                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                                    Completed Date
                                  </label>
                                  <input
                                    type="date"
                                    className="input input-full"
                                    value={editFormData.reimbursementCompletedDate || ''}
                                    onChange={(e) => setEditFormData({...editFormData, reimbursementCompletedDate: e.target.value})}
                                  />
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                                    Transaction Proof Upload
                                  </label>
                                  <ImageUpload
                                    currentImageUrl={editFormData.reimbursementProofUrl}
                                    onImageUploaded={(url) => setEditFormData({...editFormData, reimbursementProofUrl: url})}
                                    uploadPreset="fan_receipts"
                                    folder="fan-reimbursement-proofs"
                                    allowPdf={true}
                                    label="Add Proof"
                                  />
                                </div>
                              </>
                            )}

                            <div>
                              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Notes</label>
                              <textarea
                                className="input"
                                style={{ width: '100%', fontFamily: 'inherit' }}
                                rows={2}
                                value={editFormData.reimbursementNotes || ''}
                                onChange={(e) => setEditFormData({...editFormData, reimbursementNotes: e.target.value})}
                                placeholder="Add notes about reimbursement..."
                              />
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="button"
                            onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="button primary"
                            onClick={(e) => { e.stopPropagation(); saveEditing(); }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
