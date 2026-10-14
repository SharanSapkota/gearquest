import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { gearRouter } from './modules/gear/gear.routes';

export function createApp(webOrigin: string) {
  const app = express();
  app.use(cors({ origin: webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/v1/gear', gearRouter);

  app.use(errorHandler);
  return app;
}
