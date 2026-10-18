import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { usersRepository } from '../users/users.repository';
import { createAuthService, type GoogleVerifier } from './auth.service';

const googleClient = new OAuth2Client();

// google-auth-library messages can embed the token payload (email etc.), so only a fixed
// reason is ever logged, never the error message or the token.
export function googleRejectionReason(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (/wrong recipient|audience/i.test(message)) {
    return 'audience mismatch: the token was issued for another client ID. GOOGLE_CLIENT_ID (api) and NEXT_PUBLIC_GOOGLE_CLIENT_ID (web) must be the same value.';
  }
  if (/too late|too early|expired/i.test(message)) {
    return 'token expired or not yet valid: check the system clock (clock skew) and retry.';
  }
  if (/signature|pem|certificate/i.test(message)) return 'invalid signature or Google certificates could not be fetched.';
  if (/issuer/i.test(message)) return 'wrong issuer: not a Google ID token.';
  return 'verification failed (malformed token?).';
}

const verifyGoogle: GoogleVerifier = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    return ticket.getPayload();
  } catch (err) {
    if (env.NODE_ENV === 'development') {
      console.warn(`[auth] Google ID token rejected: ${googleRejectionReason(err)}`);
    }
    throw err;
  }
};

export const authService = createAuthService(usersRepository, verifyGoogle, env.JWT_SECRET);
