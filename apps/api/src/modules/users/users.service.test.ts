import { describe, expect, it, vi } from 'vitest';
import type { GearRecord } from '../gear/gear.repository';
import { normalizePhone, createUsersService } from './users.service';
import type { UserRecord } from './users.repository';

const userRecord = {
  _id: 'u1',
  googleId: 'secret-google-id',
  email: 'secret@example.com',
  phone: '+358401234567',
  name: 'Anna',
  avatarUrl: 'https://img/a.png',
  bio: 'Hi',
  language: 'fi',
  ratingAvg: 4.5,
  ratingCount: 2,
} as unknown as UserRecord;

const gearRecord = {
  _id: 'g1',
  ownerId: 'u1',
  title: 'Skis',
  description: '',
  category: 'ski',
  condition: 'good',
  images: [],
  city: 'Helsinki',
  address: 'Secret street 1',
  location: { type: 'Point', coordinates: [24.9, 60.1] },
  publicLocation: { type: 'Point', coordinates: [24.901, 60.102] },
  pricing: { dailyCents: 2000 },
  ownerRatingAvg: 0,
  status: 'active',
  createdAt: new Date(),
} as unknown as NonNullable<GearRecord>;

const NOW = new Date('2026-10-18T10:00:00Z');

function setup(
  user: UserRecord | null = userRecord,
  commitments: { listings?: number; accepted?: boolean } = {},
) {
  const repo = {
    findById: vi.fn().mockResolvedValue(user),
    updateProfile: vi.fn().mockImplementation(async (_id: string, patch: object) => ({
      ...user,
      ...patch,
    })),
  };
  const gear = {
    findByOwner: vi.fn().mockResolvedValue([gearRecord]),
    countByOwner: vi.fn().mockResolvedValue(commitments.listings ?? 0),
  };
  const rentals = { existsAcceptedAsOwner: vi.fn().mockResolvedValue(commitments.accepted ?? false) };
  return { repo, gear, rentals, service: createUsersService(repo, gear, rentals, () => NOW) };
}

const withFields = (fields: object) => ({ ...userRecord, ...fields }) as unknown as UserRecord;
const noPhone = withFields({ phone: undefined });

