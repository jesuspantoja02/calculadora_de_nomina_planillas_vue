import type { RolUsuario } from '../../../core/auth/roles';

export interface UsuarioCuenta {
  id: string;
  usuario: string;
  rol: RolUsuario;
  fotoUrl: string;
  creadoEn: string;
  intentosFallidos?: number;
  bloqueada?: boolean;
  bloqueadoHasta?: string | null;
  segundosRestantes?: number;
  activo?: boolean;
}

export interface UsuarioCuentaDto {
  usuario: string;
  password: string;
  rol: RolUsuario;
  fotoUrl?: string;
}

export interface ActualizarUsuarioDto {
  usuario?: string;
  password?: string;
  rol?: RolUsuario;
  fotoUrl?: string;
  activo?: boolean;
}
