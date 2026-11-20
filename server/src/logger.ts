import pino, { LoggerOptions } from 'pino';

// Shared options, exported so the tests can build the same logger on a capture stream
export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  base: { service: 'orion-server' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    // "level":"error" instead of "level":50: more readable in Kibana
    level: (label) => ({ level: label }),
  },
};

// JSON on stdout: the app does not know about ELK, Docker ships the logs (12-factor)
export const logger = pino(loggerOptions);
