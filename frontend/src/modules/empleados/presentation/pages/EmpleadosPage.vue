<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useConfirm } from '../../../../core/confirm/useConfirm';
import { useToast } from '../../../../core/notifications/useToast';
import { exportarEmpleadosCsv, exportarEmpleadosExcel } from '../../../../shared/export/empleadosExport';
import Icon from '../../../../shared/ui/Icon.vue';
import PageHeader from '../../../../shared/ui/PageHeader.vue';
import EmpleadoFiltros from '../components/EmpleadoFiltros.vue';
import EmpleadoForm from '../components/EmpleadoForm.vue';
import EmpleadoLista from '../components/EmpleadoLista.vue';
import { pensionInicialDesdeUrl } from '../pensionFiltro';
import type { Empleado, EmpleadoDto } from '../../domain/empleado.model';
import { useEmpleadosStore } from '../composables/useEmpleadosStore';

const { items, cargando, guardando, editando, editandoId, filtrar, editar, guardar, eliminar } = useEmpleadosStore();
const { confirmar } = useConfirm();
const toast = useToast();
const route = useRoute();
const limpiarForm = ref<(() => void) | null>(null);
const exportando = ref<'csv' | 'excel' | null>(null);
const sinEmpleados = computed(() => items.value.length === 0);

async function onExportarCsv() {
  if (exportando.value || sinEmpleados.value) return;
  exportando.value = 'csv';
  try {
    await exportarEmpleadosCsv(items.value);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'No se pudo exportar el CSV.');
  } finally {
    exportando.value = null;
  }
}

async function onExportarExcel() {
  if (exportando.value || sinEmpleados.value) return;
  exportando.value = 'excel';
  try {
    await exportarEmpleadosExcel(items.value);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'No se pudo exportar el Excel.');
  } finally {
    exportando.value = null;
  }
}

const pensionInicial = computed(() =>
  pensionInicialDesdeUrl(
    typeof route.query.regimen === 'string' ? route.query.regimen : null,
    typeof route.query.afp === 'string' ? route.query.afp : null,
  ),
);

async function onGuardar(dto: EmpleadoDto) {
  const ok = await guardar(dto);
  if (ok) limpiarForm.value?.();
}

async function onEliminar(e: Empleado) {
  const ok = await confirmar({
    titulo: 'Eliminar empleado',
    mensaje: `¿Deseas eliminar a ${e.nombre} de la planilla?`,
    detalle: 'Las boletas ya emitidas se conservan en el historial.',
    confirmarTexto: 'Eliminar',
    cancelarTexto: 'Cancelar',
    variante: 'peligro',
  });
  if (ok) void eliminar(e);
}
</script>

<template>
  <PageHeader titulo="Empleados" descripcion="Alta de personal y lista de trabajadores registrados.">
    <template #acciones>
      <div class="export-actions">
        <button
          type="button"
          class="btn btn-outline-secondary btn-export d-inline-flex align-items-center gap-2"
          :disabled="sinEmpleados || cargando || exportando !== null"
          title="Descargar lista filtrada en CSV"
          @click="onExportarCsv"
        >
          <Icon nombre="download" :tamano="16" />
          {{ exportando === 'csv' ? 'Exportando…' : 'CSV' }}
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-export d-inline-flex align-items-center gap-2"
          :disabled="sinEmpleados || cargando || exportando !== null"
          title="Descargar lista filtrada en Excel"
          @click="onExportarExcel"
        >
          <Icon nombre="file-spreadsheet" :tamano="16" />
          {{ exportando === 'excel' ? 'Exportando…' : 'Excel' }}
        </button>
        <a class="btn btn-primary" href="#alta-empleado">Nuevo empleado</a>
      </div>
    </template>
  </PageHeader>

  <div class="row g-4">
    <section class="col-xl-5" id="alta-empleado">
      <EmpleadoForm
        :empleado="editando"
        :guardando="guardando"
        @guardar="onGuardar"
        @cancelar="editar(null)"
        @limpiar-ref="(fn) => (limpiarForm = fn)"
      />
    </section>

    <section class="col-xl-7">
      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">
            Empleados registrados <span class="count">{{ items.length }}</span>
          </h2>
        </div>
        <EmpleadoFiltros :pension-inicial="pensionInicial" @cambio="filtrar" />
        <EmpleadoLista
          :items="items"
          :cargando="cargando"
          :editando-id="editandoId"
          @editar="editar"
          @eliminar="onEliminar"
        />
      </div>
    </section>
  </div>
</template>
