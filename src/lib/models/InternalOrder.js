import mongoose from 'mongoose';

const internalOrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true, min: 0 },
  quantityBase: { type: Number },
  quantityPack: { type: Number },
  unitUsed: { type: String, enum: ['base', 'pack'] },
  hasStock: { type: Boolean }, // Calculated: whether item is in stock
  needsToBuy: { type: Boolean }, // Calculated: whether needs purchasing
});

const internalOrderSchema = new mongoose.Schema(
  {
    orderGroup: { type: String }, // e.g., "Morning - Oct 21", "Afternoon - Oct 21"
    items: [internalOrderItemSchema],
    status: { 
      type: String, 
      enum: ['pending', 'purchased', 'rejected'], 
      default: 'pending' 
    },
    notes: { type: String },
  },
  { timestamps: true }
);

internalOrderSchema.index({ createdAt: -1 });
internalOrderSchema.index({ status: 1 });

export const InternalOrder = mongoose.models.InternalOrder || mongoose.model('InternalOrder', internalOrderSchema);

