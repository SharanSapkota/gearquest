import { ApiError } from './api';

// Backend error codes that have a friendly message under `apiErrors` in the message files.
export const KNOWN_ERROR_CODES = [
  'rentals.overlap',
  'rentals.ownGear',
  'rentals.tooManyOpenRequests',
  'rentals.renterPhoneRequired',
  'rentals.gearNotActive',
  'rentals.startInPast',
  'rentals.invalidRange',
  'rentals.invalidHourlyRange',
  'rentals.invalidDailyRange',
  'rentals.belowMinHours',
  'rentals.tooLong',
  'rentals.modeNotAvailable',
  'rentals.expired',
  'rentals.invalidTransition',
  'rentals.forbidden',
  'rentals.notEnded',
  'rentals.alreadyEnded',
  'rentals.notFound',
  'PHONE_REQUIRED',
  'CONSENT_REQUIRED',
  'ROLE_REQUIRED',
  'users.phoneInUse',
  'gear.notFound',
  'gear.invalidImageUrl',
  'gear.tooManyImages',
  'gear.forbidden',
  'users.invalidPhone',
  'auth.signupTokenInvalid',
  'auth.termsRequired',
  'errors.rateLimited',
  'errors.unauthorized',
  'errors.validation',
] as const;

// Message key (under the `apiErrors` namespace) for any thrown value; unknown errors get a generic one.
export function apiErrorKey(err: unknown): string {
  const code = err instanceof ApiError ? err.code : undefined;
  return code && (KNOWN_ERROR_CODES as readonly string[]).includes(code) ? code : 'generic';
}

// Errors fixed by completing owner setup (phone + WhatsApp consent, or becoming an owner).
export const needsOwnerSetup = (err: unknown) =>
  err instanceof ApiError &&
  (err.code === 'PHONE_REQUIRED' || err.code === 'CONSENT_REQUIRED' || err.code === 'ROLE_REQUIRED');

// A renter's own phone is missing: fixed in the profile.
export const needsPhone = (err: unknown) =>
  err instanceof ApiError && err.code === 'rentals.renterPhoneRequired';
