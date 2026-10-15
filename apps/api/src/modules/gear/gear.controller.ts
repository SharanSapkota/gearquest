import type { Request, RequestHandler } from 'express';
import type { CreateGearInput, GearFilters, UpdateGearInput } from '@gearshare/shared';
import { unauthorized } from '../../lib/errors';
import type { createGearService } from './gear.service';

type GearService = ReturnType<typeof createGearService>;

// requireAuth guarantees req.user; this narrows the type without a non-null assertion.
const userId = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user.id;
};

export function createGearController(service: GearService) {
  const list: RequestHandler = async (_req, res) => {
    res.json(await service.list(res.locals.query as GearFilters));
  };
  const listMine: RequestHandler = async (req, res) => {
    res.json(await service.listMine(userId(req)));
  };
  const get: RequestHandler = async (req, res) => {
    res.json(await service.get(String(req.params.id)));
  };
  const create: RequestHandler = async (req, res) => {
    res.status(201).json(await service.create(userId(req), req.body as CreateGearInput));
  };
  const update: RequestHandler = async (req, res) => {
    res.json(await service.update(userId(req), String(req.params.id), req.body as UpdateGearInput));
  };
  const remove: RequestHandler = async (req, res) => {
    await service.remove(userId(req), String(req.params.id));
    res.status(204).end();
  };
  return { list, listMine, get, create, update, remove };
}
