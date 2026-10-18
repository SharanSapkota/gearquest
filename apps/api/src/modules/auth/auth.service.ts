import { jwtVerify, SignJWT } from 'jose';
import {
  dashboardPath,
  SIGNUP_TOKEN_TTL_SECONDS,
  type AUTH_INTENTS,
  type SignupData,
} from '@gearshare/shared';
import { AppError, unauthorized } from '../../lib/errors';
import { toPrivateUser } from '../users/users.mapper';
import { assertOwnerReady, isOwnerRole } from '../users/users.policy';
import type { UsersRepository } from '../users/users.repository';
import { normalizePhone } from '../users/users.service';

type Repo = Pick<UsersRepository, 'findById' | 'findByGoogleId' | 'createFromGoogle'>;

export type GoogleClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};
export type GoogleVerifier = (idToken: string) => Promise<GoogleClaims | undefined>;
type Intent = (typeof AUTH_INTENTS)[number];

// The Google profile we verified, carried between "sign in found nothing" and "create account".
type GoogleProfile = { sub: string; email: string; name: string; picture?: string };

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SIGNUP_PURPOSE = 'signup';

export function createAuthService(
  repo: Repo,
  verifyGoogle: GoogleVerifier,
  jwtSecret: string,
  clock: () => Date = () => new Date(),
) {
  const key = new TextEncoder().encode(jwtSecret);
  const seconds = () => Math.floor(clock().getTime() / 1000);

  // Identity comes only from the claims Google signed, never from the client body.
  async function verifiedProfile(idToken: string): Promise<GoogleProfile> {
    const claims = await verifyGoogle(idToken).catch(() => undefined);
    if (!claims?.sub || !claims.email || !claims.email_verified) throw unauthorized();
    return {
      sub: claims.sub,
      email: claims.email,
      name: claims.name || claims.email,
      ...(claims.picture && { picture: claims.picture }),
    };
  }

  async function issueSession(userId: string) {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt(seconds())
      .setExpirationTime(seconds() + SESSION_TTL_SECONDS)
      .sign(key);
  }

  async function loggedIn(user: NonNullable<Awaited<ReturnType<Repo['findById']>>>, isNew: boolean) {
    const dto = toPrivateUser(user);
    return {
      status: 'OK' as const,
      token: await issueSession(String(user._id)),
      user: dto,
      dashboardPath: dashboardPath(dto.role),
      isNew,
    };
  }

  // Terms are mandatory; owner/both also need a valid phone and WhatsApp consent. Renters need
  // neither. This is the only place those rules are applied to a new account.
  function validateSignup(data: SignupData, now: Date) {
    if (data.termsAccepted !== true) throw new AppError(403, 'auth.termsRequired');
    const owner = isOwnerRole(data.role);
    const phone = data.phone ? normalizePhone(data.phone) : undefined;
    if (owner) {
      assertOwnerReady({ role: data.role, phone, whatsappShareConsent: data.whatsappShareConsent });
    }
    return {
      role: data.role,
      termsAcceptedAt: now,
      ...(data.language && { language: data.language }),
      // A renter's optional phone is kept; consent only exists for owners.
      ...(phone && { phone }),
      ...(owner && { whatsappShareConsent: true, consentAt: now }),
    };
  }

  async function createAccount(profile: GoogleProfile, data: SignupData) {
    const existing = await repo.findByGoogleId(profile.sub);
    if (existing?.deletedAt) throw unauthorized();
    // Already registered (double submit, or signed up elsewhere): just log in, change nothing.
    if (existing) return loggedIn(existing, false);

    const fields = validateSignup(data, clock());
    const user = await repo.createFromGoogle({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      ...fields,
    });
    if (!user || user.deletedAt) throw unauthorized();
    return loggedIn(user, true);
  }

  async function readSignupToken(token: string | undefined): Promise<GoogleProfile> {
    if (!token) throw unauthorized('auth.signupTokenInvalid');
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
        currentDate: clock(),
      });
      const { purpose, gsub, email, name, picture } = payload as Record<string, unknown>;
      if (purpose !== SIGNUP_PURPOSE || typeof gsub !== 'string' || typeof email !== 'string') {
        throw new Error('not a signup token');
      }
      return {
        sub: gsub,
        email,
        name: typeof name === 'string' ? name : email,
        ...(typeof picture === 'string' && { picture }),
      };
    } catch {
      throw unauthorized('auth.signupTokenInvalid');
    }
  }

  return {
    // signin: log in an existing account; an unknown one is NOT created, the caller gets a
    //   short-lived signed token to finish signup instead.
    // signup: create the account from the verified profile + the allowed signupData.
    async googleAuth(idToken: string, intent: Intent, signupData?: SignupData) {
      const profile = await verifiedProfile(idToken);
      if (intent === 'signup') {
        if (!signupData) throw new AppError(400, 'auth.signupDataRequired');
        return createAccount(profile, signupData);
      }
      const existing = await repo.findByGoogleId(profile.sub);
      if (existing?.deletedAt) throw unauthorized();
      if (existing) return loggedIn(existing, false);
      // No `sub` claim: a signup token can never be used as a session token.
      const signupToken = await new SignJWT({
        purpose: SIGNUP_PURPOSE,
        gsub: profile.sub,
        email: profile.email,
        name: profile.name,
        ...(profile.picture && { picture: profile.picture }),
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(seconds())
        .setExpirationTime(seconds() + SIGNUP_TOKEN_TTL_SECONDS)
        .sign(key);
      return {
        status: 'NEW_USER' as const,
        signupToken,
        profile: { name: profile.name, avatarUrl: profile.picture },
      };
    },
    // Only name and avatar, for prefilling "Create your account". Never the email or Google id.
    async pendingSignup(signupToken: string | undefined) {
      const { name, picture } = await readSignupToken(signupToken);
      return { name, avatarUrl: picture };
    },
    async completeSignup(signupToken: string | undefined, data: SignupData) {
      return createAccount(await readSignupToken(signupToken), data);
    },
    // Returns the user id for a valid session token whose user still exists and is not deleted.
    async authenticate(token: string | undefined) {
      if (!token) throw unauthorized();
      let sub: string | undefined;
      try {
        ({
          payload: { sub },
        } = await jwtVerify(token, key, { algorithms: ['HS256'] }));
      } catch {
        throw unauthorized();
      }
      const user = sub ? await repo.findById(sub) : null;
      if (!user) throw unauthorized();
      return String(user._id);
    },
  };
}
export type AuthService = ReturnType<typeof createAuthService>;
