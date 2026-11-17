import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { organizationController } from '../../controllers/organizationController'; 
import { organizationService } from '../../services/organizationService'; 

vi.mock('../../services/organizationService', () => ({
  organizationService: {
    getAllOrganizations: vi.fn(),
    getOrganizationById: vi.fn(),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
    getOrganizationStats: vi.fn(),
  },
}));


const VALID_ID = '3f1c2b9e-8a4d-4c1e-9b2a-1d2e3f4a5b6c';

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}
const req = (params: object, body: object = {}) => ({ params, body }) as unknown as Request;

describe('organizationController', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['getById', 'update', 'delete'] as const)('%s renvoie 400 si id invalide', async (method) => {
    const res = mockRes();
    await organizationController[method](req({ id: 'pas-un-uuid' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid id' });
  });

  it('getById renvoie l’organisation si id valide', async () => {
    vi.mocked(organizationService.getOrganizationById).mockResolvedValue({ id: VALID_ID } as never);
    const res = mockRes();
    await organizationController.getById(req({ id: VALID_ID }), res);
    expect(res.json).toHaveBeenCalledWith({ id: VALID_ID });
  });

  it('getById renvoie 404 si introuvable', async () => {
    vi.mocked(organizationService.getOrganizationById).mockRejectedValue(new Error('Organization not found'));
    const res = mockRes();
    await organizationController.getById(req({ id: VALID_ID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('update appelle le service avec l’id validé', async () => {
    vi.mocked(organizationService.updateOrganization).mockResolvedValue({ id: VALID_ID } as never);
    const res = mockRes();
    await organizationController.update(req({ id: VALID_ID }, {}), res);
    expect(organizationService.updateOrganization).toHaveBeenCalledWith(VALID_ID, expect.anything());
  });

  it('delete renvoie 204 si id valide', async () => {
    vi.mocked(organizationService.deleteOrganization).mockResolvedValue();
    const res = mockRes();
    await organizationController.delete(req({ id: VALID_ID }), res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('getAll renvoie la liste', async () => {
    vi.mocked(organizationService.getAllOrganizations).mockResolvedValue([{ id: VALID_ID }] as never);
    const res = mockRes();
    await organizationController.getAll(req({}), res);
    expect(res.json).toHaveBeenCalledWith([{ id: VALID_ID }]);
  });

  it('getAll renvoie 500 si le service échoue', async () => {
    vi.mocked(organizationService.getAllOrganizations).mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await organizationController.getAll(req({}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getById renvoie 500 sur une autre erreur', async () => {
    vi.mocked(organizationService.getOrganizationById).mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await organizationController.getById(req({ id: VALID_ID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('create renvoie 201 avec un body valide', async () => {
    vi.mocked(organizationService.createOrganization).mockResolvedValue({ id: VALID_ID, name: 'Orion' } as never);
    const res = mockRes();
    await organizationController.create(req({}, { name: 'Orion' }), res);
    expect(organizationService.createOrganization).toHaveBeenCalledWith({ name: 'Orion' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('create renvoie 400 si le nom est vide', async () => {
    const res = mockRes();
    await organizationController.create(req({}, { name: '' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(organizationService.createOrganization).not.toHaveBeenCalled();
  });

  it('update renvoie 400 si le body est invalide', async () => {
    const res = mockRes();
    await organizationController.update(req({ id: VALID_ID }, { website: 'pas-une-url' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(organizationService.updateOrganization).not.toHaveBeenCalled();
  });

  it('update renvoie 404 si introuvable', async () => {
    vi.mocked(organizationService.updateOrganization).mockRejectedValue(new Error('Organization not found'));
    const res = mockRes();
    await organizationController.update(req({ id: VALID_ID }, {}), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('delete renvoie 404 si introuvable', async () => {
    vi.mocked(organizationService.deleteOrganization).mockRejectedValue(new Error('Organization not found'));
    const res = mockRes();
    await organizationController.delete(req({ id: VALID_ID }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('delete renvoie 500 sur une autre erreur', async () => {
    vi.mocked(organizationService.deleteOrganization).mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await organizationController.delete(req({ id: VALID_ID }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getStats renvoie les stats', async () => {
    vi.mocked(organizationService.getOrganizationStats).mockResolvedValue({ total: 2 });
    const res = mockRes();
    await organizationController.getStats(req({}), res);
    expect(res.json).toHaveBeenCalledWith({ total: 2 });
  });

  it('getStats renvoie 500 si le service échoue', async () => {
    vi.mocked(organizationService.getOrganizationStats).mockRejectedValue(new Error('db down'));
    const res = mockRes();
    await organizationController.getStats(req({}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
