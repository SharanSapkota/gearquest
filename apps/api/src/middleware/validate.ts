import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    res.locals.query = schema.parse(req.query);
    next();
  };

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
