import type { RequestHandler } from 'express';
import type { GearFilters } from '@gearshare/shared';
import type { createGearService } from './gear.service';

type GearService = ReturnType<typeof createGearService>;

export function createGearController(service: GearService) {
  const list: RequestHandler = async (_req, res) => {
    res.json(await service.list(res.locals.query as GearFilters));
  };
  const get: RequestHandler = async (req, res) => {
    res.json(await service.get(String(req.params.id)));
  };
  return { list, get };
}
