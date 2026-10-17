import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { OnboardingInput, UpdateProfileInput } from '@gearshare/shared';
import { AppError, notFound } from '../../lib/errors';
import { toPublicGear } from '../gear/gear.mapper';
import type { GearRepository } from '../gear/gear.repository';
import type { RentalsRepository } from '../rentals/rentals.repository';
import { toPrivateUser, toPublicUser } from './users.mapper';
import { assertOwnerReady, isOwnerRole } from './users.policy';
import type { ProfilePatch, UsersRepository } from './users.repository';

type Repo = Pick<UsersRepository, 'findById' | 'updateProfile'>;
type GearLookup = Pick<GearRepository, 'findByOwner' | 'findAllByOwner'>;
type RentalLookup = Pick<RentalsRepository, 'countAcceptedByParty'>;

// Finnish national numbers (040 123 4567) and international numbers; stored as E.164.
export function normalizePhone(input: string): string {
  const parsed = parsePhoneNumberFromString(input, 'FI');
  if (!parsed?.isValid()) throw new AppError(400, 'users.invalidPhone');
  return parsed.number;
}

export function createUsersService(
  repo: Repo,
  gear: GearLookup,
  rentals: RentalLookup,
  clock: () => Date = () => new Date(),
) {
  async function load(userId: string) {
    const user = await repo.findById(userId);
    if (!user) throw notFound('users.notFound');
    return user;
  }

  async function save(userId: string, patch: ProfilePatch) {
    const user = await repo.updateProfile(userId, patch);
    if (!user) throw notFound('users.notFound');
    return toPrivateUser(user);
  }

  // Listings and accepted rentals rely on the phone (it is revealed after acceptance).
  async function assertPhoneNotInUse(userId: string) {
    const [listed, accepted] = await Promise.all([
      gear.findAllByOwner(userId),
      rentals.countAcceptedByParty(userId),
    ]);
    if (listed.length > 0 || accepted > 0) throw new AppError(409, 'users.phoneInUse');
  }

  return {
    async getPublicProfile(id: string) {
      const user = await load(id);
      const listed = await gear.findByOwner(id);
      return { ...toPublicUser(user), gear: listed.map(toPublicGear) };
    },
    async getMe(userId: string) {
      return toPrivateUser(await load(userId));
    },
    // Always writes to the caller's own id: there is no way to address another user's profile.
    async updateMe(userId: string, input: UpdateProfileInput) {
      const { phone, whatsappShareConsent, ...rest } = input;
      const current = await load(userId);
      const nextPhone =
        phone === undefined ? current.phone : phone === '' ? null : normalizePhone(phone);
      const nextConsent = whatsappShareConsent ?? Boolean(current.whatsappShareConsent);

      const removesPhone = Boolean(current.phone) && !nextPhone;
      const withdrawsConsent = Boolean(current.whatsappShareConsent) && !nextConsent;
      if (removesPhone || withdrawsConsent) await assertPhoneNotInUse(userId);

      const touchesOwnerFields =
        phone !== undefined || whatsappShareConsent !== undefined || input.role !== undefined;
      if (touchesOwnerFields && isOwnerRole(input.role ?? current.role)) {
        assertOwnerReady({ phone: nextPhone, whatsappShareConsent: nextConsent });
      }

      return save(userId, {
        ...rest,
        ...(phone !== undefined && { phone: nextPhone ?? null }),
        ...(whatsappShareConsent !== undefined && { whatsappShareConsent }),
        ...(whatsappShareConsent && !current.whatsappShareConsent && { consentAt: clock() }),
      });
    },
    // Step 2 of onboarding. Owners must give a phone and consent; renters may skip the phone.
    async completeOnboarding(userId: string, input: OnboardingInput) {
      const { role, name, language, phone, whatsappShareConsent } = input;
      const current = await load(userId);
      const owner = isOwnerRole(role);
      const normalized = phone ? normalizePhone(phone) : undefined;
      if (owner) {
        assertOwnerReady({ phone: normalized ?? current.phone, whatsappShareConsent });
      }
      const now = clock();
      return save(userId, {
        role,
        ...(name && { name }),
        ...(language && { language }),
        ...(normalized && { phone: normalized }),
        ...(owner && !current.whatsappShareConsent && { whatsappShareConsent: true, consentAt: now }),
        onboardingCompletedAt: now,
      });
    },
    // Placeholder: real account deletion (GDPR) comes in Prompt 9.
    async deleteMe(): Promise<never> {
      throw new AppError(501, 'errors.notImplemented');
    },
  };
}
