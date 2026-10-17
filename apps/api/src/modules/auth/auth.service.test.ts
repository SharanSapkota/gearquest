import { describe, expect, it, vi } from 'vitest';
import type { UserRecord } from '../users/users.repository';
import { createAuthService, type GoogleClaims } from './auth.service';

const SECRET = 'test-secret-test-secret-test-secret';
const claims: GoogleClaims = {
  sub: 'google-1',
  email: 'a@example.com',
  email_verified: true,
  name: 'Anna',
  picture: 'https://img/a.png',
};

const userRecord = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: '65a000000000000000000001',
    googleId: 'google-1',
    email: 'a@example.com',
    name: 'Anna',
    language: 'fi',
    ratingAvg: 0,
    ratingCount: 0,
    ...overrides,
  }) as unknown as UserRecord;

// existing: the user already in the database before this login (null = first login).
function setup(
  verified: GoogleClaims | null = claims,
  user = userRecord(),
  existing: UserRecord | null = user,
) {
  const repo = {
    findByGoogleId: vi.fn().mockResolvedValue(existing),
    createFromGoogle: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
  };
  const verify = vi.fn().mockResolvedValue(verified ?? undefined);
  return { repo, verify, service: createAuthService(repo, verify, SECRET) };
}

describe('auth service', () => {
  it('first login (signup) creates the user from verified claims, with onboarding incomplete', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    const { user, isNew } = await service.loginWithGoogle('tok', true);
    expect(repo.createFromGoogle).toHaveBeenCalledWith({
      googleId: 'google-1',
      email: 'a@example.com',
      name: 'Anna',
      avatarUrl: 'https://img/a.png',
      termsAcceptedAt: expect.any(Date),
    });
    expect(isNew).toBe(true);
    expect(user.onboardingCompleted).toBe(false);
    expect(user.email).toBe('a@example.com');
    expect(user).not.toHaveProperty('googleId');
  });

  it('blocks signup without terms acceptance and creates nothing', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({
      status: 403,
      code: 'auth.termsRequired',
    });
    await expect(service.loginWithGoogle('tok', false)).rejects.toMatchObject({ status: 403 });
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('repeat login finds the existing user and never creates a duplicate', async () => {
    const done = userRecord({ onboardingCompletedAt: new Date(), role: 'renter' });
    const { service, repo } = setup(claims, done, done);
    const a = await service.loginWithGoogle('tok');
    const b = await service.loginWithGoogle('tok', true);
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
    expect(a.isNew).toBe(false);
    expect(a.user.id).toBe(b.user.id);
    expect(a.user.onboardingCompleted).toBe(true);
  });

  it('issues a token that authenticates the same user', async () => {
    const { service } = setup();
    const { token } = await service.loginWithGoogle('tok');
    await expect(service.authenticate(token)).resolves.toBe('65a000000000000000000001');
  });

  it.each([
    ['invalid token', null],
    ['unverified email', { ...claims, email_verified: false }],
    ['missing email', { ...claims, email: undefined }],
  ])('rejects %s', async (_label, bad) => {
    const { service, repo } = setup(bad);
    await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({ status: 401 });
    expect(repo.findByGoogleId).not.toHaveBeenCalled();
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('rejects when the verifier throws', async () => {
    const { service, verify } = setup();
    verify.mockRejectedValue(new Error('bad signature'));
    await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects login for a soft-deleted user', async () => {
    const { service } = setup(claims, userRecord({ deletedAt: new Date() }));
    await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects missing, garbage, or foreign-signed session tokens', async () => {
    const { service } = setup();
    const other = createAuthService(
      setup().repo,
      vi.fn().mockResolvedValue(claims),
      'x'.repeat(32),
    );
    const { token: foreign } = await other.loginWithGoogle('tok');
    await expect(service.authenticate(undefined)).rejects.toMatchObject({ status: 401 });
    await expect(service.authenticate('garbage')).rejects.toMatchObject({ status: 401 });
    await expect(service.authenticate(foreign)).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const { service, repo } = setup();
    const { token } = await service.loginWithGoogle('tok');
    repo.findById.mockResolvedValue(null);
    await expect(service.authenticate(token)).rejects.toMatchObject({ status: 401 });
  });
});
