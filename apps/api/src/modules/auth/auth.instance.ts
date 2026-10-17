import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { usersRepository } from '../users/users.repository';
import { createAuthService, type GoogleVerifier } from './auth.service';

const googleClient = new OAuth2Client();

// Dev-only hint for why Google rejected an ID token. Logs a category, never the token.
export function describeGoogleError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (/audience|recipient/i.test(message)) {
    return 'audience mismatch: GOOGLE_CLIENT_ID (api) must equal NEXT_PUBLIC_GOOGLE_CLIENT_ID (web)';
  }
  if (/too late|too early|expired/i.test(message)) {
    return 'token expired or not yet valid: check the system clock (clock skew)';
  }
  if (/signature|certificate|pem/i.test(message)) return 'invalid token signature';
  if (/issuer/i.test(message)) return 'wrong token issuer';
  return 'token could not be verified';
}

const verifyGoogle: GoogleVerifier = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    return ticket.getPayload();
  } catch (err) {
    if (env.NODE_ENV !== 'production') {
      console.warn(`[auth] Google sign-in rejected: ${describeGoogleError(err)}`);
    }
    throw err;
  }
};

export const authService = createAuthService(usersRepository, verifyGoogle, env.JWT_SECRET);
