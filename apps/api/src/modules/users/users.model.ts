import { Schema, model } from 'mongoose';
import { LOCALES, USER_ROLES } from '@gearshare/shared';

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
    // Unset until onboarding step 1; together with onboardingCompletedAt it drives the onboarding redirect.
    role: { type: String, enum: USER_ROLES },
    // Owner's permission to reveal their phone to a renter after accepting a request. Never makes it public.
    whatsappShareConsent: { type: Boolean, default: false },
    consentAt: Date,
    termsAcceptedAt: Date,
    onboardingCompletedAt: Date,
    deletedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = model('User', userSchema);
