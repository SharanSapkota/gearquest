import { Router } from 'express';
import { updateProfileSchema, upgradeRoleSchema } from '@gearquest/shared';
import { requireAuth } from '../../middleware/requireAuth';
import { validateBody } from '../../middleware/validate';
import { gearRepository } from '../gear/gear.repository';
import { rentalsRepository } from '../rentals/rentals.repository';
import { createUsersController } from './users.controller';
import { usersRepository } from './users.repository';
import { createUsersService } from './users.service';

const controller = createUsersController(createUsersService(usersRepository, gearRepository, rentalsRepository));

export const usersRouter = Router();
// /me routes first so ":id" does not capture "me".
usersRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), controller.updateMe);
usersRouter.patch('/me/role', requireAuth, validateBody(upgradeRoleSchema), controller.upgradeRole);
usersRouter.delete('/me', requireAuth, controller.deleteMe);
usersRouter.get('/:id', controller.get);
