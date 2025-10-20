import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true }, // Keep for backward compatibility
    typeId: { type: mongoose.Schema.Types.ObjectId, ref: "Type" }, // Reference to Type
    name: { type: String, required: true, trim: true },
    archived: { type: Boolean, default: false },
    baseContentValue: { type: Number },
    baseContentUnit: { type: String },
    purchasePackQuantity: { type: Number },
    purchasePackUnit: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

itemSchema.index({ name: 1 }, { unique: true });

export const Item = mongoose.model("Item", itemSchema);
