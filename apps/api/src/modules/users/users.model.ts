import { Schema, model } from 'mongoose';
import { LOCALES } from '@gearshare/shared';

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
    deletedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = model('User', userSchema);
