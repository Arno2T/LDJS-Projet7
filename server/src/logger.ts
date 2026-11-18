import pino from 'pino';

// JSON on stdout: the app does not know about ELK, Docker ships the logs (12-factor)
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  base: { service: 'orion-server' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    // "level":"error" instead of "level":50: more readable in Kibana
    level: (label) => ({ level: label }),
  },
});
