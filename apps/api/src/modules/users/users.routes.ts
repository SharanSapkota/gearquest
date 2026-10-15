import { Router } from 'express';
import { updateProfileSchema } from '@gearshare/shared';
import { requireAuth } from '../../middleware/requireAuth';
import { validateBody } from '../../middleware/validate';
import { gearRepository } from '../gear/gear.repository';
import { createUsersController } from './users.controller';
import { usersRepository } from './users.repository';
import { createUsersService } from './users.service';

const controller = createUsersController(createUsersService(usersRepository, gearRepository));

export const usersRouter = Router();
// /me routes first so ":id" does not capture "me".
usersRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), controller.updateMe);
usersRouter.delete('/me', requireAuth, controller.deleteMe);
usersRouter.get('/:id', controller.get);
