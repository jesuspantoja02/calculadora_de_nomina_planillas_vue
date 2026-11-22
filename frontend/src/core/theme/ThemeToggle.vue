<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTheme } from './useTheme';

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });

const { tema, alternarTema } = useTheme();
const btnRef = ref<HTMLButtonElement | null>(null);

const esOscuro = computed(() => tema.value === 'dark');
const etiqueta = computed(() => (esOscuro.value ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'));

function onClick() {
  const rect = btnRef.value?.getBoundingClientRect();
  const origen = rect
    ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  alternarTema(origen);
}
</script>

<template>
  <button
    ref="btnRef"
    type="button"
    class="theme-toggle"
    :class="{ 'theme-toggle--compact': compact }"
    @click="onClick"
    :aria-label="etiqueta"
    :title="etiqueta"
  >
    <span class="theme-toggle__track" aria-hidden="true">
      <span class="theme-toggle__thumb" :class="{ 'theme-toggle__thumb--dark': esOscuro }">
        <svg class="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        <svg class="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </span>
    <span v-if="!compact" class="theme-toggle__label">{{ esOscuro ? 'Modo claro' : 'Modo oscuro' }}</span>
  </button>
</template>
