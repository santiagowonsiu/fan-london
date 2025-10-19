import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

itemSchema.index({ name: 1 }, { unique: true });

export const Item = mongoose.model("Item", itemSchema);
