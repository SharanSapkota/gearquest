import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { AppError } from '../lib/errors';

// Per signed-in user (falls back to IP). Mount after requireAuth.
export const createRentalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  handler: (_req, _res, next) => next(new AppError(429, 'errors.rateLimited')),
});