describe('normalizePhone', () => {
  it.each([
    ['040 123 4567', '+358401234567'],
    ['0401234567', '+358401234567'],
    ['+358 40 123 4567', '+358401234567'],
    ['+46701234567', '+46701234567'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['abc', '123', '+358', '040 12'])('rejects %s', (input) => {
    expect(() => normalizePhone(input)).toThrowError(expect.objectContaining({ status: 400 }));
  });
});

describe('users service', () => {
  it('stores the phone as E.164', async () => {
    const { service, repo } = setup();
    await service.updateMe('u1', { phone: '040 123 4567', name: 'Anna K' });
    expect(repo.updateProfile).toHaveBeenCalledWith('u1', {
      name: 'Anna K',
      phone: '+358401234567',
    });
  });

  it('rejects an invalid phone without writing', async () => {
    const { service, repo } = setup();
    await expect(service.updateMe('u1', { phone: 'nope' })).rejects.toMatchObject({ status: 400 });
    expect(repo.updateProfile).not.toHaveBeenCalled();
  });

  it('clears the phone when given an empty string', async () => {
    const { service, repo } = setup();
    await service.updateMe('u1', { phone: '' });
    expect(repo.updateProfile).toHaveBeenCalledWith('u1', { phone: null });
  });

  it('only ever writes to the caller id (owner-only editing)', async () => {
    const { service, repo } = setup();
    await service.updateMe('caller', { bio: 'x' });
    expect(repo.updateProfile).toHaveBeenCalledTimes(1);
    expect(repo.updateProfile.mock.calls[0]?.[0]).toBe('caller');
  });

  it('404s when the user is gone', async () => {
    const { service, repo } = setup();
    repo.updateProfile.mockResolvedValue(null);
    await expect(service.updateMe('u1', { bio: 'x' })).rejects.toMatchObject({ status: 404 });
    const gone = setup(null);
    await expect(gone.service.updateMe('u1', { bio: 'x' })).rejects.toMatchObject({ status: 404 });
  });

  it.each([
    ['active listings', { listings: 1 }],
    ['accepted rentals', { accepted: true }],
  ])('blocks removing the phone while the owner has %s', async (_label, commitments) => {
    const { service, repo } = setup(userRecord, commitments);
    await expect(service.updateMe('u1', { phone: '' })).rejects.toMatchObject({
      status: 409,
      code: 'users.phoneInUse',
    });
    expect(repo.updateProfile).not.toHaveBeenCalled();
  });

  it.each(['owner', 'both'] as const)('becoming %s requires phone and consent', async (role) => {
    const consenting = withFields({ whatsappShareConsent: true });
    await expect(setup(noPhone).service.updateMe('u1', { role, whatsappShareConsent: true })).rejects.toMatchObject({
      code: 'users.phoneRequired',
    });
    await expect(setup(userRecord).service.updateMe('u1', { role })).rejects.toMatchObject({
      code: 'users.consentRequired',
    });
    const { service, repo } = setup(userRecord);
    await service.updateMe('u1', { role, phone: '040 123 4567', whatsappShareConsent: true });
    expect(repo.updateProfile).toHaveBeenCalledWith('u1', {
      role,
      phone: '+358401234567',
      whatsappShareConsent: true,
      consentAt: NOW,
    });
    // Already on file: the role change alone is enough.
    await expect(setup(consenting).service.updateMe('u1', { role })).resolves.toMatchObject({ role });
  });

  it('an owner cannot withdraw consent while staying an owner', async () => {
    const owner = withFields({ role: 'owner', whatsappShareConsent: true });
    await expect(setup(owner).service.updateMe('u1', { whatsappShareConsent: false })).rejects.toMatchObject({
      code: 'users.consentRequired',
    });
  });
});

describe('onboarding', () => {
  const fresh = withFields({ phone: undefined, role: undefined });

  it('renter onboarding succeeds without a phone and marks onboarding complete', async () => {
    const { service, repo } = setup(fresh);
    const me = await service.completeOnboarding('u1', { role: 'renter', name: 'Anna', language: 'en' });
    expect(repo.updateProfile).toHaveBeenCalledWith('u1', {
      role: 'renter',
      name: 'Anna',
      language: 'en',
      onboardingCompletedAt: NOW,
    });
    expect(me.onboardingCompleted).toBe(true);
    expect(me.phone).toBeUndefined();
  });

  it.each(['owner', 'both'] as const)('%s onboarding fails without a phone', async (role) => {
    const { service, repo } = setup(fresh);
    await expect(
      service.completeOnboarding('u1', { role, whatsappShareConsent: true }),
    ).rejects.toMatchObject({ status: 409, code: 'users.phoneRequired' });
    expect(repo.updateProfile).not.toHaveBeenCalled();
  });

  it.each(['owner', 'both'] as const)('%s onboarding fails without consent', async (role) => {
    const { service, repo } = setup(fresh);
    await expect(
      service.completeOnboarding('u1', { role, phone: '0401234567' }),
    ).rejects.toMatchObject({ status: 409, code: 'users.consentRequired' });
    await expect(
      service.completeOnboarding('u1', { role, phone: '0401234567', whatsappShareConsent: false }),
    ).rejects.toMatchObject({ code: 'users.consentRequired' });
    expect(repo.updateProfile).not.toHaveBeenCalled();
  });

  it('owner onboarding stores the phone as E.164 with the consent time', async () => {
    const { service, repo } = setup(fresh);
    const me = await service.completeOnboarding('u1', {
      role: 'owner',
      phone: '040 123 4567',
      whatsappShareConsent: true,
    });
    expect(repo.updateProfile).toHaveBeenCalledWith('u1', {
      role: 'owner',
      phone: '+358401234567',
      whatsappShareConsent: true,
      consentAt: NOW,
      onboardingCompletedAt: NOW,
    });
    expect(me.whatsappShareConsent).toBe(true);
  });

  it('rejects an invalid owner phone', async () => {
    const { service } = setup(fresh);
    await expect(
      service.completeOnboarding('u1', { role: 'owner', phone: '123', whatsappShareConsent: true }),
    ).rejects.toMatchObject({ status: 400, code: 'users.invalidPhone' });
  });
});

describe('users service privacy', () => {

  it('public profile 404s for unknown users', async () => {
    const { service } = setup(null);
    await expect(service.getPublicProfile('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('public profile never leaks phone, email or googleId (including nested gear)', async () => {
    // A consenting owner too: consent is permission to reveal after acceptance, not publicity.
    const { service } = setup(withFields({ role: 'owner', whatsappShareConsent: true, consentAt: NOW }));
    const json = JSON.stringify(await service.getPublicProfile('u1'));
    for (const secret of [
      'secret-google-id',
      'secret@example.com',
      '+358401234567',
      'phone',
      'email',
      'googleId',
      'Secret street',
      'whatsapp',
      'consent',
    ]) {
      expect(json).not.toContain(secret);
    }
    expect(json).toContain('Anna');
  });

  it('own profile (private view) includes email/phone but never googleId', async () => {
    const { service } = setup();
    const me = await service.getMe('u1');
    expect(me.email).toBe('secret@example.com');
    expect(me.phone).toBe('+358401234567');
    expect(JSON.stringify(me)).not.toContain('secret-google-id');
  });

  it('delete is a placeholder', async () => {
    const { service } = setup();
    await expect(service.deleteMe()).rejects.toMatchObject({ status: 501 });
  });
});
