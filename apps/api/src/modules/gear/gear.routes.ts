import { Router } from 'express';
import { createGearSchema, gearFiltersSchema, sitemapQuerySchema, updateGearSchema } from '@gearquest/shared';
import { requireAuth } from '../../middleware/requireAuth';
import { requireOwner } from '../../middleware/requireRole';
import { validateBody, validateQuery } from '../../middleware/validate';
import { env } from '../../config/env';
import { usersRepository } from '../users/users.repository';
import { createGearController } from './gear.controller';
import { gearRepository } from './gear.repository';
import { createGearService } from './gear.service';

const controller = createGearController(
  createGearService(gearRepository, usersRepository, Math.random, env.CLOUDINARY_CLOUD_NAME),
);

export const gearRouter = Router();
gearRouter.get('/', validateQuery(gearFiltersSchema), controller.list);
// Before '/:id' so "mine" and "sitemap" are not captured as ids.
gearRouter.get('/sitemap', validateQuery(sitemapQuerySchema), controller.sitemap);
gearRouter.get('/mine', requireAuth, requireOwner, controller.listMine);
gearRouter.get('/:id', controller.get);
gearRouter.post('/', requireAuth, requireOwner, validateBody(createGearSchema), controller.create);
gearRouter.patch('/:id', requireAuth, requireOwner, validateBody(updateGearSchema), controller.update);
gearRouter.delete('/:id', requireAuth, requireOwner, controller.remove);
