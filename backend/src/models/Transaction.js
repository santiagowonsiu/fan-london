import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    direction: { type: String, enum: ["in", "out"], required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
