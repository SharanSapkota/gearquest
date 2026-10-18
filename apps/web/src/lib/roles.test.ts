import { describe, expect, it } from 'vitest';
import type { Me } from './api';
import {
  afterLoginPath,
  dashboardFor,
  emptyDraft,
  isOwnerReady,
  parseView,
  signupErrorFromCode,
  toSignupData,
  validateDraft,
} from './roles';

const me = (fields: Partial<Me>): Me =>
  ({ id: 'u1', name: 'A', email: 'a@x', language: 'fi', role: 'renter', ratingAvg: 0, ratingCount: 0, whatsappShareConsent: false, termsAccepted: true, ...fields }) as Me;

describe('isOwnerReady', () => {
  it('needs owner role, phone and consent', () => {
    expect(isOwnerReady(me({ role: 'owner', phone: '+358401234567', whatsappShareConsent: true }))).toBe(true);
    expect(isOwnerReady(me({ role: 'both', phone: '+358401234567', whatsappShareConsent: true }))).toBe(true);
    expect(isOwnerReady(me({ role: 'renter', phone: '+358401234567', whatsappShareConsent: true }))).toBe(false);
    expect(isOwnerReady(me({ role: 'owner', whatsappShareConsent: true }))).toBe(false);
    expect(isOwnerReady(me({ role: 'owner', phone: '+358401234567' }))).toBe(false);
  });
});

describe('afterLoginPath', () => {
  it('goes to the safe return-to page when there is one', () => {
    expect(afterLoginPath({ role: 'owner' }, '/rentals?role=owner')).toBe('/rentals?role=owner');
    expect(afterLoginPath({ role: 'renter' }, '/gear/1')).toBe('/gear/1');
  });

  it('otherwise goes to the dashboard of the role', () => {
    expect(afterLoginPath({ role: 'owner' }, null)).toBe('/dashboard/owner');
    expect(afterLoginPath({ role: 'renter' }, undefined)).toBe('/dashboard/renter');
    expect(afterLoginPath({ role: 'renter' }, '/')).toBe('/dashboard/renter');
    // "both" resolves the remembered view on the server.
    expect(afterLoginPath({ role: 'both' }, null)).toBe('/dashboard');
  });

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)'])(
    'never follows an unsafe next (%s)',
    (next) => {
      expect(afterLoginPath({ role: 'owner' }, next)).toBe('/dashboard/owner');
    },
  );
});

describe('dashboardFor', () => {
  it('uses the remembered view only for "both"', () => {
    expect(dashboardFor('both', 'owner')).toBe('/dashboard/owner');
    expect(dashboardFor('both', 'renter')).toBe('/dashboard/renter');
    expect(dashboardFor('both')).toBe('/dashboard/renter');
    expect(dashboardFor('renter', 'owner')).toBe('/dashboard/renter');
    expect(dashboardFor('owner', 'renter')).toBe('/dashboard/owner');
  });

  it('parses the view cookie strictly', () => {
    expect(parseView('owner')).toBe('owner');
    expect(parseView('admin')).toBeUndefined();
    expect(parseView(undefined)).toBeUndefined();
  });
});

describe('validateDraft', () => {
  const draft = { ...emptyDraft, terms: true };

  it('requires a role and the terms', () => {
    expect(validateDraft(emptyDraft)).toBe('roleRequired');
    expect(validateDraft({ ...draft, role: 'renter', terms: false })).toBe('termsRequired');
  });

  it('renter needs no phone', () => {
    expect(validateDraft({ ...draft, role: 'renter' })).toBeNull();
  });

  it.each(['owner', 'both'] as const)('%s needs a valid phone and consent', (role) => {
    expect(validateDraft({ ...draft, role })).toBe('phoneRequired');
    expect(validateDraft({ ...draft, role, phone: '+358 ' })).toBe('phoneRequired');
    expect(validateDraft({ ...draft, role, phone: '123' })).toBe('phoneInvalid');
    expect(validateDraft({ ...draft, role, phone: '040 123 4567' })).toBe('consentRequired');
    expect(validateDraft({ ...draft, role, phone: '040 123 4567', consent: true })).toBeNull();
  });
});

describe('toSignupData', () => {
  it('sends only allowed fields; renters send no phone or consent', () => {
    expect(toSignupData({ role: 'renter', terms: true, phone: '+358 ', consent: true }, 'fi')).toEqual({
      role: 'renter',
      termsAccepted: true,
      language: 'fi',
    });
    expect(toSignupData({ role: 'both', terms: true, phone: '040 123 4567', consent: true }, 'en')).toEqual({
      role: 'both',
      termsAccepted: true,
      language: 'en',
      phone: '040 123 4567',
      whatsappShareConsent: true,
    });
  });
});

describe('signupErrorFromCode', () => {
  it('maps API codes to form errors', () => {
    expect(signupErrorFromCode('PHONE_REQUIRED')).toBe('phoneRequired');
    expect(signupErrorFromCode('CONSENT_REQUIRED')).toBe('consentRequired');
    expect(signupErrorFromCode('auth.termsRequired')).toBe('termsRequired');
    expect(signupErrorFromCode('other')).toBeUndefined();
  });
});
