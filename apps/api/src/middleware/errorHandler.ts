import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

// Responses carry error codes (i18n keys), never UI strings.
// Express identifies error handlers by arity, so _next must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.code });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'errors.validation', issues: err.issues });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'errors.internal' });
};
