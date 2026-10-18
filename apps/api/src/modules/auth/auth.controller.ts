import type { CookieOptions, Request, RequestHandler } from 'express';
import type { GoogleLoginInput } from '@gearshare/shared';
import { env } from '../../config/env';
import { unauthorized } from '../../lib/errors';
import type { createUsersService } from '../users/users.service';
import { SESSION_TTL_SECONDS, type AuthService } from './auth.service';

export const AUTH_COOKIE = 'gs_session';

// secure everywhere except local development (browsers reject Secure cookies on http://localhost
// in some cases, e.g. Safari).
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV !== 'development',
  sameSite: 'lax',
  path: '/',
};

const userId = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user.id;
};

export function createAuthController(
  auth: AuthService,
  users: Pick<ReturnType<typeof createUsersService>, 'getMe'>,
) {
  const google: RequestHandler = async (req, res) => {
    const { idToken, acceptTerms } = req.body as GoogleLoginInput;
    const { token, user, isNew } = await auth.loginWithGoogle(idToken, acceptTerms);
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS * 1000 });
    res.json({ user, isNew });
  };
  const me: RequestHandler = async (req, res) => {
    res.json(await users.getMe(userId(req)));
  };
  const logout: RequestHandler = (_req, res) => {
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.status(204).end();
  };
  return { google, me, logout };
}
