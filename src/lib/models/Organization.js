import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    country: { type: String, enum: ['UK', 'Peru'], required: true },
    currency: { type: String, default: 'GBP' }, // GBP or PEN
    flagEmoji: { type: String, required: true }, // 🇬🇧 or 🇵🇪
    active: { type: Boolean, default: true },
    settings: {
      timezone: { type: String, default: 'Europe/London' },
      language: { type: String, default: 'en' }
    }
  },
  { timestamps: true }
);

organizationSchema.index({ slug: 1 }, { unique: true });

export const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

