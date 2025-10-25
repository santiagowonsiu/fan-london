import mongoose from 'mongoose';

const stockReconciliationItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  itemName: { type: String, required: true },
  type: { type: String },
  
  // Previous stock (before reconciliation)
  previousPackStock: { type: Number, default: 0 },
  previousBaseStock: { type: Number, default: 0 },
  
  // New stock (from uploaded file)
  newPackStock: { type: Number, required: true },
  newBaseStock: { type: Number, required: true },
  
  // Difference
  packDifference: { type: Number, required: true },
  baseDifference: { type: Number, required: true },
  
  // Status
  status: {
    type: String,
    enum: ['adjusted', 'unchanged', 'invalid'],
    required: true
  },
  
  // Input from CSV
  inputField: { type: String, enum: ['pack', 'base', 'both', 'none'] },
  inputPackValue: { type: Number },
  inputBaseValue: { type: Number },
  
  // Error message if invalid
  errorMessage: { type: String }
});

const stockReconciliationSchema = new mongoose.Schema(
  {
    // When the physical stock count was performed
    reconciliationDate: { type: Date, required: true },
    
    // When the upload was performed
    uploadDate: { type: Date, default: Date.now },
    
    // Who performed the reconciliation
    performedBy: { type: String, required: true },
    
    // Summary statistics
    totalItems: { type: Number, required: true },
    adjustedCount: { type: Number, default: 0 },
    unchangedCount: { type: Number, default: 0 },
    invalidCount: { type: Number, default: 0 },
    
    // Detailed items
    adjustedItems: [stockReconciliationItemSchema],
    unchangedItems: [stockReconciliationItemSchema],
    invalidItems: [{
      rowNumber: { type: Number },
      type: { type: String },
      itemName: { type: String },
      inputPackValue: { type: String },
      inputBaseValue: { type: String },
      errorMessage: { type: String, required: true }
    }],
    
    // File information
    fileName: { type: String },
    fileRows: { type: Number },
    
    // Notes
    notes: { type: String },
    
    // Status of reconciliation
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Indexes
stockReconciliationSchema.index({ reconciliationDate: -1 });
stockReconciliationSchema.index({ uploadDate: -1 });
stockReconciliationSchema.index({ status: 1 });

export const StockReconciliation = mongoose.models.StockReconciliation || mongoose.model('StockReconciliation', stockReconciliationSchema);

