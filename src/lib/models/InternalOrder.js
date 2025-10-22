import mongoose from 'mongoose';

const internalOrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true, min: 0 },
  quantityBase: { type: Number },
  quantityPack: { type: Number },
  unitUsed: { type: String, enum: ['base', 'pack'] },
  hasStock: { type: Boolean },
  needsToBuy: { type: Boolean },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'ordered', 'rejected'], 
    default: 'pending' 
  },
  statusChangedAt: { type: Date }, // Track when status first changed from pending
  previousStatus: { type: String }, // Track for activity logging
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // Assigned supplier
  externalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExternalOrder' }, // Linked external order
  assignmentNotes: { type: String } // Notes when assigning to supplier
});

const internalOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true }, // e.g., "IO-20251021-001" - auto-generated
    department: { 
      type: String, 
      enum: ['Kitchen', 'Bar', 'FOH'], 
      required: true 
    },
    orderGroup: { type: String }, // Optional name
    items: [internalOrderItemSchema],
    overallStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'rejected'], 
      default: 'pending' 
    }, // Auto-calculated based on items
    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-generate order number before saving
internalOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Count orders created today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay }
    });
    
    this.orderNumber = `IO-${date}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

internalOrderSchema.index({ createdAt: -1 });
internalOrderSchema.index({ status: 1 });

export const InternalOrder = mongoose.models.InternalOrder || mongoose.model('InternalOrder', internalOrderSchema);

