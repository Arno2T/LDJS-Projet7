import express, { Application, NextFunction, Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from './logger';
import cors from 'cors';
import dotenv from 'dotenv';
import organizationRoutes from './routes/organizationRoutes';
import contactRoutes from './routes/contactRoutes';

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 8080;

// Middleware
app.use(
  pinoHttp({
    logger,
    // The Docker healthcheck calls /api/health every 30 s: noise
    autoLogging: { ignore: (req) => req.url === '/api/health' },
    customLogLevel: (_req, res, err) => {
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
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Orion CRM API is running' });
});

app.use('/api/organizations', organizationRoutes);
app.use('/api/contacts', contactRoutes);

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

app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
});

export default app;
