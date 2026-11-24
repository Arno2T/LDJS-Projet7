const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// A crash loop must not flood the API (which answers 429 anyway after 30 logs/min)
export const MAX_REPORTS_PER_PAGE = 10;

export type ClientLogLevel = 'error' | 'warn' | 'info';

let reportsSent = 0;

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

// Sends a browser error to POST /api/logs, where pino writes it and ELK collects it
export function reportError(value: unknown, level: ClientLogLevel = 'error'): void {
  if (reportsSent >= MAX_REPORTS_PER_PAGE) return;
  reportsSent += 1;

  const error = toError(value);
  const body = {
    level,
    // Same bounds as the server schema: an oversized log would be rejected (400)
    message: (error.message.trim() || 'Unknown error').slice(0, 1000),
    stack: error.stack?.slice(0, 5000),
    // Path only: query strings and hashes may hold personal data
    path: window.location.pathname.slice(0, 500),
  };

  // keepalive: the request still goes out if the page is closing.
  // Failures are swallowed: reporting an error must never throw a new one (loop)
  fetch(`${API_BASE_URL}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

// Errors React does not see: event handlers, timers, rejected promises
export function installGlobalErrorHandlers(target: Window = window): void {
  target.addEventListener('error', (event) => reportError(event.error ?? event.message));
  target.addEventListener('unhandledrejection', (event) => reportError(event.reason));
}
