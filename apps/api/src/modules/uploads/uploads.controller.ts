import type { RequestHandler } from 'express';
import type { createUploadsService } from './uploads.service';

type UploadsService = ReturnType<typeof createUploadsService>;

export function createUploadsController(service: UploadsService) {
  const sign: RequestHandler = (_req, res) => {
    res.json(service.sign());
  };
  return { sign };
}
