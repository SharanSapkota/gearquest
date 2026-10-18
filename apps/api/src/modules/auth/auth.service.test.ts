import { describe, expect, it, vi } from 'vitest';
import type { UserRecord } from '../users/users.repository';
import { googleRejectionReason } from './auth.instance';
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
    termsAcceptedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as unknown as UserRecord;

const NOW = new Date('2026-10-18T10:00:00Z');

// existing = what findByGoogleId returns before login (null: first login).
function setup(
  verified: GoogleClaims | null = claims,
  user = userRecord(),
  existing: UserRecord | null = user,
) {
  const repo = {
    findByGoogleId: vi.fn().mockResolvedValue(existing),
    upsertFromGoogle: vi.fn().mockResolvedValue(user),
    acceptTerms: vi.fn().mockResolvedValue({ ...user, termsAcceptedAt: NOW }),
    findById: vi.fn().mockResolvedValue(user),
  };
  const verify = vi.fn().mockResolvedValue(verified ?? undefined);
  return { repo, verify, service: createAuthService(repo, verify, SECRET, () => NOW) };
}

describe('auth service', () => {
  it('first signup creates the user from verified claims only, with onboarding incomplete', async () => {
    const { service, repo } = setup(claims, userRecord({ termsAcceptedAt: NOW }), null);
    const { user, isNew } = await service.loginWithGoogle('tok', true);
    expect(repo.upsertFromGoogle).toHaveBeenCalledWith({
      googleId: 'google-1',
      email: 'a@example.com',
      name: 'Anna',
      avatarUrl: 'https://img/a.png',
      termsAcceptedAt: NOW,
    });
    expect(isNew).toBe(true);
    expect(user.email).toBe('a@example.com');
    expect(user.onboardingCompleted).toBe(false);
    expect(user.termsAccepted).toBe(true);
    expect(user).not.toHaveProperty('googleId');
  });

  it('repeat login finds the existing user and never creates another', async () => {
    const { service, repo } = setup();
    const a = await service.loginWithGoogle('tok');
    const b = await service.loginWithGoogle('tok');
    expect(repo.upsertFromGoogle).not.toHaveBeenCalled();
    expect(a.isNew).toBe(false);
    expect(a.user.id).toBe(b.user.id);
  });

  it('signup is blocked without terms acceptance: nothing is created', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({
      status: 403,
      code: 'auth.termsRequired',
    });
    await expect(service.loginWithGoogle('tok', false)).rejects.toMatchObject({ status: 403 });
    expect(repo.upsertFromGoogle).not.toHaveBeenCalled();
  });

  it('an existing account without recorded terms must accept them once', async () => {
    const legacy = userRecord({ termsAcceptedAt: undefined });
    const { service, repo } = setup(claims, legacy, legacy);
    await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({ code: 'auth.termsRequired' });
    const { user, isNew } = await service.loginWithGoogle('tok', true);
    expect(repo.acceptTerms).toHaveBeenCalledWith('65a000000000000000000001', NOW);
    expect(isNew).toBe(false);
    expect(user.termsAccepted).toBe(true);
  });

  it('reports onboarding as completed once it is', async () => {
    const { service } = setup(claims, userRecord({ onboardingCompletedAt: NOW, role: 'renter' }));
    const { user } = await service.loginWithGoogle('tok');
    expect(user.onboardingCompleted).toBe(true);
    expect(user.role).toBe('renter');
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
    expect(repo.upsertFromGoogle).not.toHaveBeenCalled();
  });

  it('rejects when the verifier throws', async () => {
    const { service, verify } = setup();
    verify.mockRejectedValue(new Error('bad signature'));
    await expect(service.loginWithGoogle('tok')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects login for a soft-deleted user', async () => {
    const { service } = setup(claims, userRecord({ deletedAt: new Date() }));
    await expect(service.loginWithGoogle('tok', true)).rejects.toMatchObject({ status: 401 });
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

describe('googleRejectionReason (dev log)', () => {
  it.each([
    ['Wrong recipient, payload audience != requiredAudience', /audience mismatch/],
    ['Token used too late, 1 > 0: {"email":"a@example.com"}', /clock/],
    ['Invalid token signature: abc', /signature/],
    ['something else {"email":"a@example.com"}', /verification failed/],
  ])('%s', (message, expected) => {
    const reason = googleRejectionReason(new Error(message));
    expect(reason).toMatch(expected);
    // Never echoes the library message, which may contain token claims.
    expect(reason).not.toContain('a@example.com');
  });
});
