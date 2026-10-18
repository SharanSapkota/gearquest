import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/errors';
import { assertOwnerRole } from '../modules/users/users.policy';
import { usersRepository, type UsersRepository } from '../modules/users/users.repository';

// Runs after requireAuth. The role check itself lives in the users policy; this only loads the
// caller (the role is never read from the token or the client).
export const createRequireOwner =
  (users: Pick<UsersRepository, 'findById'>): RequestHandler =>
  async (req, _res, next) => {
    if (!req.user) throw unauthorized();
    assertOwnerRole(await users.findById(req.user.id));
    next();
  };

export const requireOwner = createRequireOwner(usersRepository);
