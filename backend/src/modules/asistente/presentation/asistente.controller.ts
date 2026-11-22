import type { Request, Response } from 'express';
import type { AsistenteService } from '../application/asistente.service.ts';
import { chatAsistenteSchema } from '../application/asistente.dto.ts';

export function crearAsistenteController(servicio: AsistenteService) {
  return {
    estado: async (_req: Request, res: Response) => {
      res.json({ data: servicio.estado() });
    },
    chat: async (req: Request, res: Response) => {
      const body = chatAsistenteSchema.parse(req.body);
      const data = await servicio.chatear(req.auth!, body);
      res.json({ data });
    },
  };
}
