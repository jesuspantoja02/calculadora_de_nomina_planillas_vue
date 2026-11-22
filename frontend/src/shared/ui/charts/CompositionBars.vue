<script setup lang="ts">
import { computed } from 'vue';

interface BarraComposicion {
  id: string;
  etiqueta: string;
  valor: number;
  color: string;
  formato: (n: number) => string;
}

const props = defineProps<{
  barras: BarraComposicion[];
  maximo?: number;
}>();

const max = computed(() => props.maximo ?? Math.max(...props.barras.map((b) => b.valor), 1));
</script>

<template>
  <div class="chart-composition" role="img" aria-label="Composición de montos">
    <div v-for="b in barras" :key="b.id" class="chart-composition__row">
      <div class="chart-composition__meta">
        <span class="chart-composition__label">{{ b.etiqueta }}</span>
        <span class="chart-composition__value fig-tabular money">{{ b.formato(b.valor) }}</span>
      </div>
      <div class="chart-composition__track">
        <div
          class="chart-composition__fill"
          :style="{ width: `${Math.min(100, (b.valor / max) * 100)}%`, background: b.color }"
        />
      </div>
    </div>
  </div>
</template>
