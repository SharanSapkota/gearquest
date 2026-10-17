import { ApiError } from './api';

// Backend error codes that have a friendly message under `apiErrors` in the message files.
export const KNOWN_ERROR_CODES = [
  'rentals.overlap',
  'rentals.ownGear',
  'rentals.tooManyOpenRequests',
  'rentals.renterPhoneRequired',
  'owner.phoneRequired',
  'owner.consentRequired',
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

// Errors that the user fixes by adding a phone number (and, for owners, consent) to their profile.
export const needsPhone = (err: unknown) =>
  err instanceof ApiError &&
  (err.code === 'rentals.renterPhoneRequired' ||
    err.code === 'owner.phoneRequired' ||
    err.code === 'owner.consentRequired');
