<script setup lang="ts">
import { useToast } from './useToast';

const { toasts, cerrar } = useToast();
</script>

<template>
  <div class="toast-stack no-print" aria-live="polite">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast-item"
      :class="t.tipo === 'ok' ? 'ok' : 'error'"
      role="status"
    >
      <span>{{ t.texto }}</span>
      <button type="button" aria-label="Cerrar aviso" @click="cerrar(t.id)">✕</button>
    </div>
  </div>
</template>
