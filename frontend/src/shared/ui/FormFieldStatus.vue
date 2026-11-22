<script setup lang="ts">
import Icon from './Icon.vue';

export type EstadoCampo = 'valid' | 'invalid' | 'idle';

defineProps<{
  estado: EstadoCampo;
  mostrar: boolean;
}>();
</script>

<template>
  <div class="form-field-status" :class="{ 'form-field-status--open': mostrar && estado !== 'idle' }">
    <div class="form-field-status__control">
      <slot />
    </div>
    <span
      v-if="mostrar && estado !== 'idle'"
      class="form-field-status__badge"
      :class="`form-field-status__badge--${estado}`"
      aria-hidden="true"
    >
      <Icon :nombre="estado === 'valid' ? 'check' : 'alert'" :tamano="18" />
    </span>
  </div>
</template>
