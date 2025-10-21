import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    direction: { type: String, enum: ['in', 'out'], required: true },
    quantity: { type: Number, required: true, min: 0 }, // Kept for backward compatibility
    quantityBase: { type: Number }, // Quantity in base content units
    quantityPack: { type: Number }, // Quantity in purchase pack units
    unitUsed: { type: String, enum: ['base', 'pack'] }, // Which unit was used for input
    observations: { type: String },
    personName: { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
