import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../../middleware/requireAuth';
import { cloudinaryProvider } from './uploads.instance';
import { createUploadsController } from './uploads.controller';
import { createUploadsService } from './uploads.service';

const controller = createUploadsController(createUploadsService(cloudinaryProvider));

// Up to 6 photos per gear, with headroom for retries and re-picks.
const signLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'errors.rateLimited' },
});

export const uploadsRouter = Router();
uploadsRouter.post('/sign', requireAuth, signLimiter, controller.sign);
