import { Router } from 'express';
import { requiereGestor } from '../../../shared/http/requiere-gestor.ts';
import type { ConfiguracionService } from '../application/configuracion.service.ts';
import { crearConfiguracionController } from './configuracion.controller.ts';

export function crearConfiguracionRouter(servicio: ConfiguracionService): Router {
  const c = crearConfiguracionController(servicio);
  const router = Router();
  // Lectura: cualquier usuario autenticado (planilla/dashboard la necesitan).
  router.get('/configuracion', c.obtener);
  // Escritura y borrado: solo admin, jefe o gerente.
  router.put('/configuracion', requiereGestor(), c.actualizar);
  router.delete('/datos', requiereGestor(), c.reiniciarDatos);
  return router;
}
