import { Router } from 'express';
import type { AsistenteService } from '../application/asistente.service.ts';
import { crearAsistenteController } from './asistente.controller.ts';

export function crearAsistenteRouter(servicio: AsistenteService): Router {
  const c = crearAsistenteController(servicio);
  const router = Router();
  router.get('/estado', c.estado);
  router.post('/chat', c.chat);
  return router;
}
