import { describe, expect, it } from 'vitest';
import en from '../messages/en.json';
import fi from '../messages/fi.json';
import { ApiError } from './api';
import { KNOWN_ERROR_CODES, apiErrorKey, needsOwnerSetup, needsPhone } from './rentalErrors';

const lookup = (messages: Record<string, unknown>, code: string) =>
  code.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], messages.apiErrors);

describe('apiErrorKey', () => {
  it('passes known codes through and falls back otherwise', () => {
    expect(apiErrorKey(new ApiError(409, 'rentals.overlap'))).toBe('rentals.overlap');
    expect(apiErrorKey(new ApiError(500, 'errors.internal'))).toBe('generic');
    expect(apiErrorKey(new Error('network'))).toBe('generic');
  });
  it('every known code has a fi and en message', () => {
    for (const code of KNOWN_ERROR_CODES) {
      expect(typeof lookup(en, code), code).toBe('string');
      expect(typeof lookup(fi, code), code).toBe('string');
    }
  });
  it('flags renter phone errors and owner setup errors separately', () => {
    expect(needsPhone(new ApiError(409, 'rentals.renterPhoneRequired'))).toBe(true);
    expect(needsPhone(new ApiError(409, 'rentals.overlap'))).toBe(false);
    for (const code of ['PHONE_REQUIRED', 'CONSENT_REQUIRED', 'ROLE_REQUIRED']) {
      expect(needsOwnerSetup(new ApiError(409, code))).toBe(true);
    }
    expect(needsOwnerSetup(new ApiError(409, 'rentals.overlap'))).toBe(false);
  });
});
