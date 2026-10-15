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

function setup(user: UserRecord | null = userRecord) {
  const repo = {
    findById: vi.fn().mockResolvedValue(user),
    updateProfile: vi.fn().mockImplementation(async (_id: string, patch: object) => ({
      ...userRecord,
      ...patch,
    })),
  };
  const gear = { findByOwner: vi.fn().mockResolvedValue([gearRecord]) };
  return { repo, gear, service: createUsersService(repo, gear) };
}

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
  });

  it('public profile 404s for unknown users', async () => {
    const { service } = setup(null);
    await expect(service.getPublicProfile('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('public profile never leaks phone, email or googleId (including nested gear)', async () => {
    const { service } = setup();
    const json = JSON.stringify(await service.getPublicProfile('u1'));
    for (const secret of [
      'secret-google-id',
      'secret@example.com',
      '+358401234567',
      'phone',
      'email',
      'googleId',
      'Secret street',
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
