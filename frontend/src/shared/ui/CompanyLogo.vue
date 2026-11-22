<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    nombre: string;
    logoUrl?: string;
    size?: number;
    className?: string;
  }>(),
  { size: 96, className: '', logoUrl: '' },
);

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'E';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

const clase = computed(() => `company-logo${props.className ? ` ${props.className}` : ''}`);
const url = computed(() => props.logoUrl?.trim() || '');
</script>

<template>
  <img
    v-if="url"
    :class="clase"
    :src="url"
    :alt="nombre"
    :width="size"
    :height="size"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
  <div
    v-else
    :class="`${clase} company-logo--monogram`"
    :style="{ width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.34) + 'px' }"
    aria-hidden="true"
  >
    {{ iniciales(nombre) }}
  </div>
</template>
