import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { parseIdParam } from '../../controllers/params';

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}
const req = (params: object) => ({ params }) as unknown as Request;

describe('parseIdParam', () => {
  it('renvoie l’id si c’est un uuid valide', () => {
    const res = mockRes();
    const id = '3f1c2b9e-8a4d-4c1e-9b2a-1d2e3f4a5b6c';
    expect(parseIdParam(req({ id }), res)).toBe(id);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ['une chaîne quelconque', { id: 'abc' }],
    ['une tentative d’injection', { id: "1' OR '1'='1" }],
    ['un id absent', {}],
  ])('renvoie null et envoie 400 pour %s', (_label, params) => {
    const res = mockRes();
    expect(parseIdParam(req(params), res)).toBeNull();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid id' });
  });
});
