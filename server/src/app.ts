import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { rateLimit } from 'express-rate-limit';
import { logger as defaultLogger } from './logger';
import organizationRoutes from './routes/organizationRoutes';
import contactRoutes from './routes/contactRoutes';
import { logController } from './controllers/logController';

// POST /api/logs is public: max requests per minute and per IP, then 429
export const LOGS_RATE_LIMIT = 30;

// Builds the Express app without listening: index.ts starts it, the tests call it directly
export function createApp(logger: Logger = defaultLogger): Application {
  const app = express();
  // Behind nginx (Docker): trust one proxy so req.ip is the browser IP, not nginx (rate limit)
  app.set('trust proxy', 1);

  // First middleware, so every request is logged (404 included)
  app.use(
    pinoHttp({
      logger,
      // The Docker healthcheck calls /api/health every 30 s: noise
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (req, res, err) => {
        // An accepted browser log is already written by the controller: no second line
        if (req.url === '/api/logs' && res.statusCode === 204) return 'silent';
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      // No headers (cookies, tokens) in the logs (OWASP A09)
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' }));
  app.use(express.json());

  // Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Orion CRM API is running' });
  });

  app.use('/api/organizations', organizationRoutes);
  app.use('/api/contacts', contactRoutes);
  app.post(
    '/api/logs',
    rateLimit({ windowMs: 60_000, limit: LOGS_RATE_LIMIT, standardHeaders: 'draft-8', legacyHeaders: false }),
    logController.create,
  );

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler
  app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? 500;
    // pino-http picks up res.err and logs a single "request errored" line with the stack
    if (status === 500) res.err = err;
    res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
  });

  return app;
}
