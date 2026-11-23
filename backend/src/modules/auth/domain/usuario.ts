import type { RolUsuario } from './roles.ts';

export type { RolUsuario };

export interface Usuario {
  id: string;
  usuario: string;
  passwordHash: string;
  rol: RolUsuario;
  /** Data URL de foto de perfil, o cadena vacía. */
  fotoUrl: string;
  creadoEn: string;
  intentosFallidos: number;
  /** ISO 8601; null si no hay bloqueo activo. */
  bloqueadoHasta: string | null;
  /** Si es false, la cuenta no puede iniciar sesión ni usar la API. */
  activo: boolean;
}

/** Intentos fallidos de login antes de bloquear la cuenta. */
export const MAX_INTENTOS_LOGIN = 3;
/** Duración del bloqueo automático tras agotar intentos. */
export const BLOQUEO_LOGIN_MS = 5 * 60 * 1000;
