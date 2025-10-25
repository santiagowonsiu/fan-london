import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // In production, this should be hashed
    role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
    active: { type: Boolean, default: true },
    // Multi-organization support
    organizations: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Organization' 
    }], // Organizations this user has access to (empty = admin has access to all)
  },
  { timestamps: true }
);

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);

