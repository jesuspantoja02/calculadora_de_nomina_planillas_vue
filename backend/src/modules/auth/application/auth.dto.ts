import { z } from 'zod';
import { fotoUrlCampo } from '../../../shared/validation/foto-url.ts';
import { passwordCampo } from './usuario.dto.ts';

export const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'El usuario es obligatorio.').max(64),
  password: z.string().min(1, 'La contraseña es obligatoria.').max(128),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Indica tu contraseña actual.'),
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
