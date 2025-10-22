import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    orderNotes: { type: String }, // How to make orders
    productTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Type' }], // Link to product types
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 });

export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

