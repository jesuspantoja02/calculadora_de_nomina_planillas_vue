<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatoMoneda } from '../../../../shared/formatters';
import EntradaInput from '../../../../shared/ui/EntradaInput.vue';
import { claseValidacion } from '../../../../shared/validators/formularios';
import type { Empleado } from '../../../empleados/domain/empleado.model';
import type { Modalidad, PagoDto } from '../../domain/pago.model';

const hoy = (): string => new Date().toISOString().slice(0, 10);

defineProps<{
  empleados: Empleado[];
  guardando: boolean;
}>();

const emit = defineEmits<{
  previsualizar: [dto: PagoDto | null];
  emitir: [dto: PagoDto];
  'limpiar-ref': [fn: () => void];
}>();

const form = ref({
  empleadoId: '',
  fechaPago: hoy(),
  modalidad: 'Mensual' as Modalidad,
  horasExtra25: '0',
  horasExtra35: '0',
  horasDescanso: '0',
  minutosTardanza: '0',
  diasFalta: '0',
  mesesComputables: '6',
  diasComputables: '0',
  afiliadoEps: false,
});
const touched = ref(false);

function dto(): PagoDto | null {
  if (!form.value.empleadoId) return null;
  const nums = {
    horasExtra25: Number(form.value.horasExtra25),
    horasExtra35: Number(form.value.horasExtra35),
    horasDescanso: Number(form.value.horasDescanso),
    minutosTardanza: Number(form.value.minutosTardanza),
    diasFalta: Number(form.value.diasFalta),
    mesesComputables: Number(form.value.mesesComputables),
    diasComputables: Number(form.value.diasComputables),
  };
  const ok = Object.values(nums).every((n) => Number.isFinite(n) && n >= 0);
  if (!ok || !form.value.fechaPago) return null;
  return {
    empleadoId: form.value.empleadoId,
    fechaPago: form.value.fechaPago,
    modalidad: form.value.modalidad,
    ...nums,
    afiliadoEps: form.value.afiliadoEps,
  };
}

const valid = computed(() => dto() !== null);

watch(
  form,
  (_, __, onCleanup) => {
    const id = window.setTimeout(() => emit('previsualizar', valid.value ? dto() : null), 300);
    onCleanup(() => window.clearTimeout(id));
  },
  { deep: true },
);

function limpiar() {
  form.value = {
    empleadoId: '',
    fechaPago: hoy(),
    modalidad: 'Mensual',
    horasExtra25: '0',
    horasExtra35: '0',
    horasDescanso: '0',
    minutosTardanza: '0',
    diasFalta: '0',
    mesesComputables: '6',
    diasComputables: '0',
    afiliadoEps: false,
  };
  touched.value = false;
}

emit('limpiar-ref', limpiar);

function enviar(e: Event) {
  e.preventDefault();
  touched.value = true;
  const d = dto();
  if (d) emit('emitir', d);
}
</script>

