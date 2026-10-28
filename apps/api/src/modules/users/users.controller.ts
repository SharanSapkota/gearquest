import type { Request, RequestHandler } from 'express';
import type { UpdateProfileInput, UpgradeRoleInput } from '@gearquest/shared';
import { unauthorized } from '../../lib/errors';
import type { createUsersService } from './users.service';

type UsersService = ReturnType<typeof createUsersService>;

const userId = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user.id;
};

export function createUsersController(service: UsersService) {
  const get: RequestHandler = async (req, res) => {
    res.json(await service.getPublicProfile(String(req.params.id)));
  };
  const updateMe: RequestHandler = async (req, res) => {
    res.json(await service.updateMe(userId(req), req.body as UpdateProfileInput));
  };
  const upgradeRole: RequestHandler = async (req, res) => {
    res.json(await service.upgradeRole(userId(req), req.body as UpgradeRoleInput));
  };
  const deleteMe: RequestHandler = async () => {
    await service.deleteMe();
  };
  return { get, updateMe, upgradeRole, deleteMe };
}
