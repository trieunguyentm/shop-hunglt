import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp(): Application {
  const app = express();

  // Bảo mật & tiện ích cơ bản
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan('dev'));

  // Rate limit cho toàn bộ API
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Routes
  app.use('/api', apiRoutes);

  // 404 + error handler (đặt cuối)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
