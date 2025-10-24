import mongoose from 'mongoose';

const directPurchaseSchema = new mongoose.Schema(
  {
    supplier: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    invoiceUrl: { type: String }, // Cloudinary URL for invoice
    isPaid: { type: Boolean, default: false },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'card', 'bank_transfer', 'cheque', 'paypal', 'other'],
      required: function() { return this.isPaid; }
    },
    paymentDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

directPurchaseSchema.index({ purchaseDate: -1 });
directPurchaseSchema.index({ supplier: 1 });
directPurchaseSchema.index({ isPaid: 1 });

export const DirectPurchase = mongoose.models.DirectPurchase || mongoose.model('DirectPurchase', directPurchaseSchema);
