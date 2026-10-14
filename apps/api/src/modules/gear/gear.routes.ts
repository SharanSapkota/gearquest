import { Router } from 'express';
import { createGearSchema, gearFiltersSchema, updateGearSchema } from '@gearshare/shared';
import { requireAuth } from '../../middleware/requireAuth';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createGearController } from './gear.controller';
import { gearRepository } from './gear.repository';
import { createGearService } from './gear.service';

const controller = createGearController(createGearService(gearRepository));

export const gearRouter = Router();
gearRouter.get('/', validateQuery(gearFiltersSchema), controller.list);
gearRouter.get('/:id', controller.get);
gearRouter.post('/', requireAuth, validateBody(createGearSchema), controller.create);
gearRouter.patch('/:id', requireAuth, validateBody(updateGearSchema), controller.update);
gearRouter.delete('/:id', requireAuth, controller.remove);
