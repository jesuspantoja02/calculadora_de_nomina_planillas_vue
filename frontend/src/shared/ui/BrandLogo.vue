<script setup lang="ts">
import { SISTEMA_LOGO_URL, SISTEMA_NOMBRE, SISTEMA_SUBTITULO } from '../../config/systemBranding';

withDefaults(
  defineProps<{
    size?: number;
    variant?: 'mark' | 'lockup';
    className?: string;
  }>(),
  { size: 36, variant: 'mark', className: '' },
);
</script>

<template>
  <span
    v-if="variant === 'mark'"
    class="brand-logo brand-logo--mark"
    role="img"
    aria-label="Planilla Nómina Perú"
  >
    <img
      class="brand-logo__mark"
      :class="className || undefined"
      :src="SISTEMA_LOGO_URL"
      alt=""
      :width="size"
      :height="size"
      :style="{ width: size + 'px', height: size + 'px' }"
      aria-hidden="true"
    />
  </span>
  <span v-else class="brand-logo brand-logo--lockup" :class="className || undefined">
    <img
      class="brand-logo__mark"
      :src="SISTEMA_LOGO_URL"
      alt=""
      :width="size"
      :height="size"
      :style="{ width: size + 'px', height: size + 'px' }"
      aria-hidden="true"
    />
    <span class="brand-logo__text">
      <span class="brand-logo__name">{{ SISTEMA_NOMBRE }}</span>
      <span class="brand-logo__sub">{{ SISTEMA_SUBTITULO }}</span>
    </span>
  </span>
</template>
