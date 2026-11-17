import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { contactController } from '../../controllers/contactController';
import { contactService } from '../../services/contactService';

vi.mock('../../services/contactService', () => ({
  contactService: {
    getAllContacts: vi.fn(),
    getContactById: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    getContactStats: vi.fn(),
  },
}));

const VALID_ID = '3f1c2b9e-8a4d-4c1e-9b2a-1d2e3f4a5b6c';
const NOT_FOUND = new Error('Contact not found');
const VALID_CONTACT = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' };

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}
const req = (params: object = {}, body: object = {}) => ({ params, body }) as unknown as Request;

describe('contactController', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('validation de l’id', () => {
    it.each(['getById', 'update', 'delete'] as const)('%s renvoie 400 et n’appelle pas le service si id invalide', async (method) => {
      const res = mockRes();
      await contactController[method](req({ id: 'pas-un-uuid' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid id' });
      expect(contactService.getContactById).not.toHaveBeenCalled();
      expect(contactService.updateContact).not.toHaveBeenCalled();
      expect(contactService.deleteContact).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('renvoie la liste des contacts', async () => {
      vi.mocked(contactService.getAllContacts).mockResolvedValue([{ id: VALID_ID }] as never);
      const res = mockRes();
      await contactController.getAll(req(), res);
      expect(res.json).toHaveBeenCalledWith([{ id: VALID_ID }]);
    });

    it('renvoie 500 si le service échoue', async () => {
      vi.mocked(contactService.getAllContacts).mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await contactController.getAll(req(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    it('renvoie le contact si id valide', async () => {
      vi.mocked(contactService.getContactById).mockResolvedValue({ id: VALID_ID } as never);
      const res = mockRes();
      await contactController.getById(req({ id: VALID_ID }), res);
      expect(contactService.getContactById).toHaveBeenCalledWith(VALID_ID);
      expect(res.json).toHaveBeenCalledWith({ id: VALID_ID });
    });

    it('renvoie 404 si introuvable', async () => {
      vi.mocked(contactService.getContactById).mockRejectedValue(NOT_FOUND);
      const res = mockRes();
      await contactController.getById(req({ id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Contact not found' });
    });

    it('renvoie 500 sur une autre erreur', async () => {
      vi.mocked(contactService.getContactById).mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await contactController.getById(req({ id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create', () => {
    it('renvoie 201 avec un body valide', async () => {
      vi.mocked(contactService.createContact).mockResolvedValue({ id: VALID_ID, ...VALID_CONTACT } as never);
      const res = mockRes();
      await contactController.create(req({}, VALID_CONTACT), res);
      expect(contactService.createContact).toHaveBeenCalledWith(VALID_CONTACT);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('renvoie 400 si l’email est invalide', async () => {
      const res = mockRes();
      await contactController.create(req({}, { ...VALID_CONTACT, email: 'pas-un-email' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(contactService.createContact).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('appelle le service avec l’id validé et le body', async () => {
      vi.mocked(contactService.updateContact).mockResolvedValue({ id: VALID_ID } as never);
      const res = mockRes();
      await contactController.update(req({ id: VALID_ID }, { firstName: 'Grace' }), res);
      expect(contactService.updateContact).toHaveBeenCalledWith(VALID_ID, { firstName: 'Grace' });
      expect(res.json).toHaveBeenCalledWith({ id: VALID_ID });
    });

    it('renvoie 400 si le body est invalide', async () => {
      const res = mockRes();
      await contactController.update(req({ id: VALID_ID }, { email: 'pas-un-email' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(contactService.updateContact).not.toHaveBeenCalled();
    });

    it('renvoie 404 si introuvable', async () => {
      vi.mocked(contactService.updateContact).mockRejectedValue(NOT_FOUND);
      const res = mockRes();
      await contactController.update(req({ id: VALID_ID }, {}), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('renvoie 204 si id valide', async () => {
      vi.mocked(contactService.deleteContact).mockResolvedValue();
      const res = mockRes();
      await contactController.delete(req({ id: VALID_ID }), res);
      expect(contactService.deleteContact).toHaveBeenCalledWith(VALID_ID);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('renvoie 404 si introuvable', async () => {
      vi.mocked(contactService.deleteContact).mockRejectedValue(NOT_FOUND);
      const res = mockRes();
      await contactController.delete(req({ id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('renvoie 500 sur une autre erreur', async () => {
      vi.mocked(contactService.deleteContact).mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await contactController.delete(req({ id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getStats', () => {
    it('renvoie les stats', async () => {
      vi.mocked(contactService.getContactStats).mockResolvedValue({ total: 3 });
      const res = mockRes();
      await contactController.getStats(req(), res);
      expect(res.json).toHaveBeenCalledWith({ total: 3 });
    });

    it('renvoie 500 si le service échoue', async () => {
      vi.mocked(contactService.getContactStats).mockRejectedValue(new Error('db down'));
      const res = mockRes();
      await contactController.getStats(req(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
