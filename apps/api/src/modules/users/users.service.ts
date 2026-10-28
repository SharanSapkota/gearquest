import { toE164, type UpdateProfileInput, type UpgradeRoleInput } from '@gearquest/shared';
import { AppError, notFound } from '../../lib/errors';
import { toPublicGear } from '../gear/gear.mapper';
import type { GearRecord } from '../gear/gear.repository';
import { toPrivateUser, toPublicUser } from './users.mapper';
import { assertOwnerReady, isOwnerRole } from './users.policy';
import type { ProfilePatch, UsersRepository } from './users.repository';

type Repo = Pick<UsersRepository, 'findById' | 'updateProfile'>;
type GearLookup = {
  findByOwner: (ownerId: string) => Promise<NonNullable<GearRecord>[]>;
  countByOwner: (ownerId: string) => Promise<number>;
};
type RentalsLookup = { existsAcceptedAsOwner: (ownerId: string) => Promise<boolean> };

// Finnish national numbers (040 123 4567) and international numbers; stored as E.164.
export function normalizePhone(input: string): string {
  const e164 = toE164(input);
  if (!e164) throw new AppError(400, 'users.invalidPhone');
  return e164;
}

export function createUsersService(
  repo: Repo,
  gear: GearLookup,
  rentals: RentalsLookup,
  clock: () => Date = () => new Date(),
) {
  async function save(userId: string, patch: ProfilePatch) {
    const user = await repo.updateProfile(userId, patch);
    if (!user) throw notFound('users.notFound');
    return toPrivateUser(user);
  }

  // consentAt follows the consent flag: set when granted, cleared when withdrawn.
  function consentPatch(given: boolean | undefined, current: boolean) {
    if (given === undefined || given === current) return {};
    return { whatsappShareConsent: given, consentAt: given ? clock() : null };
  }

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
      const current = await repo.findById(userId);
      if (!current) throw notFound('users.notFound');
      const { phone, whatsappShareConsent, ...rest } = input;
      const nextPhone =
        phone === undefined ? current.phone : phone === '' ? undefined : normalizePhone(phone);

      // Existing listings and accepted rentals (as owner) rely on the number being there.
      if (phone === '' && current.phone) {
        const [listings, accepted] = await Promise.all([
          gear.countByOwner(userId),
          rentals.existsAcceptedAsOwner(userId),
        ]);
        if (listings > 0 || accepted) throw new AppError(409, 'users.phoneInUse');
      }
      if (isOwnerRole(current.role)) {
        assertOwnerReady({
          role: current.role,
          phone: nextPhone,
          whatsappShareConsent: whatsappShareConsent ?? current.whatsappShareConsent,
        });
      }

      return save(userId, {
        ...rest,
        ...(phone !== undefined && { phone: nextPhone ?? null }),
        ...consentPatch(whatsappShareConsent, Boolean(current.whatsappShareConsent)),
      });
    },
    // A renter becomes an owner (or both) later. Same rules as signup: a valid phone and WhatsApp
    // consent must be on file afterwards (already stored values count).
    async upgradeRole(userId: string, input: UpgradeRoleInput) {
      const current = await repo.findById(userId);
      if (!current) throw notFound('users.notFound');
      const { phone, whatsappShareConsent } = input;
      const nextPhone = phone ? normalizePhone(phone) : current.phone;
      assertOwnerReady({
        role: input.role,
        phone: nextPhone,
        whatsappShareConsent: whatsappShareConsent ?? current.whatsappShareConsent,
      });
      return save(userId, {
        role: input.role,
        ...(phone && { phone: nextPhone }),
        ...consentPatch(whatsappShareConsent, Boolean(current.whatsappShareConsent)),
      });
    },
    // Placeholder: real account deletion (GDPR) comes in Prompt 9.
    async deleteMe(): Promise<never> {
      throw new AppError(501, 'errors.notImplemented');
    },
  };
}
