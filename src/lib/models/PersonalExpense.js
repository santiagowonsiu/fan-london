import mongoose from 'mongoose';

const personalExpenseSchema = new mongoose.Schema(
  {
    expenseDate: { type: Date, default: Date.now },
    description: { type: String, required: true },
    
    // Mandatory expense type
    expenseType: {
      type: String,
      required: true,
      enum: [
        'personal_requires_reimbursement',       // Personal expense, company pays back
        'personal_requires_payroll_discount',    // Personal expense, discounted from payroll
        'personal_no_reimbursement_no_discount', // Personal expense, bill used for company VAT
        'company_expense'                         // Direct company expense (no personal involvement)
      ]
    },
    
    // Amount fields
    totalAmount: { type: Number, required: true, min: 0 }, // Total amount on receipt
    hasVAT: { type: Boolean, default: false }, // Does the receipt include VAT?
    vatAmount: { type: Number, default: 0 }, // VAT amount if applicable
    vatPercentage: { type: Number, default: 0 }, // VAT percentage (e.g., 20 for 20%)
    
    // Payroll discount fields (for expenseType: 'personal_requires_payroll_discount')
    suggestedDiscountAmount: { type: Number }, // Auto-calculated: totalAmount - VAT (if hasVAT)
    confirmedDiscountAmount: { type: Number }, // Final confirmed amount to discount
    payrollDiscountDate: { type: Date }, // Initial date when discount was set up
    payrollDiscountStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'not_discounted'],
      default: 'pending'
    },
    payrollDiscountedMonth: { type: String }, // Format: "YYYY-MM" (e.g., "2025-10")
    payrollDiscountedYear: { type: Number }, // Year when discount was applied
    payrollDiscountCompletedDate: { type: Date }, // Actual date when marked as discounted
    payrollNotes: { type: String }, // Additional notes for payroll
    
    // Reimbursement fields (for expenseType: 'personal_requires_reimbursement')
    reimbursementAmount: { type: Number }, // Amount to reimburse
    reimbursementDate: { type: Date }, // Initial date when reimbursement was set up
    reimbursementTransactionId: { type: String },
    reimbursementStatus: {
      type: String,
      enum: ['pending', 'completed', 'not_reimbursed'],
      default: 'pending'
    },
    reimbursementCompletedDate: { type: Date }, // Actual date when reimbursement was made
    reimbursementProofUrl: { type: String }, // Cloudinary URL for transaction proof/bank statement
    reimbursementNotes: { type: String }, // Additional notes for reimbursement
    
    // Employee information
    employeeName: { type: String }, // Name of employee who made the expense
    employeeId: { type: String }, // Employee ID for payroll matching
    
    // Category and documentation
    category: { 
      type: String, 
      required: true,
      enum: ['Travel', 'Meals', 'Office Supplies', 'Equipment', 'Training', 'Marketing', 'Utilities', 'Entertainment', 'Other']
    },
    receiptUrl: { type: String }, // Cloudinary URL for receipt
    
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient queries
personalExpenseSchema.index({ expenseDate: -1 });
personalExpenseSchema.index({ category: 1 });
personalExpenseSchema.index({ expenseType: 1 });
personalExpenseSchema.index({ payrollDiscountStatus: 1 });
personalExpenseSchema.index({ reimbursementStatus: 1 });
personalExpenseSchema.index({ employeeId: 1 });

// Pre-save hook to calculate suggested discount amount
personalExpenseSchema.pre('save', function(next) {
  // Calculate VAT amount if percentage is provided
  if (this.hasVAT && this.vatPercentage > 0 && !this.vatAmount) {
    this.vatAmount = (this.totalAmount * this.vatPercentage) / (100 + this.vatPercentage);
  }
  
  // Calculate suggested discount amount for payroll discount expenses
  if (this.expenseType === 'personal_requires_payroll_discount') {
    if (this.hasVAT) {
      // Suggested discount = Total - VAT (employee benefit: doesn't pay VAT)
      this.suggestedDiscountAmount = this.totalAmount - (this.vatAmount || 0);
    } else {
      // No VAT, suggested discount = full amount
      this.suggestedDiscountAmount = this.totalAmount;
    }
    
    // If confirmed amount not set, use suggested amount
    if (!this.confirmedDiscountAmount) {
      this.confirmedDiscountAmount = this.suggestedDiscountAmount;
    }
  }
  
  // Set reimbursement amount if not set
  if (this.expenseType === 'personal_requires_reimbursement' && !this.reimbursementAmount) {
    this.reimbursementAmount = this.totalAmount;
  }
  
  next();
});

export const PersonalExpense = mongoose.models.PersonalExpense || mongoose.model('PersonalExpense', personalExpenseSchema);
