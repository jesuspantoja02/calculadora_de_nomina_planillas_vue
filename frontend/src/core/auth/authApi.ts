import { ApiError, apiGet, apiPost, apiPut, mensajeDeError } from '../../shared/infrastructure/http/apiClient';
import { environment } from '../../config/environment';
import { obtenerTokenAuth } from './authStorage';
import type { RolUsuario } from './roles';

export interface SesionApi {
  token: string;
  id: string;
  usuario: string;
  rol: RolUsuario;
  fotoUrl: string;
}

export interface PerfilApi {
  id: string;
  usuario: string;
  rol: RolUsuario;
  fotoUrl: string;
  creadoEn: string;
}

export interface EstadoCuentaLoginApi {
  usuario: string;
  maxIntentos: number;
  intentosFallidos: number;
  intentosRestantes: number;
  bloqueada: boolean;
  bloqueadoHasta: string | null;
  segundosRestantes: number;
  esAdmin: boolean;
  puedeRecuperarAdmin: boolean;
}

export async function loginApi(usuario: string, password: string): Promise<SesionApi> {
  return apiPost<SesionApi>('/auth/login', { usuario, password });
}

export async function inspeccionarCuentaApi(usuario: string): Promise<EstadoCuentaLoginApi> {
  return apiPost<EstadoCuentaLoginApi>('/auth/inspeccionar-cuenta', { usuario });
}

export async function fetchPerfilApi(): Promise<PerfilApi> {
  return apiGet<PerfilApi>('/auth/me');
}

export async function actualizarPerfilApi(fotoUrl: string): Promise<PerfilApi> {
  return apiPut<PerfilApi>('/auth/me', { fotoUrl });
}

export async function recuperacionAdminHabilitadaApi(): Promise<boolean> {
  const data = await apiGet<{ habilitado: boolean }>('/auth/recuperacion-admin');
  return data.habilitado;
}

export async function recuperarClaveAdminApi(
  usuario: string,
  codigoRecuperacion: string,
  passwordNueva: string,
): Promise<void> {
  const res = await fetch(`${environment.apiUrl}/auth/recuperacion-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, codigoRecuperacion, passwordNueva }),
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* vacío */
    }
    throw new ApiError(res.status, mensajeDeError(res.status, body));
  }
}

export async function cambiarPasswordApi(passwordActual: string, passwordNueva: string): Promise<void> {
  const token = obtenerTokenAuth();
  const res = await fetch(`${environment.apiUrl}/auth/cambiar-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ passwordActual, passwordNueva }),
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* vacío */
    }
    throw new ApiError(res.status, mensajeDeError(res.status, body));
  }
}
