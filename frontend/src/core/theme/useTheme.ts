import { inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue';
import { aplicarTemaDom, guardarTema, leerTema, type TemaApp } from './themeStorage';

export interface ThemeState {
  tema: Ref<TemaApp>;
  alternarTema: (origen?: { x: number; y: number }) => void;
}

const THEME_KEY: InjectionKey<ThemeState> = Symbol('theme');

function cambiarTemaConTransicion(siguiente: TemaApp, origen?: { x: number; y: number }) {
  const aplicar = () => {
    guardarTema(siguiente);
    aplicarTemaDom(siguiente);
  };

  const puedeVt =
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition ===
      'function';

  if (!puedeVt) {
    aplicar();
    return;
  }

  const root = document.documentElement;
  if (origen) {
    const maxX = Math.max(origen.x, window.innerWidth - origen.x);
    const maxY = Math.max(origen.y, window.innerHeight - origen.y);
    const r = Math.hypot(maxX, maxY);
    root.style.setProperty('--theme-switch-x', `${origen.x}px`);
    root.style.setProperty('--theme-switch-y', `${origen.y}px`);
    root.style.setProperty('--theme-switch-r', `${r}px`);
  }

  const doc = document as Document & { startViewTransition: (cb: () => void) => { finished: Promise<void> } };
  void doc
    .startViewTransition(() => {
      aplicar();
    })
    .finished.finally(() => {
      root.style.removeProperty('--theme-switch-x');
      root.style.removeProperty('--theme-switch-y');
      root.style.removeProperty('--theme-switch-r');
    });
}

export function provideTheme(): ThemeState {
  const tema = ref<TemaApp>(leerTema());

  watch(
    tema,
    (t) => {
      aplicarTemaDom(t);
    },
    { immediate: true },
  );

  function alternarTema(origen?: { x: number; y: number }) {
    const siguiente: TemaApp = tema.value === 'light' ? 'dark' : 'light';
    cambiarTemaConTransicion(siguiente, origen);
    tema.value = siguiente;
  }

  const state: ThemeState = { tema, alternarTema };
  provide(THEME_KEY, state);
  return state;
}

export function useTheme(): ThemeState {
  const ctx = inject(THEME_KEY);
  if (!ctx) throw new Error('useTheme debe usarse dentro de provideTheme');
  return ctx;
}
