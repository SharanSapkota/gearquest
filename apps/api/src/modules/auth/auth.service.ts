import { jwtVerify, SignJWT } from 'jose';
import { unauthorized } from '../../lib/errors';
import { toPrivateUser } from '../users/users.mapper';
import type { UsersRepository } from '../users/users.repository';

type Repo = Pick<UsersRepository, 'findById' | 'upsertFromGoogle'>;

export type GoogleClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};
export type GoogleVerifier = (idToken: string) => Promise<GoogleClaims | undefined>;

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function createAuthService(repo: Repo, verifyGoogle: GoogleVerifier, jwtSecret: string) {
  const key = new TextEncoder().encode(jwtSecret);

  return {
    // Identity comes only from the claims Google signed, never from the client body.
    async loginWithGoogle(idToken: string) {
      const claims = await verifyGoogle(idToken).catch(() => undefined);
      if (!claims?.sub || !claims.email || !claims.email_verified) throw unauthorized();
      const user = await repo.upsertFromGoogle({
        googleId: claims.sub,
        email: claims.email,
        name: claims.name || claims.email,
        avatarUrl: claims.picture,
      });
      if (!user || user.deletedAt) throw unauthorized();
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(String(user._id))
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
        .sign(key);
      return { token, user: toPrivateUser(user) };
    },
    // Returns the user id for a valid token whose user still exists and is not deleted.
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
