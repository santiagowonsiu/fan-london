import mongoose from 'mongoose';

const externalOrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true, min: 0 },
  quantityBase: { type: Number },
  quantityPack: { type: Number },
  unitUsed: { type: String, enum: ['base', 'pack'] },
  costPerUnit: { type: Number }, // Cost per single unit (no VAT)
  totalCost: { type: Number }, // Total cost for this line item (no VAT)
  internalOrderItemId: { type: mongoose.Schema.Types.ObjectId }, // Link to internal order item
  internalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'InternalOrder' }, // Link to internal order
});

const externalOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true }, // e.g., "EO-20251022-001" - auto-generated
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplier: { type: String, required: true }, // Supplier name (kept for backward compatibility)
    orderDate: { type: Date, default: Date.now },
    items: [externalOrderItemSchema],
    totalAmount: { type: Number }, // Sum of all item costs
    status: { 
      type: String, 
      enum: ['pending', 'submitted', 'received', 'cancelled'], 
      default: 'pending' 
    },
    receiptUrl: { type: String }, // For future: uploaded receipt image
    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-generate order number before saving
externalOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Count orders created today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay }
    });
    
    this.orderNumber = `EO-${date}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

externalOrderSchema.index({ createdAt: -1 });
externalOrderSchema.index({ supplier: 1 });
externalOrderSchema.index({ supplierId: 1 });
externalOrderSchema.index({ status: 1 });
externalOrderSchema.index({ orderNumber: 1 });

export const ExternalOrder = mongoose.models.ExternalOrder || mongoose.model('ExternalOrder', externalOrderSchema);

