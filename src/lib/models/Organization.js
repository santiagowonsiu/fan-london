import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    country: { type: String, required: true },
    currency: { type: String, default: 'GBP' },
    flagEmoji: { type: String, required: true },
    active: { type: Boolean, default: true },
    settings: {
      timezone: { type: String, default: 'Europe/London' },
      language: { type: String, default: 'en' }
    }
  },
  { timestamps: true, strict: false }
);

organizationSchema.index({ slug: 1 });

export const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

