<script setup lang="ts">
import {
  enmascararDni,
  formatoFecha,
  formatoMoneda,
  formatoPorcentaje,
  iniciales,
  modalidadLabel,
} from '../../../../shared/formatters';
import { etiquetaSistemaPensiones } from '../../../../shared/pensiones';
import { exportarBoletasPdf } from '../../../../shared/export/boletasPdf';
import Icon from '../../../../shared/ui/Icon.vue';
import type { Boleta as BoletaModel } from '../../domain/pago.model';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    boleta: BoletaModel;
    mostrarImprimir?: boolean;
  }>(),
  { mostrarImprimir: true },
);

const b = computed(() => props.boleta);
const pension = computed(() => etiquetaSistemaPensiones(b.value.regimen, b.value.afp));

function imprimir() {
  window.print();
}

function descargarPdf() {
  exportarBoletasPdf([b.value]);
}
</script>

<template>
  <div class="print-area">
    <article class="boleta panel">
      <div class="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom" style="border-color: var(--border)">
        <span class="brand-mark" aria-hidden="true">{{ iniciales(b.empresaNombre) }}</span>
        <div>
          <div class="fw-bold">{{ b.empresaNombre }}</div>
          <small class="text-secondary">RUC {{ b.empresaRuc }}</small>
        </div>
      </div>

      <span class="badge text-bg-warning mb-3">{{ modalidadLabel(b.modalidad) }} · {{ formatoFecha(b.fechaPago) }}</span>

      <p class="section-label">Empleado</p>
      <div class="linea"><span>Nombre</span><span>{{ b.nombre.toUpperCase() }}</span></div>
      <div class="linea"><span>DNI</span><span>{{ enmascararDni(b.dni) }}</span></div>
      <div class="linea"><span>Cargo</span><span>{{ b.cargo }}</span></div>
      <div class="linea"><span>Sistema de pensiones</span><span>{{ pension }}</span></div>

      <template v-if="b.modalidad === 'Quincena'">
        <p class="section-label">Adelanto quincenal</p>
        <div class="linea"><span>Sueldo básico</span><span>{{ formatoMoneda(b.sueldoBase) }}</span></div>
        <p class="small text-secondary mb-0">Sin descuentos de ley: se regulariza en el pago de fin de mes.</p>
      </template>

      <template v-else-if="b.modalidad === 'Gratificacion'">
        <p class="section-label">Ingresos</p>
        <div class="linea"><span>Sueldo básico</span><span>{{ formatoMoneda(b.sueldoBase) }}</span></div>
        <div v-if="b.asignacionFamiliar > 0" class="linea">
          <span>Asignación familiar</span><span>{{ formatoMoneda(b.asignacionFamiliar) }}</span>
        </div>
        <div class="linea">
          <span>Gratificación ({{ b.mesesComputables }} meses)</span>
          <span>{{ formatoMoneda(b.gratificacion) }}</span>
        </div>
        <div class="linea">
          <span>Bonificación extraordinaria</span>
          <span>{{ formatoMoneda(b.bonificacionExtraordinaria) }}</span>
        </div>
        <p class="small text-secondary mb-0">Exonerada de AFP y ONP. La bonificación no es renta de quinta categoría.</p>
      </template>

      <template v-else-if="b.modalidad === 'CTS'">
        <p class="section-label">Depósito</p>
        <div class="linea"><span>Sueldo básico</span><span>{{ formatoMoneda(b.sueldoBase) }}</span></div>
        <div v-if="b.asignacionFamiliar > 0" class="linea">
          <span>Asignación familiar</span><span>{{ formatoMoneda(b.asignacionFamiliar) }}</span>
        </div>
        <div class="linea"><span>Sexto de la gratificación</span><span>{{ formatoMoneda(b.gratificacion / 6) }}</span></div>
        <div class="linea">
          <span>Remuneración computable</span><span>{{ formatoMoneda(b.remuneracionComputable) }}</span>
        </div>
        <div class="linea">
          <span>Tiempo ({{ b.mesesComputables }} meses y {{ b.diasComputables }} días)</span>
          <span>{{ formatoMoneda(b.cts) }}</span>
        </div>
        <p class="small text-secondary mb-0">
          Se deposita en la cuenta CTS. No es un pago de sueldo ni tiene descuento de pensión.
        </p>
      </template>

      <template v-else-if="b.modalidad === 'Mensual'">
        <p class="section-label">Ingresos</p>
        <div class="linea"><span>Sueldo básico</span><span>{{ formatoMoneda(b.sueldoBase) }}</span></div>
        <div v-if="b.asignacionFamiliar > 0" class="linea">
          <span>Asignación familiar</span><span>{{ formatoMoneda(b.asignacionFamiliar) }}</span>
        </div>
        <div v-if="b.pagoHoras25 > 0" class="linea">
          <span>Horas extra 25 % ({{ b.horasExtra25 }} h)</span>
          <span>{{ formatoMoneda(b.pagoHoras25) }}</span>
        </div>
        <div v-if="b.pagoHoras35 > 0" class="linea">
          <span>Horas extra 35 % ({{ b.horasExtra35 }} h)</span>
          <span>{{ formatoMoneda(b.pagoHoras35) }}</span>
        </div>
        <div v-if="b.pagoDescanso > 0" class="linea">
          <span>Descanso o feriado ({{ b.horasDescanso }} h)</span>
          <span>{{ formatoMoneda(b.pagoDescanso) }}</span>
        </div>
        <div v-if="!b.pagoHoras25 && !b.pagoHoras35 && !b.pagoDescanso && b.ingresoExtra > 0" class="linea">
          <span>Horas extra ({{ b.horasExtra }} h)</span>
          <span>{{ formatoMoneda(b.ingresoExtra) }}</span>
        </div>
        <div class="linea fw-bold"><span>Sueldo bruto</span><span>{{ formatoMoneda(b.bruto) }}</span></div>

        <p class="section-label">Descuentos</p>
        <div class="linea descuento"><span>Adelanto quincenal</span><span>{{ formatoMoneda(b.adelanto) }}</span></div>
        <template v-if="b.regimen === 'AFP' && b.aporteAfp != null">
          <div class="linea descuento">
            <span>Aporte obligatorio ({{ pension }})</span>
            <span>{{ formatoMoneda(b.aporteAfp) }}</span>
          </div>
          <div class="linea descuento">
            <span>Prima de seguro ({{ pension }})</span>
            <span>{{ formatoMoneda(b.primaSeguro) }}</span>
          </div>
          <div v-if="b.comisionAfp > 0" class="linea descuento">
            <span>Comisión ({{ pension }})</span>
            <span>{{ formatoMoneda(b.comisionAfp) }}</span>
          </div>
        </template>
        <div v-else class="linea descuento">
          <span>{{ pension }} ({{ formatoPorcentaje(b.tasaPension / 100) }})</span>
          <span>{{ formatoMoneda(b.pension) }}</span>
        </div>
        <div v-if="b.descuentoTardanza > 0" class="linea descuento">
          <span>Tardanzas ({{ b.minutosTardanza }} min)</span>
          <span>{{ formatoMoneda(b.descuentoTardanza) }}</span>
        </div>
        <div v-if="b.descuentoFalta > 0" class="linea descuento">
          <span>Faltas ({{ b.diasFalta }} días)</span>
          <span>{{ formatoMoneda(b.descuentoFalta) }}</span>
        </div>
        <div v-if="!b.descuentoTardanza && !b.descuentoFalta && b.tardanzas > 0" class="linea descuento">
          <span>Tardanzas / faltas</span>
          <span>{{ formatoMoneda(b.tardanzas) }}</span>
        </div>
        <div v-if="b.quintaCategoria > 0" class="linea descuento">
          <span>Retención 5.ª categoría</span>
          <span>{{ formatoMoneda(b.quintaCategoria) }}</span>
        </div>
        <p v-if="b.essaludEmpleador > 0" class="small text-secondary mb-0">
          EsSalud del empleador: {{ formatoMoneda(b.essaludEmpleador) }}. No se descuenta al trabajador.
        </p>
      </template>

      <div class="neto">
        <span>
          {{
            b.modalidad === 'Quincena'
              ? 'Adelanto a pagar'
              : b.modalidad === 'CTS'
                ? 'CTS a depositar'
                : 'Neto a pagar'
          }}
        </span>
        <span>{{ formatoMoneda(b.neto) }}</span>
      </div>

      <div v-if="mostrarImprimir" class="export-actions mt-3 no-print">
        <button
          type="button"
          class="btn btn-outline-primary btn-export d-inline-flex align-items-center gap-2"
          @click="imprimir"
        >
          <Icon nombre="print" /> Imprimir
        </button>
        <button
          type="button"
          class="btn btn-primary btn-export d-inline-flex align-items-center gap-2"
          @click="descargarPdf"
        >
          <Icon nombre="download" /> Descargar PDF
        </button>
      </div>
    </article>
  </div>
</template>
