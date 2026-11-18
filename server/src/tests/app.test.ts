import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import pino from 'pino';
import { createApp } from '../app';
import { loggerOptions } from '../logger';

// Real routes need the database: replace them with a tiny router that can succeed or throw
vi.mock('../routes/organizationRoutes', async () => {
  const { Router } = await import('express');
  const router = Router();
  router.get('/', (_req, res) => {
    res.json([]);
  });
  router.post('/', (_req, res) => {
    res.status(201).json({});
  });
  router.get('/boom', () => {
    throw new Error('database exploded');
  });
  return { default: router };
});
vi.mock('../routes/contactRoutes', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});

type LogLine = Record<string, unknown> & { level: string; msg: string };

// Same options as production, but level "info" and lines captured in memory instead of stdout
const lines: LogLine[] = [];
const testLogger = pino(
  { ...loggerOptions, level: 'info' },
  { write: (line: string) => lines.push(JSON.parse(line) as LogLine) },
);

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createApp(testLogger).listen(0); // port 0 = random free port
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  lines.length = 0;
});

// pino-http writes its line on the response "finish" event: wait for it
async function requestLog(url: string): Promise<LogLine> {
  let line: LogLine | undefined;
  await vi.waitFor(() => {
    line = lines.find((l) => (l.req as { url?: string } | undefined)?.url === url);
    expect(line).toBeDefined();
  });
  return line as LogLine;
}

describe('createApp', () => {
  it('GET /api/health renvoie 200 et n’est pas loggé (bruit du healthcheck)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'OK', message: 'Orion CRM API is running' });
    // A logged request in between proves the health request really was skipped
    await fetch(`${baseUrl}/api/organizations`);
    await requestLog('/api/organizations');
    expect(lines.some((l) => (l.req as { url?: string } | undefined)?.url === '/api/health')).toBe(false);
  });

  it('logge une requête réussie en info avec méthode, statut et temps de réponse', async () => {
    const res = await fetch(`${baseUrl}/api/organizations`);
    expect(res.status).toBe(200);

    const line = await requestLog('/api/organizations');
    expect(line).toMatchObject({
      level: 'info',
      service: 'orion-server',
      msg: 'request completed',
      req: { method: 'GET', url: '/api/organizations' },
      res: { statusCode: 200 },
    });
    expect(typeof line.responseTime).toBe('number');
    expect(typeof line.time).toBe('string'); // ISO timestamp
  });

  it('renvoie 404 sur une route inconnue et logge en warn', async () => {
    const res = await fetch(`${baseUrl}/api/nope`);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Route not found' });
    expect(await requestLog('/api/nope')).toMatchObject({ level: 'warn', res: { statusCode: 404 } });
  });

  it('renvoie 400 sur un JSON mal formé (middleware d’erreur) et logge en warn', async () => {
    const res = await fetch(`${baseUrl}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).not.toBe('Internal server error');
    expect(await requestLog('/api/organizations')).toMatchObject({ level: 'warn', res: { statusCode: 400 } });
  });

  it('renvoie 500 sans détail au client et logge l’erreur avec sa stack', async () => {
    const res = await fetch(`${baseUrl}/api/organizations/boom`);

    expect(res.status).toBe(500);
    // The internal message must not leak to the client
    expect(await res.json()).toEqual({ error: 'Internal server error' });

    const line = await requestLog('/api/organizations/boom');
    expect(line).toMatchObject({
      level: 'error',
      msg: 'request errored',
      res: { statusCode: 500 },
      err: { message: 'database exploded' },
    });
    expect((line.err as { stack?: string }).stack).toContain('database exploded');
  });

  it('ne logge jamais les en-têtes sensibles (OWASP A09)', async () => {
    await fetch(`${baseUrl}/api/organizations`, {
      headers: { Authorization: 'Bearer super-secret-token', Cookie: 'session=super-secret-cookie' },
    });

    const line = await requestLog('/api/organizations');
    expect(line.req).toEqual({ id: expect.anything(), method: 'GET', url: '/api/organizations' });
    expect(JSON.stringify(line)).not.toContain('super-secret');
  });
});
