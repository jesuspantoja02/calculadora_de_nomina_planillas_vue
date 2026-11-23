import { Router } from 'express';
import type { AuthService } from '../application/auth.service.ts';
import { requiereAuth } from '../../../shared/http/requiere-auth.ts';
import { crearAuthController } from './auth.controller.ts';

export function crearAuthRouter(servicio: AuthService) {
  const router = Router();
  const c = crearAuthController(servicio);
  router.post('/login', c.login);
  router.post('/inspeccionar-cuenta', c.inspeccionarCuenta);
  router.get('/recuperacion-admin', c.recuperacionAdmin);
  router.post('/recuperacion-admin', c.recuperarClaveAdmin);
  router.get('/me', requiereAuth(servicio), c.yo);
  // PUT es el contrato actual; PATCH se mantiene por compatibilidad con clientes antiguos.
  router.put('/me', requiereAuth(servicio), c.actualizarPerfil);
  router.patch('/me', requiereAuth(servicio), c.actualizarPerfil);
  router.post('/cambiar-password', requiereAuth(servicio), c.cambiarPassword);
  return router;
}
