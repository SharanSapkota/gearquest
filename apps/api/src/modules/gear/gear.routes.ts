import { Router } from 'express';
import { gearFiltersSchema } from '@gearshare/shared';
import { validateQuery } from '../../middleware/validate';
import { createGearController } from './gear.controller';
import { gearRepository } from './gear.repository';
import { createGearService } from './gear.service';

const controller = createGearController(createGearService(gearRepository));

export const gearRouter = Router();
gearRouter.get('/', validateQuery(gearFiltersSchema), controller.list);
gearRouter.get('/:id', controller.get);
