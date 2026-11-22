<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { container } from '../../../../composition/container';
import { useToast } from '../../../../core/notifications/useToast';
import PageHeader from '../../../../shared/ui/PageHeader.vue';
import { useApiAction } from '../../../../shared/presentation/useApiAction';
import type { Empleado } from '../../../empleados/domain/empleado.model';
import Boleta from '../components/Boleta.vue';
import PagoForm from '../components/PagoForm.vue';
import type { Boleta as BoletaModel, PagoDto } from '../../domain/pago.model';

const toast = useToast();
const run = useApiAction();
const limpiarForm = ref<(() => void) | null>(null);

const empleados = ref<Empleado[]>([]);
const vistaPrevia = ref<BoletaModel | null>(null);
const emitida = ref<BoletaModel | null>(null);
const guardando = ref(false);
let simSeq = 0;

onMounted(() => {
  void container.empleados
    .listar()
    .then((lista) => {
      empleados.value = lista;
    })
    .catch(() => {
      empleados.value = [];
    });
});

function previsualizar(dto: PagoDto | null) {
  if (emitida.value) return;
  if (!dto) {
    vistaPrevia.value = null;
    return;
  }
  const seq = ++simSeq;
  void container.pagos
    .simular(dto)
    .then((b) => {
      if (seq === simSeq) vistaPrevia.value = b;
    })
    .catch(() => {
      if (seq === simSeq) vistaPrevia.value = null;
    });
}

async function emitir(dto: PagoDto) {
  guardando.value = true;
  const pago = await run(() => container.pagos.emitir(dto));
  guardando.value = false;
  if (pago) {
    emitida.value = pago;
    toast.exito(`Boleta emitida para ${pago.nombre}.`);
  }
}

function nuevoPago() {
  emitida.value = null;
  vistaPrevia.value = null;
  simSeq++;
  limpiarForm.value?.();
}
</script>

<template>
  <PageHeader
    titulo="Procesar pago"
    descripcion="Calcula y emite la boleta de un empleado. La vista previa se actualiza mientras completas el formulario."
  />

  <div class="row g-4">
    <section class="col-xl-5">
      <PagoForm
        :empleados="empleados"
        :guardando="guardando"
        @previsualizar="previsualizar"
        @emitir="emitir"
        @limpiar-ref="(fn) => (limpiarForm = fn)"
      />
    </section>

    <section class="col-xl-7">
      <template v-if="emitida">
        <div class="alert alert-success no-print d-flex justify-content-between align-items-center">
          <span>Boleta emitida y guardada en el historial.</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="nuevoPago">Nuevo pago</button>
        </div>
        <Boleta :boleta="emitida" />
      </template>
      <template v-else-if="vistaPrevia">
        <div class="alert alert-info no-print">Vista previa — aún no emitida.</div>
        <Boleta :boleta="vistaPrevia" :mostrar-imprimir="false" />
      </template>
      <div v-else class="panel empty">Selecciona un empleado para ver la boleta.</div>
    </section>
  </div>
</template>
