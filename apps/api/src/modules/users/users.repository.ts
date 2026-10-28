import { Types } from 'mongoose';
import type { Locale, UpdateProfileInput, UserRole } from '@gearquest/shared';
import { UserModel } from './users.model';

export type UserRecord = NonNullable<Awaited<ReturnType<typeof findById>>>;

export type NewUser = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  language?: Locale;
  phone?: string;
  whatsappShareConsent?: boolean;
  consentAt?: Date;
  termsAcceptedAt: Date;
};

// null clears a field.
export type ProfilePatch = Omit<UpdateProfileInput, 'phone'> & {
  phone?: string | null;
  consentAt?: Date | null;
  role?: UserRole;
};

async function findById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return UserModel.findOne({ _id: id, deletedAt: { $exists: false } }).lean();
}

async function findByIds(ids: string[]) {
  const valid = ids.filter((id) => Types.ObjectId.isValid(id));
  return UserModel.find({ _id: { $in: valid }, deletedAt: { $exists: false } }).lean();
}

// Includes soft-deleted users; the caller decides what that means.
async function findByGoogleId(googleId: string) {
  return UserModel.findOne({ googleId }).lean();
}

// Creates the user from a verified Google profile. If the account already exists (e.g. a
// double submit) nothing is overwritten and the existing user is returned. May return a
// soft-deleted user; the caller decides what that means.
async function createFromGoogle(user: NewUser) {
  const { googleId, ...onInsert } = user;
  return UserModel.findOneAndUpdate(
    { googleId },
    { $setOnInsert: { googleId, ...onInsert } },
    { upsert: true, new: true },
  ).lean();
}

async function updateProfile(id: string, patch: ProfilePatch) {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ''> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) $unset[key] = '';
    else if (value !== undefined) $set[key] = value;
  }
  return UserModel.findOneAndUpdate(
    { _id: id, deletedAt: { $exists: false } },
    { $set, ...(Object.keys($unset).length > 0 && { $unset }) },
    { new: true },
  ).lean();
}

export const usersRepository = {
  findById,
  findByIds,
  findByGoogleId,
  createFromGoogle,
  updateProfile,
};
export type UsersRepository = typeof usersRepository;
