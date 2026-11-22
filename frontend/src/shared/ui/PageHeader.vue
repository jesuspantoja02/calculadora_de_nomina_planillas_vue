<script setup lang="ts">
defineProps<{
  titulo: string;
  descripcion?: string;
}>();
</script>

<template>
  <header class="page-head">
    <div class="page-head-copy">
      <h1>{{ titulo }}</h1>
      <p v-if="descripcion" class="lede">{{ descripcion }}</p>
    </div>
    <div v-if="$slots.acciones" class="page-head-actions">
      <slot name="acciones" />
    </div>
  </header>
</template>
