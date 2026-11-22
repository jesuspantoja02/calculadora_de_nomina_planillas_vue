import { computed, inject, provide, ref, watch, type ComputedRef, type InjectionKey } from 'vue';
import { ApiError } from '../../shared/infrastructure/http/apiClient';
import { loginApi } from './authApi';
import { borrarSesion, guardarSesion, leerSesion, registrarLectorToken, type RolUsuario, type SesionGuardada } from './authStorage';

export const USUARIO_ADMIN_INICIAL = 'jesus.pantoja';

export interface AuthState {
  isAuthenticated: ComputedRef<boolean>;
  userId: ComputedRef<string | null>;
  userEmail: ComputedRef<string | null>;
  rol: ComputedRef<RolUsuario | null>;
  fotoUrl: ComputedRef<string>;
  login: (usuario: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
  actualizarFotoLocal: (fotoUrl: string) => void;
}

const AUTH_KEY: InjectionKey<AuthState> = Symbol('auth');

export function provideAuth(): AuthState {
  const sesion = ref<SesionGuardada | null>(leerSesion());

  watch(
    sesion,
    (s) => {
      registrarLectorToken(() => s?.token ?? null);
    },
    { immediate: true },
  );

  async function login(usuario: string, password: string) {
    try {
      const data = await loginApi(usuario.trim(), password);
      const guardada: SesionGuardada = {
        token: data.token,
        id: data.id,
        usuario: data.usuario,
        rol: data.rol,
        // Mantener foto en memoria; sessionStorage solo guarda si es pequeña.
        fotoUrl: data.fotoUrl ?? '',
      };
      try {
        guardarSesion(guardada);
      } catch {
        guardarSesion({ ...guardada, fotoUrl: '' });
      }
      sesion.value = guardada;
      return { ok: true as const };
    } catch (error) {
      if (error instanceof ApiError) {
        return { ok: false as const, message: error.message };
      }
      return { ok: false as const, message: 'No se pudo conectar con el servidor. ¿Está encendido el backend?' };
    }
  }

  function logout() {
    borrarSesion();
    sesion.value = null;
  }

  function actualizarFotoLocal(fotoUrl: string) {
    if (!sesion.value) return;
    const siguiente = { ...sesion.value, fotoUrl };
    guardarSesion(siguiente);
    sesion.value = siguiente;
  }

  const state: AuthState = {
    isAuthenticated: computed(() => sesion.value != null),
    userId: computed(() => sesion.value?.id ?? null),
    userEmail: computed(() => sesion.value?.usuario ?? null),
    rol: computed(() => sesion.value?.rol ?? null),
    fotoUrl: computed(() => sesion.value?.fotoUrl ?? ''),
    login,
    logout,
    actualizarFotoLocal,
  };

  provide(AUTH_KEY, state);
  return state;
}

export function useAuth(): AuthState {
  const ctx = inject(AUTH_KEY);
  if (!ctx) throw new Error('useAuth debe usarse dentro de provideAuth');
  return ctx;
}
