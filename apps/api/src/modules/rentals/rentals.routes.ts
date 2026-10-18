import { Router } from 'express';
import { availabilityQuerySchema, createRentalSchema, listMyRentalsSchema } from '@gearshare/shared';
import { createRentalLimiter } from '../../middleware/rateLimit';
import { requireAuth } from '../../middleware/requireAuth';
import { requireOwner } from '../../middleware/requireRole';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createRentalsController } from './rentals.controller';
import { rentalsService } from './rentals.instance';

const controller = createRentalsController(rentalsService);

export const rentalsRouter = Router();
rentalsRouter.post('/', requireAuth, createRentalLimiter, validateBody(createRentalSchema), controller.create);
// Before '/:id' so "mine" is not captured as an id.
rentalsRouter.get('/mine', requireAuth, validateQuery(listMyRentalsSchema), controller.listMine);
rentalsRouter.get('/:id', requireAuth, controller.get);
rentalsRouter.patch('/:id/accept', requireAuth, requireOwner, controller.accept);
rentalsRouter.patch('/:id/decline', requireAuth, requireOwner, controller.decline);
rentalsRouter.patch('/:id/cancel', requireAuth, controller.cancel);
rentalsRouter.patch('/:id/complete', requireAuth, controller.complete);

// Mounted under /api/v1/gear: GET /gear/:id/availability (public).
export const gearAvailabilityRouter = Router();
gearAvailabilityRouter.get('/:id/availability', validateQuery(availabilityQuerySchema), controller.availability);
