import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';

export type ConfirmVariante = 'peligro' | 'aviso' | 'neutro';

export interface ConfirmOptions {
  titulo: string;
  mensaje: string;
  detalle?: string;
  confirmarTexto?: string;
  cancelarTexto?: string;
  variante?: ConfirmVariante;
}

export interface ConfirmRequest extends Required<Omit<ConfirmOptions, 'detalle'>> {
  detalle?: string;
  resolve: (ok: boolean) => void;
}

export interface ConfirmState {
  actual: Ref<ConfirmRequest | null>;
  confirmar: (options: ConfirmOptions) => Promise<boolean>;
  responder: (ok: boolean) => void;
}

const CONFIRM_KEY: InjectionKey<ConfirmState> = Symbol('confirm');

const DEFAULTS = {
  confirmarTexto: 'Confirmar',
  cancelarTexto: 'Cancelar',
  variante: 'peligro' as ConfirmVariante,
};

export function provideConfirm(): ConfirmState {
  const actual = ref<ConfirmRequest | null>(null);

  function responder(ok: boolean) {
    const req = actual.value;
    if (!req) return;
    actual.value = null;
    req.resolve(ok);
  }

  function confirmar(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (actual.value) {
        actual.value.resolve(false);
      }
      actual.value = {
        titulo: options.titulo,
        mensaje: options.mensaje,
        detalle: options.detalle,
        confirmarTexto: options.confirmarTexto ?? DEFAULTS.confirmarTexto,
        cancelarTexto: options.cancelarTexto ?? DEFAULTS.cancelarTexto,
        variante: options.variante ?? DEFAULTS.variante,
        resolve,
      };
    });
  }

  const state: ConfirmState = { actual, confirmar, responder };
  provide(CONFIRM_KEY, state);
  return state;
}

export function useConfirm(): ConfirmState {
  const ctx = inject(CONFIRM_KEY);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de provideConfirm');
  return ctx;
}
