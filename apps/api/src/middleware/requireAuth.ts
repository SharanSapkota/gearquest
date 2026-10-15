import type { RequestHandler } from 'express';
import { AUTH_COOKIE } from '../modules/auth/auth.controller';
import { authService } from '../modules/auth/auth.instance';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  req.user = { id: await authService.authenticate(token) };
  next();
};
