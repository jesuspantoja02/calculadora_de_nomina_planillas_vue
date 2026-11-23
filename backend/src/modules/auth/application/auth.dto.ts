import { z } from 'zod';
import { fotoUrlCampo } from '../../../shared/validation/foto-url.ts';
import { passwordCampo } from './usuario.dto.ts';

export const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'El usuario es obligatorio.').max(64),
  password: z.string().min(1, 'La contraseña es obligatoria.').max(128),
});

export const inspeccionarCuentaSchema = z.object({
  usuario: z.string().trim().min(1, 'El usuario es obligatorio.').max(64),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Indica tu contraseña actual.'),
  passwordNueva: passwordCampo,
});

export const recuperarClaveAdminSchema = z.object({
  usuario: z.string().trim().min(1, 'El usuario es obligatorio.').max(64),
  codigoRecuperacion: z
    .string()
    .min(1, 'El código de recuperación es obligatorio.')
    .max(256, 'El código es demasiado largo.'),
  passwordNueva: passwordCampo,
});

/** Acepta `fotoUrl` (actual) o `fotoPerfilUrl` (alias legado). */
export const actualizarPerfilSchema = z
  .object({
    fotoUrl: fotoUrlCampo.optional(),
    fotoPerfilUrl: fotoUrlCampo.optional(),
  })
  .transform((v) => ({
    fotoUrl: v.fotoUrl ?? v.fotoPerfilUrl ?? '',
  }))
  .pipe(z.object({ fotoUrl: fotoUrlCampo }));
