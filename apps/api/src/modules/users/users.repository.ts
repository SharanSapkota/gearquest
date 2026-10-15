import { Types } from 'mongoose';
import type { UpdateProfileInput } from '@gearshare/shared';
import { UserModel } from './users.model';

export type UserRecord = NonNullable<Awaited<ReturnType<typeof findById>>>;

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type ProfilePatch = Omit<UpdateProfileInput, 'phone'> & { phone?: string | null };

async function findById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return UserModel.findOne({ _id: id, deletedAt: { $exists: false } }).lean();
}

async function findByIds(ids: string[]) {
  const valid = ids.filter((id) => Types.ObjectId.isValid(id));
  return UserModel.find({ _id: { $in: valid }, deletedAt: { $exists: false } }).lean();
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

async function updateProfile(id: string, patch: ProfilePatch) {
  const { phone, ...rest } = patch;
  const update =
    phone === null
      ? { $set: rest, $unset: { phone: '' } }
      : { $set: { ...rest, ...(phone && { phone }) } };
  return UserModel.findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, update, {
    new: true,
  }).lean();
}

export const usersRepository = { findById, findByIds, upsertFromGoogle, updateProfile };
export type UsersRepository = typeof usersRepository;
