import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { UpdateProfileInput } from '@gearshare/shared';
import { AppError, notFound } from '../../lib/errors';
import { toPublicGear } from '../gear/gear.mapper';
import type { GearRecord } from '../gear/gear.repository';
import { toPrivateUser, toPublicUser } from './users.mapper';
import type { UsersRepository } from './users.repository';

type Repo = Pick<UsersRepository, 'findById' | 'updateProfile'>;
type GearLookup = { findByOwner: (ownerId: string) => Promise<NonNullable<GearRecord>[]> };

// Finnish national numbers (040 123 4567) and international numbers; stored as E.164.
export function normalizePhone(input: string): string {
  const parsed = parsePhoneNumberFromString(input, 'FI');
  if (!parsed?.isValid()) throw new AppError(400, 'users.invalidPhone');
  return parsed.number;
}

export function createUsersService(repo: Repo, gear: GearLookup) {
  return {
    async getPublicProfile(id: string) {
      const user = await repo.findById(id);
      if (!user) throw notFound('users.notFound');
      const listed = await gear.findByOwner(id);
      return { ...toPublicUser(user), gear: listed.map(toPublicGear) };
    },
    async getMe(userId: string) {
      const user = await repo.findById(userId);
      if (!user) throw notFound('users.notFound');
      return toPrivateUser(user);
    },
    // Always writes to the caller's own id: there is no way to address another user's profile.
    async updateMe(userId: string, input: UpdateProfileInput) {
      const { phone, ...rest } = input;
      const patch = {
        ...rest,
        ...(phone !== undefined && { phone: phone === '' ? null : normalizePhone(phone) }),
      };
      const user = await repo.updateProfile(userId, patch);
      if (!user) throw notFound('users.notFound');
      return toPrivateUser(user);
    },
    // Placeholder: real account deletion (GDPR) comes in Prompt 9.
    async deleteMe(): Promise<never> {
      throw new AppError(501, 'errors.notImplemented');
    },
  };
}
