<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useTheme } from '../../../../core/theme/useTheme';
import { container } from '../../../../composition/container';
import PageHeader from '../../../../shared/ui/PageHeader.vue';
import CompositionBars from '../../../../shared/ui/charts/CompositionBars.vue';
import DonutChart from '../../../../shared/ui/charts/DonutChart.vue';
import { estilosAvatarTinte, formatoMoneda, iniciales, tituloPalabras, tintePersona } from '../../../../shared/formatters';
import { colorDistribucionPension, etiquetaSistemaPensiones } from '../../../../shared/pensiones';
import type { ResumenDashboard } from '../../domain/dashboard.model';

const { tema } = useTheme();
const resumen = ref<ResumenDashboard | null>(null);

onMounted(() => {
  void container.dashboard
    .resumen()
    .then((r) => {
      resumen.value = r;
    })
    .catch(() => {
      resumen.value = null;
    });
});
</script>

<template>
  <template v-if="!resumen">
    <PageHeader
      titulo="Dashboard"
      descripcion="Estimación del mes: sueldo y asignación familiar, menos pensión (ONP o AFP por administradora) y quinta categoría si aplica. EsSalud no se descuenta al trabajador."
    />
    <div class="panel empty">Cargando resumen…</div>
  </template>
  <template v-else>
    <PageHeader
      titulo="Dashboard"
      descripcion="Estimación del mes: sueldo y asignación familiar, menos pensión (ONP o AFP por administradora) y quinta categoría si aplica. EsSalud no se descuenta al trabajador."
    >
      <template #acciones>
        <RouterLink class="btn btn-primary" to="/planilla/procesar-pago">Procesar pago</RouterLink>
      </template>
    </PageHeader>

    <div class="kpi-grid">
      <div class="panel kpi-card kpi-card--bruto">
        <div class="kpi-label">Total bruto registrado</div>
        <div class="kpi-value money">{{ formatoMoneda(resumen.totales.bruto) }}</div>
        <p class="kpi-note">{{ resumen.totalEmpleados }} empleados en planilla</p>
      </div>
      <div class="panel kpi-card kpi-card--descuento">
        <div class="kpi-label">Total descuentos</div>
        <div class="kpi-value money">{{ formatoMoneda(resumen.totales.descuentos) }}</div>
        <p class="kpi-note">Pensión y quinta categoría estimadas</p>
      </div>
      <div class="panel kpi-card kpi-card--neto">
        <div class="kpi-label">Total neto estimado</div>
        <div class="kpi-value money accent-hue">{{ formatoMoneda(resumen.totales.neto) }}</div>
        <p class="kpi-note">EsSalud a cargo del empleador</p>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-4">
        <div class="panel h-100 chart-panel">
          <h2 class="panel-title mb-3">
            Sistemas de pensión <span class="count">{{ resumen.totalEmpleados }}</span>
          </h2>
          <div class="chart-panel__body">
            <DonutChart
              :segmentos="
                resumen.distribucionPension.map((seg) => ({
                  id: seg.id,
                  etiqueta: seg.etiqueta,
                  valor: seg.cantidad,
                  color: colorDistribucionPension(seg.id),
                }))
              "
              :centro="{ titulo: String(resumen.totalEmpleados), subtitulo: 'empleados' }"
            />
          </div>
          <div class="chart-panel__links">
            <RouterLink to="/empleados">Ver plantilla</RouterLink>
            <RouterLink to="/empleados?regimen=ONP">Solo ONP</RouterLink>
            <RouterLink to="/empleados?regimen=AFP">Todas las AFP</RouterLink>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="panel h-100 chart-panel">
          <h2 class="panel-title mb-3">Composición del mes</h2>
          <CompositionBars
            :barras="[
              {
                id: 'bruto',
                etiqueta: 'Bruto registrado',
                valor: resumen.totales.bruto,
                color: 'var(--chart-bruto)',
                formato: formatoMoneda,
              },
              {
                id: 'desc',
                etiqueta: 'Descuentos estimados',
                valor: resumen.totales.descuentos,
                color: 'var(--chart-descuento)',
                formato: formatoMoneda,
              },
              {
                id: 'neto',
                etiqueta: 'Neto estimado',
                valor: resumen.totales.neto,
                color: 'var(--chart-neto)',
                formato: formatoMoneda,
              },
            ]"
          />
        </div>
      </div>

      <div class="col-lg-4">
        <div class="dashboard-extremos h-100">
          <div class="panel dashboard-extremo--mayor">
            <div class="kpi-label mb-2">Mayor sueldo neto</div>
            <template v-if="resumen.mayorSueldo">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <span
                  class="avatar flex-shrink-0"
                  :style="estilosAvatarTinte(tintePersona(resumen.mayorSueldo.nombre, tema))"
                >
                  {{ iniciales(resumen.mayorSueldo.nombre) }}
                </span>
                <div class="min-w-0 dashboard-persona-meta">
                  <div class="fw-semibold text-truncate">{{ tituloPalabras(resumen.mayorSueldo.nombre) }}</div>
                  <small class="text-secondary">
                    {{ resumen.mayorSueldo.cargo }} ·
                    {{ etiquetaSistemaPensiones(resumen.mayorSueldo.regimen, resumen.mayorSueldo.afp) }}
                  </small>
                </div>
              </div>
              <div class="kpi-value money mt-2 dashboard-extremo-monto">
                {{ formatoMoneda(resumen.mayorSueldo.neto) }}
              </div>
            </template>
            <p v-else class="text-secondary mb-0">Sin datos todavía.</p>
          </div>

          <div class="panel dashboard-extremo--menor">
            <div class="kpi-label mb-2">Menor sueldo neto</div>
            <template v-if="resumen.menorSueldo">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <span
                  class="avatar flex-shrink-0"
                  :style="estilosAvatarTinte(tintePersona(resumen.menorSueldo.nombre, tema))"
                >
                  {{ iniciales(resumen.menorSueldo.nombre) }}
                </span>
                <div class="min-w-0 dashboard-persona-meta">
                  <div class="fw-semibold text-truncate">{{ tituloPalabras(resumen.menorSueldo.nombre) }}</div>
                  <small class="text-secondary">
                    {{ resumen.menorSueldo.cargo }} ·
                    {{ etiquetaSistemaPensiones(resumen.menorSueldo.regimen, resumen.menorSueldo.afp) }}
                  </small>
                </div>
              </div>
              <div class="kpi-value money mt-2 dashboard-extremo-monto">
                {{ formatoMoneda(resumen.menorSueldo.neto) }}
              </div>
            </template>
            <p v-else class="text-secondary mb-0">Sin datos todavía.</p>
          </div>
        </div>
      </div>
    </div>

    <p class="dashboard-footnote mb-0">
      Boletas emitidas: <strong class="fig-tabular">{{ resumen.totalBoletas }}</strong>. Los totales estiman el mes
      con sueldo y asignación familiar, menos la pensión y la quinta categoría.
    </p>
  </template>
</template>
