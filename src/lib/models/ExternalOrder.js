import mongoose from 'mongoose';

const externalOrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true, min: 0 },
  quantityBase: { type: Number },
  quantityPack: { type: Number },
  unitUsed: { type: String, enum: ['base', 'pack'] },
  costPerUnit: { type: Number }, // Cost per single unit (no VAT)
  totalCost: { type: Number }, // Total cost for this line item (no VAT)
});

const externalOrderSchema = new mongoose.Schema(
  {
    supplier: { type: String, required: true },
    orderDate: { type: Date, default: Date.now },
    items: [externalOrderItemSchema],
    totalAmount: { type: Number }, // Sum of all item costs
    status: { 
      type: String, 
      enum: ['pending', 'ordered', 'received', 'cancelled'], 
      default: 'pending' 
    },
    receiptUrl: { type: String }, // For future: uploaded receipt image
    notes: { type: String },
  },
  { timestamps: true }
);

externalOrderSchema.index({ createdAt: -1 });
externalOrderSchema.index({ supplier: 1 });
externalOrderSchema.index({ status: 1 });

export const ExternalOrder = mongoose.models.ExternalOrder || mongoose.model('ExternalOrder', externalOrderSchema);

