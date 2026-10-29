import type { RequestHandler } from 'express';
import { AUTH_COOKIE } from '../modules/auth/auth.controller';
import { authService } from '../modules/auth/auth.instance';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  req.user = { id: await authService.authenticate(token) };
  next();
};

// Identifies the caller when a valid session cookie is present; never rejects. For public
// routes whose response differs for the owner (e.g. a paused listing).
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  try {
    if (token) req.user = { id: await authService.authenticate(token) };
  } catch {
    // Invalid or expired session: treated as anonymous.
  }
  next();
};
