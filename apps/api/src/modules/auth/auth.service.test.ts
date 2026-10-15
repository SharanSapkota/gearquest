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

function setup(verified: GoogleClaims | null = claims, user = userRecord()) {
  const repo = {
    upsertFromGoogle: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
  };
  const verify = vi.fn().mockResolvedValue(verified ?? undefined);
  return { repo, verify, service: createAuthService(repo, verify, SECRET) };
}

describe('auth service', () => {
  it('first login upserts the user from verified claims only', async () => {
    const { service, repo } = setup();
    const { user } = await service.loginWithGoogle('tok');
    expect(repo.upsertFromGoogle).toHaveBeenCalledWith({
      googleId: 'google-1',
      email: 'a@example.com',
      name: 'Anna',
      avatarUrl: 'https://img/a.png',
    });
    expect(user.email).toBe('a@example.com');
    expect(user).not.toHaveProperty('googleId');
  });

  it('repeat login goes through the same upsert (no create call, no duplicate)', async () => {
    const { service, repo } = setup();
    const a = await service.loginWithGoogle('tok');
    const b = await service.loginWithGoogle('tok');
    expect(repo.upsertFromGoogle).toHaveBeenCalledTimes(2);
    expect(a.user.id).toBe(b.user.id);
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
