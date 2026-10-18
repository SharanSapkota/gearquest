import { Types } from 'mongoose';
import type { UpdateProfileInput } from '@gearshare/shared';
import { UserModel } from './users.model';

export type UserRecord = NonNullable<Awaited<ReturnType<typeof findById>>>;

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  termsAcceptedAt: Date;
};

// null clears a field.
export type ProfilePatch = Omit<UpdateProfileInput, 'phone'> & {
  phone?: string | null;
  consentAt?: Date | null;
  onboardingCompletedAt?: Date;
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

// Creates the user on first login. Later logins change nothing (name/bio stay as the user set
// them), so repeat logins never duplicate or overwrite. May return a soft-deleted user; the
// caller decides what that means.
async function upsertFromGoogle(profile: GoogleProfile) {
  const { googleId, ...onInsert } = profile;
  return UserModel.findOneAndUpdate(
    { googleId },
    { $setOnInsert: { googleId, ...onInsert } },
    { upsert: true, new: true },
  ).lean();
}

// For accounts created before terms acceptance was recorded.
async function acceptTerms(id: string, at: Date) {
  return UserModel.findOneAndUpdate(
    { _id: id, deletedAt: { $exists: false } },
    { $set: { termsAcceptedAt: at } },
    { new: true },
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
  upsertFromGoogle,
  acceptTerms,
  updateProfile,
};
export type UsersRepository = typeof usersRepository;
