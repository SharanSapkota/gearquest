import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { usersRepository } from '../users/users.repository';
import { createAuthService, type GoogleVerifier } from './auth.service';

const googleClient = new OAuth2Client();

const verifyGoogle: GoogleVerifier = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  return ticket.getPayload();
};

export const authService = createAuthService(usersRepository, verifyGoogle, env.JWT_SECRET);
