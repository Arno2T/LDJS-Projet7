import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type LogService = typeof import('../../services/logService');

const fetchMock = vi.fn();

// The module keeps a per-page counter: load a fresh copy for each test
async function loadService(): Promise<LogService> {
  vi.resetModules();
  return import('../../services/logService');
}

function sentBody(call = 0): Record<string, unknown> {
  const init = fetchMock.mock.calls[call][1] as RequestInit;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  window.history.pushState({}, '', '/contacts/42/edit?email=jane@example.com#notes');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reportError', () => {
  it('envoie l’erreur en POST JSON vers /api/logs avec keepalive', async () => {
    const { reportError } = await loadService();

    reportError(new TypeError('boom'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/logs$/);
    expect(init).toMatchObject({ method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' } });
    expect(sentBody()).toMatchObject({ level: 'error', message: 'boom', path: '/contacts/42/edit' });
    expect(sentBody().stack).toContain('boom');
  });

  it('n’envoie que le chemin, jamais la query string ni le hash (données personnelles)', async () => {
    const { reportError } = await loadService();

    reportError(new Error('boom'));

    expect(JSON.stringify(sentBody())).not.toContain('jane@example.com');
    expect(JSON.stringify(sentBody())).not.toContain('#notes');
  });

  it('accepte une valeur qui n’est pas une Error et un message vide', async () => {
    const { reportError } = await loadService();

    reportError('plain string', 'warn');
    reportError(new Error('   '));

    expect(sentBody(0)).toMatchObject({ level: 'warn', message: 'plain string' });
    expect(sentBody(1)).toMatchObject({ message: 'Unknown error' });
  });

  it('tronque le message et la stack aux bornes du schéma serveur', async () => {
    const { reportError } = await loadService();
    const error = new Error('x'.repeat(2000));
    error.stack = 'y'.repeat(9000);

    reportError(error);

    expect(sentBody().message as string).toHaveLength(1000);
    expect(sentBody().stack as string).toHaveLength(5000);
  });

  it('plafonne le nombre d’envois par page (boucle de crash)', async () => {
    const { reportError, MAX_REPORTS_PER_PAGE } = await loadService();

    for (let i = 0; i < MAX_REPORTS_PER_PAGE + 5; i++) reportError(new Error(`error ${i}`));

    expect(fetchMock).toHaveBeenCalledTimes(MAX_REPORTS_PER_PAGE);
  });

  it('ne lève jamais d’erreur si l’API est injoignable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { reportError } = await loadService();

    expect(() => reportError(new Error('boom'))).not.toThrow();
    // Let the rejected fetch settle: Vitest fails the run on any unhandled rejection
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('installGlobalErrorHandlers', () => {
  it('remonte les erreurs non gérées et les promesses rejetées', async () => {
    const { installGlobalErrorHandlers } = await loadService();
    const target = new EventTarget() as unknown as Window;
    installGlobalErrorHandlers(target);

    target.dispatchEvent(new ErrorEvent('error', { error: new Error('handler crashed'), message: 'handler crashed' }));
    const rejection = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(rejection, 'reason', { value: new Error('promise rejected') });
    target.dispatchEvent(rejection);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentBody(0)).toMatchObject({ message: 'handler crashed' });
    expect(sentBody(1)).toMatchObject({ message: 'promise rejected' });
  });
});