<template>
  <form class="panel" novalidate @submit="enviar">
    <div class="panel-head">
      <h2 class="panel-title">Datos del pago</h2>
    </div>

    <div class="mb-3">
      <label class="form-label" for="empleadoId">Empleado</label>
      <select
        id="empleadoId"
        v-model="form.empleadoId"
        class="form-select"
        :class="claseValidacion(!!form.empleadoId, !form.empleadoId, touched, touched)"
      >
        <option value="">Selecciona un empleado…</option>
        <option v-for="e in empleados" :key="e.id" :value="e.id">
          {{ e.nombre }} — {{ formatoMoneda(e.sueldoBase) }}
        </option>
      </select>
      <div v-if="empleados.length === 0" class="form-text">
        Primero registra empleados en la sección «Empleados».
      </div>
    </div>

    <div class="row">
      <div class="col-sm-6 mb-3">
        <label class="form-label" for="fechaPago">Fecha de pago</label>
        <input id="fechaPago" v-model="form.fechaPago" type="date" class="form-control" />
      </div>
      <div class="col-sm-6 mb-3">
        <label class="form-label" for="modalidad">Modalidad</label>
        <select id="modalidad" v-model="form.modalidad" class="form-select">
          <option value="Mensual">Fin de mes</option>
          <option value="Quincena">Adelanto quincenal</option>
          <option value="Gratificacion">Gratificación (julio / diciembre)</option>
          <option value="CTS">CTS (mayo / noviembre)</option>
        </select>
      </div>
    </div>

    <template v-if="form.modalidad === 'Mensual'">
      <div class="row">
        <div class="col-sm-4 mb-3">
          <label class="form-label" for="horasExtra25">Horas extra al 25 %</label>
          <EntradaInput
            id="horasExtra25"
            v-model="form.horasExtra25"
            tipo="decimal"
            :limites="{ max: 200, decimales: 2 }"
            class="form-control"
            input-mode="decimal"
            auto-complete="off"
          />
        </div>
        <div class="col-sm-4 mb-3">
          <label class="form-label" for="horasExtra35">Horas extra al 35 %</label>
          <EntradaInput
            id="horasExtra35"
            v-model="form.horasExtra35"
            tipo="decimal"
            :limites="{ max: 200, decimales: 2 }"
            class="form-control"
            input-mode="decimal"
            auto-complete="off"
          />
        </div>
        <div class="col-sm-4 mb-3">
          <label class="form-label" for="horasDescanso">Horas en descanso o feriado</label>
          <EntradaInput
            id="horasDescanso"
            v-model="form.horasDescanso"
            tipo="decimal"
            :limites="{ max: 200, decimales: 2 }"
            class="form-control"
            input-mode="decimal"
            auto-complete="off"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-sm-6 mb-3">
          <label class="form-label" for="minutosTardanza">Minutos de tardanza</label>
          <EntradaInput
            id="minutosTardanza"
            v-model="form.minutosTardanza"
            tipo="entero"
            :limites="{ max: 20_000 }"
            class="form-control"
            input-mode="numeric"
            auto-complete="off"
          />
        </div>
        <div class="col-sm-6 mb-3">
          <label class="form-label" for="diasFalta">Días de falta</label>
          <EntradaInput
            id="diasFalta"
            v-model="form.diasFalta"
            tipo="entero"
            :limites="{ max: 31 }"
            class="form-control"
            input-mode="numeric"
            auto-complete="off"
          />
        </div>
      </div>
      <p class="form-text">
        La hora vale sueldo ordinario / 240. Las dos primeras horas del día van al 25 % y desde la tercera al 35 %. El
        descanso o feriado sin sustitutorio lleva sobretasa del 100 %. Tardanzas y faltas se descuentan por minuto y por
        treintavo.
      </p>
    </template>

    <template v-else-if="form.modalidad === 'Gratificacion'">
      <div class="row">
        <div class="col-sm-6 mb-3">
          <label class="form-label" for="mesesComputables">Meses completos del semestre (0 a 6)</label>
          <EntradaInput
            id="mesesComputables"
            v-model="form.mesesComputables"
            tipo="entero"
            :limites="{ max: 6 }"
            class="form-control"
            input-mode="numeric"
            auto-complete="off"
          />
        </div>
        <div class="col-sm-6 mb-3 d-flex align-items-end">
          <div class="form-check mb-2">
            <input id="afiliadoEps" v-model="form.afiliadoEps" type="checkbox" class="form-check-input" />
            <label class="form-check-label" for="afiliadoEps">Afiliado a una EPS</label>
          </div>
        </div>
      </div>
      <p class="form-text">
        Ley 27735: un sueldo computable por semestre, proporcional a los meses. La bonificación es 9 %, o 6,75 % si está
        en EPS. No tiene descuento de AFP ni ONP.
      </p>
    </template>

    <template v-else-if="form.modalidad === 'CTS'">
      <div class="row">
        <div class="col-sm-6 mb-3">
          <label class="form-label" for="mesesCts">Meses completos del semestre (0 a 6)</label>
          <EntradaInput
            id="mesesCts"
            v-model="form.mesesComputables"
            tipo="entero"
            :limites="{ max: 6 }"
            class="form-control"
            input-mode="numeric"
            auto-complete="off"
          />
        </div>
        <div class="col-sm-6 mb-3">
          <label class="form-label" for="diasComputables">Días del mes incompleto (0 a 30)</label>
          <EntradaInput
            id="diasComputables"
            v-model="form.diasComputables"
            tipo="entero"
            :limites="{ max: 30 }"
            class="form-control"
            input-mode="numeric"
            auto-complete="off"
          />
        </div>
      </div>
      <p class="form-text">
        Depósito de mayo (noviembre–abril) o noviembre (mayo–octubre). La remuneración computable suma un sexto de la
        gratificación del semestre. No se descuenta pensión.
      </p>
    </template>

    <p v-else-if="form.modalidad === 'Quincena'" class="form-text">
      Adelanto según el porcentaje de la empresa (Configuración). La ley no fija ese porcentaje y este pago no lleva
      descuentos: se regularizan a fin de mes.
    </p>

    <div class="d-flex gap-2 mt-2">
      <button type="submit" class="btn btn-primary" :disabled="!valid || guardando">Procesar y emitir boleta</button>
      <button type="button" class="btn btn-outline-secondary" @click="limpiar">Nuevo pago</button>
    </div>
  </form>
</template>
