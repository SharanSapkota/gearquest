import { Types } from 'mongoose';
import type { UpdateProfileInput, USER_ROLES } from '@gearshare/shared';
import { UserModel } from './users.model';

export type UserRecord = NonNullable<Awaited<ReturnType<typeof findById>>>;

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export type ProfilePatch = Omit<UpdateProfileInput, 'phone' | 'role'> & {
  phone?: string | null;
  role?: (typeof USER_ROLES)[number];
  consentAt?: Date;
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

// May return a soft-deleted user; the caller decides what that means.
async function findByGoogleId(googleId: string) {
  return UserModel.findOne({ googleId }).lean();
}

// Creates the user at signup. $setOnInsert + the unique googleId index make a concurrent second
// signup return the same user instead of a duplicate, and never overwrite an existing one.
async function createFromGoogle(profile: GoogleProfile & { termsAcceptedAt: Date }) {
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

export const usersRepository = {
  findById,
  findByIds,
  findByGoogleId,
  createFromGoogle,
  updateProfile,
};
export type UsersRepository = typeof usersRepository;
