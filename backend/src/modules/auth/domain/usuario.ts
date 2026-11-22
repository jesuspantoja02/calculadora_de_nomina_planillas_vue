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
}
