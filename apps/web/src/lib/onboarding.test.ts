import { describe, expect, it } from 'vitest';
import type { Me } from './api';
import { afterLoginPath, isOwnerReady } from './onboarding';

const me = (fields: Partial<Me>) =>
  ({ id: 'u1', name: 'A', email: 'a@x', language: 'fi', ratingAvg: 0, ratingCount: 0, whatsappShareConsent: false, termsAccepted: true, onboardingCompleted: true, ...fields }) as Me;

describe('afterLoginPath', () => {
  it('sends unfinished users to onboarding, keeping a safe next', () => {
    expect(afterLoginPath({ onboardingCompleted: false }, '/gear/1')).toBe('/onboarding?next=%2Fgear%2F1');
    expect(afterLoginPath({ onboardingCompleted: false }, null)).toBe('/onboarding');
  });

  it('returns finished users to where they came from, never off-site', () => {
    expect(afterLoginPath({ onboardingCompleted: true }, '/rentals?role=owner')).toBe('/rentals?role=owner');
    expect(afterLoginPath({ onboardingCompleted: true }, 'https://evil.example')).toBe('/');
    expect(afterLoginPath({ onboardingCompleted: false }, '//evil.example')).toBe('/onboarding');
  });
});

describe('isOwnerReady', () => {
  it('needs an owner role, a phone and consent', () => {
    expect(isOwnerReady(me({ role: 'owner', phone: '+358401234567', whatsappShareConsent: true }))).toBe(true);
    expect(isOwnerReady(me({ role: 'both', phone: '+358401234567', whatsappShareConsent: true }))).toBe(true);
    expect(isOwnerReady(me({ role: 'renter', phone: '+358401234567', whatsappShareConsent: true }))).toBe(false);
    expect(isOwnerReady(me({ role: 'owner', whatsappShareConsent: true }))).toBe(false);
    expect(isOwnerReady(me({ role: 'owner', phone: '+358401234567' }))).toBe(false);
  });
});
