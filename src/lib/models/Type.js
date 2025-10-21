import mongoose from 'mongoose';

const typeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

typeSchema.index({ name: 1 }, { unique: true });

export const Type = mongoose.models.Type || mongoose.model('Type', typeSchema);
