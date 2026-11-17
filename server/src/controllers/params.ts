import { Request, Response } from 'express';
import { IdParamSchema } from '../models/commonModel';

/** Valide req.params.id (uuid). Renvoie l'id, ou envoie un 400 et renvoie null. */
export function parseIdParam(req: Request, res: Response): string | null {
  const parsed = IdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid id' });
    return null;
  }
  return parsed.data.id;
}
