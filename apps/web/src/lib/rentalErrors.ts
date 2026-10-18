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
  'users.phoneRequired',
  'users.consentRequired',
  'users.phoneInUse',
  'gear.notFound',
  'errors.rateLimited',
  'errors.unauthorized',
  'errors.validation',
] as const;

// Message key (under the `apiErrors` namespace) for any thrown value; unknown errors get a generic one.
export function apiErrorKey(err: unknown): string {
  const code = err instanceof ApiError ? err.code : undefined;
  return code && (KNOWN_ERROR_CODES as readonly string[]).includes(code) ? code : 'generic';
}

// Errors that the user fixes in their profile (phone number, or the owner's WhatsApp consent).
export const needsPhone = (err: unknown) =>
  err instanceof ApiError &&
  (err.code === 'rentals.renterPhoneRequired' ||
    err.code === 'users.phoneRequired' ||
    err.code === 'users.consentRequired');
