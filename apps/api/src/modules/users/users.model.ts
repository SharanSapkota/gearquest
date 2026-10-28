import { Schema, model } from 'mongoose';
import { LOCALES, USER_ROLES } from '@gearquest/shared';

const userSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatarUrl: String,
    bio: String,
    language: { type: String, enum: LOCALES, default: 'fi' },
    phone: String, // E.164, private
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    termsAcceptedAt: Date,
    // Chosen at signup. Unset only on accounts created before roles existed (treated as renter).
    role: { type: String, enum: USER_ROLES },
    // Owner's permission to reveal the phone to a renter after accepting. Never makes it public.
    whatsappShareConsent: Boolean,
    consentAt: Date,
    deletedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = model('User', userSchema);
