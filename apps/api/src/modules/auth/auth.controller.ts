import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import { SIGNUP_TOKEN_TTL_SECONDS, type GoogleLoginInput, type SignupData } from '@gearquest/shared';
import { env } from '../../config/env';
import { unauthorized } from '../../lib/errors';
import type { createUsersService } from '../users/users.service';
import { SESSION_TTL_SECONDS, type AuthService } from './auth.service';

export const AUTH_COOKIE = 'gs_session';
export const SIGNUP_COOKIE = 'gs_signup';

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

const signupCookie = (req: Request) =>
  (req.cookies as Record<string, string> | undefined)?.[SIGNUP_COOKIE];

const startSession = (res: Response, token: string) => {
  res.clearCookie(SIGNUP_COOKIE, cookieOptions);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS * 1000 });
};

export function createAuthController(
  auth: AuthService,
  users: Pick<ReturnType<typeof createUsersService>, 'getMe'>,
) {
  const google: RequestHandler = async (req, res) => {
    const { idToken, intent, signupData } = req.body as GoogleLoginInput;
    const result = await auth.googleAuth(idToken, intent, signupData);
    if (result.status === 'NEW_USER') {
      res.cookie(SIGNUP_COOKIE, result.signupToken, {
        ...cookieOptions,
        maxAge: SIGNUP_TOKEN_TTL_SECONDS * 1000,
      });
      // The token stays in the httpOnly cookie; the body only says what happens next.
      res.json({ status: result.status, profile: result.profile });
      return;
    }
    const { token, ...body } = result;
    startSession(res, token);
    res.json(body);
  };
  const pendingSignup: RequestHandler = async (req, res) => {
    res.json(await auth.pendingSignup(signupCookie(req)));
  };
  const completeSignup: RequestHandler = async (req, res) => {
    const result = await auth.completeSignup(signupCookie(req), req.body as SignupData);
    const { token, ...body } = result;
    startSession(res, token);
    res.status(result.isNew ? 201 : 200).json(body);
  };
  const me: RequestHandler = async (req, res) => {
    res.json(await users.getMe(userId(req)));
  };
  const logout: RequestHandler = (_req, res) => {
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    res.status(204).end();
  };
  return { google, pendingSignup, completeSignup, me, logout };
}
