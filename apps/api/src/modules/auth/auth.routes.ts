import { Router } from 'express';
import { googleLoginSchema } from '@gearshare/shared';
import { requireAuth } from '../../middleware/requireAuth';
import { validateBody } from '../../middleware/validate';
import { gearRepository } from '../gear/gear.repository';
import { usersRepository } from '../users/users.repository';
import { createUsersService } from '../users/users.service';
import { authService } from './auth.instance';
import { createAuthController } from './auth.controller';

const controller = createAuthController(
  authService,
  createUsersService(usersRepository, gearRepository),
);

export const authRouter = Router();
authRouter.post('/google', validateBody(googleLoginSchema), controller.google);
authRouter.get('/me', requireAuth, controller.me);
authRouter.post('/logout', controller.logout);
