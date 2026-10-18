import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireOwner } from '../../middleware/requireRole';
import { gearRepository } from '../gear/gear.repository';
import { rentalsRepository } from '../rentals/rentals.repository';
import { usersRepository } from '../users/users.repository';
import { createDashboardController } from './dashboard.controller';
import { createDashboardService } from './dashboard.service';

const controller = createDashboardController(
  createDashboardService({ rentals: rentalsRepository, gear: gearRepository, users: usersRepository }),
);

export const dashboardRouter = Router();
dashboardRouter.get('/owner', requireAuth, requireOwner, controller.owner);
dashboardRouter.get('/renter', requireAuth, controller.renter);
