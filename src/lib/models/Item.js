import mongoose from 'mongoose';

// Counter schema for auto-incrementing SKU
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const itemSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    sku: { type: String }, // Auto-generated unique product ID per organization
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

// Auto-generate SKU before saving (unique per organization)
itemSchema.pre('save', async function(next) {
  if (!this.sku && this.organizationId) {
    try {
      const counterId = `productId_${this.organizationId}`;
      const counter = await Counter.findByIdAndUpdate(
        counterId,
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

itemSchema.index({ name: 1, organizationId: 1 }, { unique: true });
itemSchema.index({ organizationId: 1 });
itemSchema.index({ sku: 1, organizationId: 1 });

export const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
