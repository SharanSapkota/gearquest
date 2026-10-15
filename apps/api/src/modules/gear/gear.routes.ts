import { Router } from 'express';
import { createGearSchema, gearFiltersSchema, updateGearSchema } from '@gearshare/shared';
import { requireAuth } from '../../middleware/requireAuth';
import { validateBody, validateQuery } from '../../middleware/validate';
import { env } from '../../config/env';
import { createGearController } from './gear.controller';
import { gearRepository } from './gear.repository';
import { createGearService } from './gear.service';

const controller = createGearController(createGearService(gearRepository, Math.random, env.CLOUDINARY_CLOUD_NAME));

export const gearRouter = Router();
gearRouter.get('/', validateQuery(gearFiltersSchema), controller.list);
// Before '/:id' so "mine" is not captured as an id.
gearRouter.get('/mine', requireAuth, controller.listMine);
gearRouter.get('/:id', controller.get);
gearRouter.post('/', requireAuth, validateBody(createGearSchema), controller.create);
gearRouter.patch('/:id', requireAuth, validateBody(updateGearSchema), controller.update);
gearRouter.delete('/:id', requireAuth, controller.remove);
