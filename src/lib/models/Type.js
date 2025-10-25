import mongoose from 'mongoose';

const typeSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

typeSchema.index({ name: 1, organizationId: 1 }, { unique: true });
typeSchema.index({ organizationId: 1 });

export const Type = mongoose.models.Type || mongoose.model('Type', typeSchema);
