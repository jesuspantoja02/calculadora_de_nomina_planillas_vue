<script setup lang="ts">
import { computed } from 'vue';

interface SegmentoDonut {
  id: string;
  etiqueta: string;
  valor: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    segmentos: SegmentoDonut[];
    centro?: { titulo: string; subtitulo?: string };
    tamano?: number;
  }>(),
  { tamano: 176 },
);

const total = computed(() => props.segmentos.reduce((s, x) => s + Math.max(0, x.valor), 0));
const radio = 40;
const circ = 2 * Math.PI * radio;
/** Hueco entre segmentos para lectura tipo dashboard SaaS */
const gapPx = 3.2;

const arcos = computed(() => {
  if (total.value <= 0) {
    return [{ id: 'empty', dash: circ, gap: 0, color: 'var(--raised)', offset: 0 }];
  }
  const n = props.segmentos.filter((s) => s.valor > 0).length;
  const gapTotal = n > 1 ? n * gapPx : 0;
  const usable = Math.max(circ - gapTotal, 1);
  let offset = 0;
  return props.segmentos.map((seg) => {
    if (seg.valor <= 0) {
      return { id: seg.id, dash: 0, gap: circ, color: seg.color, offset: 0 };
    }
    const frac = seg.valor / total.value;
    const dash = Math.max(frac * usable, 0.01);
    const arc = { id: seg.id, dash, gap: circ - dash, color: seg.color, offset };
    offset -= dash + (n > 1 ? gapPx : 0);
    return arc;
  });
});
</script>

<template>
  <div class="chart-donut" :style="{ maxWidth: tamano + 'px' }">
    <div class="chart-donut__figure">
      <svg viewBox="0 0 100 100" class="chart-donut__svg" role="img" aria-label="Gráfico circular">
        <circle cx="50" cy="50" :r="radio" class="chart-donut__ring" />
        <circle
          v-for="a in arcos"
          :key="a.id"
          cx="50"
          cy="50"
          :r="radio"
          class="chart-donut__segment"
          :stroke="a.color"
          :stroke-dasharray="`${a.dash} ${a.gap}`"
          :stroke-dashoffset="a.offset"
        />
      </svg>
      <div v-if="centro" class="chart-donut__center">
        <span class="chart-donut__center-title">{{ centro.titulo }}</span>
        <span v-if="centro.subtitulo" class="chart-donut__center-sub">{{ centro.subtitulo }}</span>
      </div>
    </div>
    <ul class="chart-donut__legend">
      <li v-for="s in segmentos" :key="s.id">
        <span class="chart-donut__swatch" :style="{ background: s.color }" />
        <span class="chart-donut__legend-label">{{ s.etiqueta }}</span>
        <span class="chart-donut__legend-count fig-tabular">{{ s.valor }}</span>
        <span class="chart-donut__legend-value fig-tabular">
          {{ total > 0 ? `${Math.round((s.valor / total) * 100)}%` : '—' }}
        </span>
      </li>
    </ul>
  </div>
</template>
