import { Request, Response } from 'express';
import { ClientLogSchema } from '../models/logModel';

export const logController = {
  // Writes a browser log through pino: it reaches ELK like any server log
  create(req: Request, res: Response): void {
    const parsed = ClientLogSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid log entry' });
      return;
    }

    const { level, message, stack, path } = parsed.data;
    // req.log is the pino-http child logger: the line carries the request id.
    // pino writes JSON, so a "\n" in the message cannot forge a fake log line
    req.log[level](
      {
        origin: 'browser',
        browser: { path, stack, userAgent: req.get('user-agent')?.slice(0, 300) },
      },
      message,
    );
    res.status(204).end();
  },
};
