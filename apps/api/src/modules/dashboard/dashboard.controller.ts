import type { Request, RequestHandler } from 'express';
import { unauthorized } from '../../lib/errors';
import type { DashboardService } from './dashboard.service';

const userId = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user.id;
};

export function createDashboardController(service: DashboardService) {
  const owner: RequestHandler = async (req, res) => {
    res.json(await service.owner(userId(req)));
  };
  const renter: RequestHandler = async (req, res) => {
    res.json(await service.renter(userId(req)));
  };
  return { owner, renter };
}
