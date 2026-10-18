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

const OK_RENTER = { role: 'renter' as const, termsAccepted: true };
const OK_OWNER = {
  role: 'owner' as const,
  termsAccepted: true,
  phone: '040 123 4567',
  whatsappShareConsent: true,
};

// existing = what findByGoogleId returns (null: no account for this Google user yet).
function setup(
  verified: GoogleClaims | null = claims,
  user = userRecord(),
  existing: UserRecord | null = user,
  now: () => Date = () => NOW,
) {
  const repo = {
    findByGoogleId: vi.fn().mockResolvedValue(existing),
    createFromGoogle: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
  };
  const verify = vi.fn().mockResolvedValue(verified ?? undefined);
  return { repo, verify, service: createAuthService(repo, verify, SECRET, now) };
}

// Signin of an unknown Google account, returning the signup token the cookie would carry.
async function newUserToken(service: ReturnType<typeof setup>['service']) {
  const res = await service.googleAuth('tok', 'signin');
  if (res.status !== 'NEW_USER') throw new Error('expected NEW_USER');
  return res.signupToken;
}

const ownerRecord = () =>
  userRecord({ role: 'owner', phone: '+358401234567', whatsappShareConsent: true, consentAt: NOW });

describe('sign in', () => {
  it('unknown Google account creates nothing and returns NEW_USER with a signup token', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    const res = await service.googleAuth('tok', 'signin');
    expect(res.status).toBe('NEW_USER');
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
    if (res.status !== 'NEW_USER') return;
    expect(res.signupToken).toEqual(expect.any(String));
    // Only name and avatar are exposed for prefill.
    expect(res.profile).toEqual({ name: 'Anna', avatarUrl: 'https://img/a.png' });
    expect(JSON.stringify(res.profile)).not.toContain('a@example.com');
  });

  it('existing account logs in and returns the dashboard path by role', async () => {
    const { service, repo } = setup(claims, ownerRecord());
    const res = await service.googleAuth('tok', 'signin');
    if (res.status !== 'OK') throw new Error('expected OK');
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
    expect(res.isNew).toBe(false);
    expect(res.dashboardPath).toBe('/dashboard/owner');
    expect(res.user).not.toHaveProperty('googleId');
    await expect(service.authenticate(res.token)).resolves.toBe('65a000000000000000000001');

    const renter = setup(claims, userRecord({ role: 'renter' }));
    const r = await renter.service.googleAuth('tok', 'signin');
    expect(r.status === 'OK' && r.dashboardPath).toBe('/dashboard/renter');
  });

  it('treats an account without a stored role as a renter', async () => {
    const { service } = setup(claims, userRecord({ role: undefined }));
    const res = await service.googleAuth('tok', 'signin');
    expect(res.status === 'OK' && res.user.role).toBe('renter');
  });

  it.each([
    ['invalid token', null],
    ['unverified email', { ...claims, email_verified: false }],
    ['missing email', { ...claims, email: undefined }],
  ])('rejects %s', async (_label, bad) => {
    const { service, repo } = setup(bad, userRecord(), null);
    await expect(service.googleAuth('tok', 'signin')).rejects.toMatchObject({ status: 401 });
    await expect(service.googleAuth('tok', 'signup', OK_RENTER)).rejects.toMatchObject({ status: 401 });
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('rejects when the verifier throws', async () => {
    const { service, verify } = setup();
    verify.mockRejectedValue(new Error('bad signature'));
    await expect(service.googleAuth('tok', 'signin')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a soft-deleted user', async () => {
    const { service } = setup(claims, userRecord({ deletedAt: new Date() }));
    await expect(service.googleAuth('tok', 'signin')).rejects.toMatchObject({ status: 401 });
    await expect(service.googleAuth('tok', 'signup', OK_RENTER)).rejects.toMatchObject({ status: 401 });
  });
});

describe('sign up', () => {
  it('renter signup without a phone succeeds; identity comes from the verified claims only', async () => {
    const { service, repo } = setup(claims, userRecord({ role: 'renter' }), null);
    const res = await service.googleAuth('tok', 'signup', OK_RENTER);
    if (res.status !== 'OK') throw new Error('expected OK');
    expect(res.isNew).toBe(true);
    expect(repo.createFromGoogle).toHaveBeenCalledWith({
      googleId: 'google-1',
      email: 'a@example.com',
      name: 'Anna',
      avatarUrl: 'https://img/a.png',
      role: 'renter',
      termsAcceptedAt: NOW,
    });
    expect(res.dashboardPath).toBe('/dashboard/renter');
  });

  it('fails without accepted terms and creates nothing', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    await expect(
      service.googleAuth('tok', 'signup', { ...OK_RENTER, termsAccepted: false }),
    ).rejects.toMatchObject({ status: 403, code: 'auth.termsRequired' });
    await expect(
      service.googleAuth('tok', 'signup', { ...OK_OWNER, termsAccepted: false }),
    ).rejects.toMatchObject({ code: 'auth.termsRequired' });
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it.each(['owner', 'both'] as const)('%s signup fails without a phone', async (role) => {
    const { service, repo } = setup(claims, userRecord(), null);
    await expect(
      service.googleAuth('tok', 'signup', { role, termsAccepted: true, whatsappShareConsent: true }),
    ).rejects.toMatchObject({ status: 409, code: 'PHONE_REQUIRED' });
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it.each(['owner', 'both'] as const)('%s signup fails without consent', async (role) => {
    const { service, repo } = setup(claims, userRecord(), null);
    for (const consent of [undefined, false]) {
      await expect(
        service.googleAuth('tok', 'signup', {
          role,
          termsAccepted: true,
          phone: '0401234567',
          whatsappShareConsent: consent,
        }),
      ).rejects.toMatchObject({ status: 409, code: 'CONSENT_REQUIRED' });
    }
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('rejects an invalid owner phone', async () => {
    const { service } = setup(claims, userRecord(), null);
    await expect(
      service.googleAuth('tok', 'signup', { ...OK_OWNER, phone: '123' }),
    ).rejects.toMatchObject({ status: 400, code: 'users.invalidPhone' });
  });

  it('owner signup stores an E.164 phone and the consent time', async () => {
    const { service, repo } = setup(claims, ownerRecord(), null);
    await service.googleAuth('tok', 'signup', { ...OK_OWNER, language: 'en' });
    expect(repo.createFromGoogle).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'owner',
        phone: '+358401234567',
        whatsappShareConsent: true,
        consentAt: NOW,
        termsAcceptedAt: NOW,
        language: 'en',
      }),
    );
  });

  it('signup for an account that already exists just logs in and changes nothing', async () => {
    const { service, repo } = setup(claims, ownerRecord());
    const res = await service.googleAuth('tok', 'signup', OK_RENTER);
    expect(res.status === 'OK' && res.isNew).toBe(false);
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('signup intent without signupData is rejected', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    await expect(service.googleAuth('tok', 'signup')).rejects.toMatchObject({ status: 400 });
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });
});

describe('signup completion (signupToken)', () => {
  it('creates the account from the Google profile inside the token', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    const signupToken = await newUserToken(service);
    expect(await service.pendingSignup(signupToken)).toEqual({
      name: 'Anna',
      avatarUrl: 'https://img/a.png',
    });
    const res = await service.completeSignup(signupToken, OK_RENTER);
    expect(res.isNew).toBe(true);
    expect(repo.createFromGoogle).toHaveBeenCalledWith(
      expect.objectContaining({ googleId: 'google-1', email: 'a@example.com', name: 'Anna' }),
    );
  });

  it('applies the same rules: terms, and owner phone + consent', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    const token = await newUserToken(service);
    await expect(
      service.completeSignup(token, { ...OK_RENTER, termsAccepted: false }),
    ).rejects.toMatchObject({ code: 'auth.termsRequired' });
    await expect(
      service.completeSignup(token, { role: 'owner', termsAccepted: true }),
    ).rejects.toMatchObject({ code: 'PHONE_REQUIRED' });
    await expect(
      service.completeSignup(token, { role: 'owner', termsAccepted: true, phone: '0401234567' }),
    ).rejects.toMatchObject({ code: 'CONSENT_REQUIRED' });
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('logs in instead of duplicating when the account already exists', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    const token = await newUserToken(service);
    repo.findByGoogleId.mockResolvedValue(userRecord({ role: 'renter' }));
    const res = await service.completeSignup(token, OK_RENTER);
    expect(res.isNew).toBe(false);
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('rejects a missing, garbage or forged signupToken', async () => {
    const { service, repo } = setup(claims, userRecord(), null);
    const other = createAuthService(
      setup(claims, userRecord(), null).repo,
      vi.fn().mockResolvedValue(claims),
      'x'.repeat(32),
      () => NOW,
    );
    const forged = await newUserToken(other as unknown as ReturnType<typeof setup>['service']);
    for (const bad of [undefined, 'garbage', forged]) {
      await expect(service.completeSignup(bad, OK_RENTER)).rejects.toMatchObject({
        status: 401,
        code: 'auth.signupTokenInvalid',
      });
      await expect(service.pendingSignup(bad)).rejects.toMatchObject({ status: 401 });
    }
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('rejects an expired signupToken (10 minute lifetime)', async () => {
    let now = NOW;
    const { service, repo } = setup(claims, userRecord(), null, () => now);
    const token = await newUserToken(service);
    now = new Date(NOW.getTime() + 9 * 60_000);
    await expect(service.completeSignup(token, OK_RENTER)).resolves.toMatchObject({ status: 'OK' });
    now = new Date(NOW.getTime() + 11 * 60_000);
    repo.createFromGoogle.mockClear();
    await expect(service.completeSignup(token, OK_RENTER)).rejects.toMatchObject({ status: 401 });
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('a session token is not a signup token, and a signup token is not a session', async () => {
    const { service } = setup(claims, ownerRecord());
    const login = await service.googleAuth('tok', 'signin');
    if (login.status !== 'OK') throw new Error('expected OK');
    await expect(service.completeSignup(login.token, OK_RENTER)).rejects.toMatchObject({ status: 401 });

    const fresh = setup(claims, userRecord(), null);
    const signupToken = await newUserToken(fresh.service);
    await expect(fresh.service.authenticate(signupToken)).rejects.toMatchObject({ status: 401 });
  });
});

describe('session tokens', () => {
  it('rejects missing, garbage, or foreign-signed session tokens', async () => {
    const { service } = setup();
    const other = createAuthService(
      setup().repo,
      vi.fn().mockResolvedValue(claims),
      'x'.repeat(32),
      () => NOW,
    );
    const foreign = await other.googleAuth('tok', 'signin');
    if (foreign.status !== 'OK') throw new Error('expected OK');
    await expect(service.authenticate(undefined)).rejects.toMatchObject({ status: 401 });
    await expect(service.authenticate('garbage')).rejects.toMatchObject({ status: 401 });
    await expect(service.authenticate(foreign.token)).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const { service, repo } = setup();
    const res = await service.googleAuth('tok', 'signin');
    if (res.status !== 'OK') throw new Error('expected OK');
    repo.findById.mockResolvedValue(null);
    await expect(service.authenticate(res.token)).rejects.toMatchObject({ status: 401 });
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
