import type { Request, RequestHandler } from 'express';
import type {
  AvailabilityQuery,
  CreateRentalInput,
  ListMyRentalsQuery,
} from '@gearquest/shared';
import { unauthorized } from '../../lib/errors';
import type { createRentalsService } from './rentals.service';

type RentalsService = ReturnType<typeof createRentalsService>;

const userId = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user.id;
};

export function createRentalsController(service: RentalsService) {
  const create: RequestHandler = async (req, res) => {
    res.status(201).json(await service.create(userId(req), req.body as CreateRentalInput));
  };
  const get: RequestHandler = async (req, res) => {
    res.json(await service.get(userId(req), String(req.params.id)));
  };
  const listMine: RequestHandler = async (req, res) => {
    res.json(await service.listMine(userId(req), res.locals.query as ListMyRentalsQuery));
  };
  const accept: RequestHandler = async (req, res) => {
    res.json(await service.accept(userId(req), String(req.params.id)));
  };
  const decline: RequestHandler = async (req, res) => {
    res.json(await service.decline(userId(req), String(req.params.id)));
  };
  const cancel: RequestHandler = async (req, res) => {
    res.json(await service.cancel(userId(req), String(req.params.id)));
  };
  const complete: RequestHandler = async (req, res) => {
    res.json(await service.complete(userId(req), String(req.params.id)));
  };
  const availability: RequestHandler = async (req, res) => {
    res.json(await service.availability(String(req.params.id), res.locals.query as AvailabilityQuery));
  };
  return { create, get, listMine, accept, decline, cancel, complete, availability };
}
