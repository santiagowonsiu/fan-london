import mongoose from 'mongoose';

// Counter schema for auto-incrementing SKU
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const itemSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true }, // Auto-generated unique product ID
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

// Auto-generate SKU before saving
itemSchema.pre('save', async function(next) {
  if (!this.sku) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'productId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.sku = `FAN-${String(counter.seq).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

itemSchema.index({ name: 1 }, { unique: true });

export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
