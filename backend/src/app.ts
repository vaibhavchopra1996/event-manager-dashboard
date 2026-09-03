import cors from 'cors';
import express, { type Express } from 'express';
import morgan from 'morgan';
import { env } from './config/env';
import { pool } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { asyncHandler } from './utils/asyncHandler';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin.includes('*') ? true : env.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));
  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', uptime: process.uptime() });
    }),
  );

  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
