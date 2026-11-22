<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useConfirm } from '../../../../core/confirm/useConfirm';
import { exportarBoletasPdf } from '../../../../shared/export/boletasPdf';
import { enmascararDni, formatoFecha, formatoMoneda, modalidadLabel } from '../../../../shared/formatters';
import { useDebouncedValue } from '../../../../shared/composables/useDebouncedValue';
import EntradaInput from '../../../../shared/ui/EntradaInput.vue';
import Icon from '../../../../shared/ui/Icon.vue';
import PageHeader from '../../../../shared/ui/PageHeader.vue';
import Boleta from '../components/Boleta.vue';
import type { Pago } from '../../domain/pago.model';
import { useBoletasStore } from '../composables/useBoletasStore';

const { items, seleccionada, filtrar, seleccionar, eliminar } = useBoletasStore();
const { confirmar } = useConfirm();
const fecha = ref('');
const q = ref('');
const estado = computed(() => ({ fecha: fecha.value, q: q.value }));
const debounced = useDebouncedValue(estado, 250);
const sinBoletas = computed(() => items.value.length === 0);

watch(
  debounced,
  (d) => {
    const f: { fecha?: string; q?: string } = {};
    if (d.fecha) f.fecha = d.fecha;
    if (d.q) f.q = d.q;
    filtrar(f);
  },
  { deep: true },
);

async function onEliminar(p: Pago) {
  const ok = await confirmar({
    titulo: 'Eliminar boleta',
    mensaje: `¿Deseas eliminar la boleta de ${p.nombre}?`,
    detalle: 'Esta acción no se puede deshacer. El registro saldrá del historial de pagos.',
    confirmarTexto: 'Eliminar',
    cancelarTexto: 'Cancelar',
    variante: 'peligro',
  });
  if (ok) void eliminar(p);
}
</script>

<template>
  <PageHeader titulo="Boletas de pago" descripcion="Historial de boletas emitidas. Filtra por fecha, nombre o DNI.">
    <template #acciones>
      <div class="export-actions">
        <button
          type="button"
          class="btn btn-outline-secondary btn-export d-inline-flex align-items-center gap-2"
          :disabled="!seleccionada"
          title="Descargar la boleta seleccionada en PDF"
          @click="seleccionada && exportarBoletasPdf([seleccionada])"
        >
          <Icon nombre="download" :tamano="16" /> PDF seleccionada
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-export d-inline-flex align-items-center gap-2"
          :disabled="sinBoletas"
          title="Descargar todas las boletas filtradas en un PDF"
          @click="exportarBoletasPdf(items)"
        >
          <Icon nombre="file" :tamano="16" /> PDF todas
        </button>
      </div>
    </template>
  </PageHeader>

  <form class="panel mb-4" @submit.prevent>
    <div class="row g-3 align-items-end">
      <div class="col-md-3">
        <label class="form-label" for="fecha">Fecha de pago</label>
        <input id="fecha" v-model="fecha" type="date" class="form-control" />
      </div>
      <div class="col-md-6">
        <label class="form-label" for="q">Nombre o DNI</label>
        <EntradaInput
          id="q"
          v-model="q"
          tipo="busqueda"
          class="form-control"
          :max-length="60"
          placeholder="Buscar…"
          auto-complete="off"
        />
      </div>
      <div class="col-md-3">
        <button
          type="button"
          class="btn btn-outline-secondary w-100"
          @click="
            fecha = '';
            q = '';
          "
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  </form>

  <div class="row g-4">
    <section class="col-xl-5">
      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">
            Boletas emitidas <span class="count">{{ items.length }}</span>
          </h2>
        </div>
        <p v-if="items.length === 0" class="empty">No hay boletas que coincidan con los filtros.</p>
        <div
          v-for="p in items"
          :key="p.id"
          class="row-item clickable"
          :class="{ selected: seleccionada?.id === p.id }"
          role="button"
          tabindex="0"
          @click="seleccionar(p)"
          @keydown.enter="seleccionar(p)"
        >
          <div class="flex-grow-1 min-w-0">
            <div class="fw-semibold text-truncate">{{ p.nombre }}</div>
            <small class="text-secondary">DNI {{ enmascararDni(p.dni) }} · {{ formatoFecha(p.fechaPago) }}</small>
          </div>
          <div class="text-end">
            <div class="fw-semibold">{{ formatoMoneda(p.neto) }}</div>
            <span class="badge text-bg-secondary">{{ modalidadLabel(p.modalidad) }}</span>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            :aria-label="`Eliminar boleta de ${p.nombre}`"
            @click.stop="onEliminar(p)"
          >
            <Icon nombre="trash" />
          </button>
        </div>
      </div>
    </section>

    <section class="col-xl-7">
      <Boleta v-if="seleccionada" :boleta="seleccionada" />
      <div v-else class="panel empty">Selecciona una boleta de la lista para verla.</div>
    </section>
  </div>
</template>
