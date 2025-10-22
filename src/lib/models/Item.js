import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    typeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
    name: { type: String, required: true, trim: true },
    archived: { type: Boolean, default: false },
    baseContentValue: { type: Number },
    baseContentUnit: { type: String },
    purchasePackQuantity: { type: Number },
    purchasePackUnit: { type: String },
    imageUrl: { type: String },
    minStock: { type: Number, default: 0 }, // Minimum stock level in pack units
  },
  { timestamps: true }
);

itemSchema.index({ name: 1 }, { unique: true });

export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
