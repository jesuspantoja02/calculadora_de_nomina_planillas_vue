import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';

export interface Toast {
  id: number;
  tipo: 'ok' | 'error';
  texto: string;
}

export interface ToastState {
  toasts: Ref<Toast[]>;
  exito: (texto: string) => void;
  error: (texto: string) => void;
  cerrar: (id: number) => void;
}

const TOAST_KEY: InjectionKey<ToastState> = Symbol('toast');

export function provideToast(): ToastState {
  const toasts = ref<Toast[]>([]);
  let siguienteId = 0;

  function cerrar(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function agregar(tipo: Toast['tipo'], texto: string) {
    const id = ++siguienteId;
    toasts.value = [...toasts.value, { id, tipo, texto }];
    window.setTimeout(() => cerrar(id), 5000);
  }

  const state: ToastState = {
    toasts,
    exito: (texto) => agregar('ok', texto),
    error: (texto) => agregar('error', texto),
    cerrar,
  };

  provide(TOAST_KEY, state);
  return state;
}

export function useToast(): ToastState {
  const ctx = inject(TOAST_KEY);
  if (!ctx) throw new Error('useToast debe usarse dentro de provideToast');
  return ctx;
}
