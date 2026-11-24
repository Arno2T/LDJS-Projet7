import { z } from 'zod';

// Log sent by the browser to POST /api/logs. The endpoint is public:
// strict object (unknown keys rejected) and bounded sizes, so nobody can flood the logs
export const ClientLogSchema = z.strictObject({
  level: z.enum(['error', 'warn', 'info']),
  message: z.string().trim().min(1).max(1000),
  stack: z.string().max(5000).optional(),
  // Path only (no query string or hash): no personal data in the logs
  path: z.string().max(500).optional(),
});

export type ClientLog = z.infer<typeof ClientLogSchema>;
