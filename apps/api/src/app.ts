import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { gearAvailabilityRouter, rentalsRouter } from './modules/rentals/rentals.routes';
import { gearRouter } from './modules/gear/gear.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { usersRouter } from './modules/users/users.routes';

export function createApp(webOrigin: string) {
  const app = express();
  app.use(cors({ origin: webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/gear', gearAvailabilityRouter);
  app.use('/api/v1/gear', gearRouter);
  app.use('/api/v1/rentals', rentalsRouter);
  app.use('/api/v1/uploads', uploadsRouter);
  app.use('/api/v1/users', usersRouter);

  app.use(errorHandler);
  return app;
}
