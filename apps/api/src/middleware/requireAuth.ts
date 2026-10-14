import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/errors';

// TODO(prompt-3): TEMPORARY STUB. Replace the body with real auth (Google ID token -> our JWT in an
// httpOnly cookie). Keep the name and the `req.user = { id }` contract so routes don't change.
// Dev only: the caller passes an existing user's id in the `x-dev-user-id` header.
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (process.env.NODE_ENV === 'production') throw unauthorized();
  const id = req.header('x-dev-user-id');
  if (!id || !/^[a-f\d]{24}$/i.test(id)) throw unauthorized();
  req.user = { id };
  next();
};
