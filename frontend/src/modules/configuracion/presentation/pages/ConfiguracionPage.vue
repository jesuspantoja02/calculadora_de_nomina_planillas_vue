<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { container } from '../../../../composition/container';
import { useConfirm } from '../../../../core/confirm/useConfirm';
import { useToast } from '../../../../core/notifications/useToast';
import { AFP_ENTIDADES, type AfpEntidad } from '../../../../shared/models/tipos';
import { useApiAction } from '../../../../shared/presentation/useApiAction';
import CompanyLogo from '../../../../shared/ui/CompanyLogo.vue';
import EntradaInput from '../../../../shared/ui/EntradaInput.vue';
import FormSelect from '../../../../shared/ui/FormSelect.vue';
import PageHeader from '../../../../shared/ui/PageHeader.vue';
import { claseValidacion } from '../../../../shared/validators/formularios';
import type { Configuracion, TasasAfpEntidad, TipoComisionAfp } from '../../domain/configuracion.model';
import '../../../../styles/configuracion.css';

type TasasAfpForm = Record<
  AfpEntidad,
  {
    aporteAfpPct: string;
    primaSeguroPct: string;
    comisionFlujoPct: string;
    comisionSaldoPct: string;
    tipoComisionAfp: TipoComisionAfp;
  }
>;

interface FormState {
  empresaNombre: string;
  empresaRuc: string;
  empresaEslogan: string;
  empresaLogoUrl: string;
  tasasAfp: TasasAfpForm;
  remuneracionMaximaAsegurable: string;
  tasaOnp: string;
  tasaEssalud: string;
  rmv: string;
  uit: string;
  adelantoQuincenalPct: string;
  aplicarQuintaCategoria: boolean;
}

function tasasDesdeConfig(t: TasasAfpEntidad) {
  return {
    aporteAfpPct: String(t.aporteAfpPct),
    primaSeguroPct: String(t.primaSeguroPct),
    comisionFlujoPct: String(t.comisionFlujoPct),
    comisionSaldoPct: String(t.comisionSaldoPct),
    tipoComisionAfp: t.tipoComisionAfp,
  };
}

function desdeConfig(c: Configuracion): FormState {
  const tasasAfp = {} as TasasAfpForm;
  for (const entidad of AFP_ENTIDADES) {
    tasasAfp[entidad] = tasasDesdeConfig(c.tasasAfp[entidad]);
  }
  return {
    empresaNombre: c.empresaNombre,
    empresaRuc: c.empresaRuc,
    empresaEslogan: c.empresaEslogan ?? '',
    empresaLogoUrl: c.empresaLogoUrl ?? '',
    tasasAfp,
    remuneracionMaximaAsegurable: String(c.remuneracionMaximaAsegurable),
    tasaOnp: String(c.tasaOnp),
    tasaEssalud: String(c.tasaEssalud),
    rmv: String(c.rmv),
    uit: String(c.uit),
    adelantoQuincenalPct: String(c.adelantoQuincenalPct),
    aplicarQuintaCategoria: c.aplicarQuintaCategoria,
  };
}

const toast = useToast();
const { confirmar } = useConfirm();
const run = useApiAction();
const form = ref<FormState | null>(null);
const guardando = ref(false);
const touched = ref(false);

onMounted(() => {
  void container.configuracion.obtener().then((c) => {
    form.value = desdeConfig(c);
  });
});

const rucOk = computed(() => form.value != null && /^\d{11}$/.test(form.value.empresaRuc));
const nombreOk = computed(() => form.value != null && form.value.empresaNombre.length >= 2);

function pctOk(v: string): boolean {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

const tasasOk = computed(() => {
  if (!form.value) return false;
  return AFP_ENTIDADES.every((entidad) => {
    const t = form.value!.tasasAfp[entidad];
    return (
      pctOk(t.aporteAfpPct) &&
      pctOk(t.primaSeguroPct) &&
      pctOk(t.comisionFlujoPct) &&
      pctOk(t.comisionSaldoPct)
    );
  });
});

const valid = computed(() => {
  if (!form.value) return false;
  const f = form.value;
  return (
    nombreOk.value &&
    rucOk.value &&
    tasasOk.value &&
    pctOk(f.tasaOnp) &&
    pctOk(f.tasaEssalud) &&
    pctOk(f.adelantoQuincenalPct) &&
    Number(f.remuneracionMaximaAsegurable) >= 0 &&
    Number(f.rmv) >= 0 &&
    Number(f.uit) >= 1
  );
});

function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
  if (!form.value) return;
  form.value = { ...form.value, [key]: value };
}

function setTasaAfp(entidad: AfpEntidad, key: keyof TasasAfpForm[AfpEntidad], value: string | TipoComisionAfp) {
  if (!form.value) return;
  form.value = {
    ...form.value,
    tasasAfp: {
      ...form.value.tasasAfp,
      [entidad]: {
        ...form.value.tasasAfp[entidad],
        [key]: value,
      },
    },
  };
}

function aNumero(v: string): number {
  return Number(v);
}

function armarTasasAfp(formTasas: TasasAfpForm): Configuracion['tasasAfp'] {
  const out = {} as Configuracion['tasasAfp'];
  for (const entidad of AFP_ENTIDADES) {
    const t = formTasas[entidad];
    out[entidad] = {
      aporteAfpPct: aNumero(t.aporteAfpPct),
      primaSeguroPct: aNumero(t.primaSeguroPct),
      comisionFlujoPct: aNumero(t.comisionFlujoPct),
      comisionSaldoPct: aNumero(t.comisionSaldoPct),
      tipoComisionAfp: t.tipoComisionAfp,
    };
  }
  return out;
}

async function guardar(e: Event) {
  e.preventDefault();
  touched.value = true;
  if (!valid.value || !form.value) return;

  const tasasAfp = armarTasasAfp(form.value.tasasAfp);
  const integra = tasasAfp.Integra;
  const config: Configuracion = {
    empresaNombre: form.value.empresaNombre,
    empresaRuc: form.value.empresaRuc,
    empresaEslogan: form.value.empresaEslogan.trim(),
    empresaLogoUrl: form.value.empresaLogoUrl,
    tasasAfp,
    aporteAfpPct: integra.aporteAfpPct,
    primaSeguroPct: integra.primaSeguroPct,
    comisionFlujoPct: integra.comisionFlujoPct,
    tipoComisionAfp: integra.tipoComisionAfp,
    remuneracionMaximaAsegurable: aNumero(form.value.remuneracionMaximaAsegurable),
    tasaOnp: aNumero(form.value.tasaOnp),
    tasaEssalud: aNumero(form.value.tasaEssalud),
    rmv: aNumero(form.value.rmv),
    uit: aNumero(form.value.uit),
    adelantoQuincenalPct: aNumero(form.value.adelantoQuincenalPct),
    aplicarQuintaCategoria: form.value.aplicarQuintaCategoria,
  };

  guardando.value = true;
  const ok = await run(() => container.configuracion.actualizar(config));
  guardando.value = false;
  if (ok) toast.exito('Configuración guardada.');
}

async function reiniciar() {
  const acepta = await confirmar({
    titulo: 'Reiniciar datos',
    mensaje: '¿Deseas borrar todos los empleados y boletas guardadas?',
    detalle: 'Esta acción no se puede deshacer. La configuración de tasas y empresa se mantiene.',
    confirmarTexto: 'Borrar datos',
    cancelarTexto: 'Cancelar',
    variante: 'peligro',
  });
  if (!acepta) return;
  const ok = await run(() => container.configuracion.reiniciarDatos());
  if (ok) toast.exito('Datos borrados.');
}

function elegirLogo(file: File | null) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
    toast.error('Usa una imagen PNG, JPEG o WebP.');
    return;
  }
  if (file.size > 400_000) {
    toast.error('El logo no debe superar 400 KB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const data = typeof reader.result === 'string' ? reader.result : '';
    setField('empresaLogoUrl', data);
  };
  reader.readAsDataURL(file);
}

function totalFlujo(entidad: AfpEntidad): string {
  if (!form.value) return '—';
  const t = form.value.tasasAfp[entidad];
  const total =
    aNumero(t.aporteAfpPct) +
    aNumero(t.primaSeguroPct) +
    (t.tipoComisionAfp === 'flujo' ? aNumero(t.comisionFlujoPct) : 0);
  return Number.isFinite(total) ? `${total.toFixed(2)} %` : '—';
}
</script>

<template>
  <template v-if="!form">
    <PageHeader titulo="Configuración" descripcion="Cargando parámetros…" />
    <div class="panel empty">Cargando…</div>
  </template>
  <template v-else>
    <PageHeader
      titulo="Configuración"
      descripcion="Parámetros de empresa y reglas laborales. Las tasas AFP se aplican según la administradora de cada trabajador."
    />

    <form class="config-form" novalidate @submit="guardar">
      <section class="panel config-section">
        <header class="config-section__head">
          <div>
            <h2 class="config-section__title">Empresa</h2>
            <p class="config-section__desc">Identidad que aparece en el inicio y en las boletas.</p>
          </div>
        </header>

        <div class="row">
          <div class="col-md-8 mb-3">
            <label class="form-label" for="empresaNombre">Nombre comercial</label>
            <EntradaInput
              id="empresaNombre"
              tipo="empresa"
              class="form-control"
              :class="claseValidacion(nombreOk, !nombreOk, touched, touched)"
              :model-value="form.empresaNombre"
              :max-length="60"
              auto-complete="off"
              @update:model-value="setField('empresaNombre', $event)"
            />
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label" for="empresaRuc">RUC</label>
            <EntradaInput
              id="empresaRuc"
              tipo="ruc"
              class="form-control"
              :class="claseValidacion(rucOk, !rucOk, touched, touched)"
              :model-value="form.empresaRuc"
              :max-length="11"
              input-mode="numeric"
              auto-complete="off"
              @update:model-value="setField('empresaRuc', $event)"
            />
            <div class="form-text">11 dígitos, sin guiones.</div>
          </div>
        </div>

        <div class="row align-items-start">
          <div class="col-md-8 mb-3">
            <label class="form-label" for="empresaEslogan">Eslogan</label>
            <EntradaInput
              id="empresaEslogan"
              tipo="empresa"
              class="form-control"
              :model-value="form.empresaEslogan"
              :max-length="120"
              auto-complete="off"
              placeholder="Ej. Planillas claras, pagos seguros"
              @update:model-value="setField('empresaEslogan', $event)"
            />
          </div>
          <div class="col-md-4 mb-3">
            <span class="form-label d-block">Logo</span>
            <div class="config-logo">
              <CompanyLogo :nombre="form.empresaNombre" :logo-url="form.empresaLogoUrl" :size="56" />
              <div class="config-logo__actions">
                <label class="btn btn-secondary btn-sm mb-0">
                  Subir imagen
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    class="visually-hidden"
                    @change="
                      (e) => {
                        const input = e.target as HTMLInputElement;
                        elegirLogo(input.files?.[0] ?? null);
                        input.value = '';
                      }
                    "
                  />
                </label>
                <button
                  v-if="form.empresaLogoUrl"
                  type="button"
                  class="btn btn-link btn-sm p-0 text-secondary"
                  @click="setField('empresaLogoUrl', '')"
                >
                  Quitar logo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel config-section">
        <header class="config-section__head">
          <div>
            <h2 class="config-section__title">AFP · tasas por administradora</h2>
            <p class="config-section__desc">
              Cada AFP tiene su comisión. El aporte (10 %) y la prima (1,37 %) suelen ser iguales; ajústalos si la SBS
              publica un nuevo devengue. La comisión sobre saldo no se descuenta del sueldo.
            </p>
          </div>
        </header>

        <div class="config-afp-grid">
          <article v-for="entidad in AFP_ENTIDADES" :key="entidad" class="config-afp-card" :data-afp="entidad.toLowerCase()">
            <header class="config-afp-card__head">
              <h3 class="config-afp-card__title">AFP {{ entidad }}</h3>
              <span class="config-afp-card__total">Desc. flujo: {{ totalFlujo(entidad) }}</span>
            </header>

            <div class="config-afp-card__fields">
              <div>
                <label class="form-label" :for="`${entidad}-aporte`">Aporte (%)</label>
                <EntradaInput
                  :id="`${entidad}-aporte`"
                  tipo="decimal"
                  :limites="{ max: 100, decimales: 2 }"
                  class="form-control"
                  :model-value="form.tasasAfp[entidad].aporteAfpPct"
                  input-mode="decimal"
                  auto-complete="off"
                  @update:model-value="setTasaAfp(entidad, 'aporteAfpPct', $event)"
                />
              </div>
              <div>
                <label class="form-label" :for="`${entidad}-prima`">Prima seguro (%)</label>
                <EntradaInput
                  :id="`${entidad}-prima`"
                  tipo="decimal"
                  :limites="{ max: 100, decimales: 2 }"
                  class="form-control"
                  :model-value="form.tasasAfp[entidad].primaSeguroPct"
                  input-mode="decimal"
                  auto-complete="off"
                  @update:model-value="setTasaAfp(entidad, 'primaSeguroPct', $event)"
                />
              </div>
              <div>
                <label class="form-label" :for="`${entidad}-flujo`">Comisión flujo (%)</label>
                <EntradaInput
                  :id="`${entidad}-flujo`"
                  tipo="decimal"
                  :limites="{ max: 100, decimales: 2 }"
                  class="form-control"
                  :model-value="form.tasasAfp[entidad].comisionFlujoPct"
                  input-mode="decimal"
                  auto-complete="off"
                  @update:model-value="setTasaAfp(entidad, 'comisionFlujoPct', $event)"
                />
              </div>
              <div>
                <label class="form-label" :for="`${entidad}-saldo`">Comisión saldo (% anual)</label>
                <EntradaInput
                  :id="`${entidad}-saldo`"
                  tipo="decimal"
                  :limites="{ max: 100, decimales: 2 }"
                  class="form-control"
                  :model-value="form.tasasAfp[entidad].comisionSaldoPct"
                  input-mode="decimal"
                  auto-complete="off"
                  @update:model-value="setTasaAfp(entidad, 'comisionSaldoPct', $event)"
                />
              </div>
              <div class="config-afp-card__tipo">
                <label class="form-label" :for="`${entidad}-tipo`">Tipo de comisión</label>
                <FormSelect
                  :id="`${entidad}-tipo`"
                  :model-value="form.tasasAfp[entidad].tipoComisionAfp"
                  @update:model-value="(v) => setTasaAfp(entidad, 'tipoComisionAfp', v as TipoComisionAfp)"
                >
                  <option value="flujo">Flujo (descuenta del sueldo)</option>
                  <option value="saldo">Saldo (cobra al fondo)</option>
                </FormSelect>
              </div>
            </div>
          </article>
        </div>

        <div class="row mt-3">
          <div class="col-md-6 mb-3 mb-md-0">
            <label class="form-label" for="remuneracionMaximaAsegurable">Remuneración máx. asegurable (S/)</label>
            <EntradaInput
              id="remuneracionMaximaAsegurable"
              tipo="decimal"
              :limites="{ max: 1_000_000, decimales: 2 }"
              class="form-control"
              :model-value="form.remuneracionMaximaAsegurable"
              input-mode="decimal"
              auto-complete="off"
              @update:model-value="setField('remuneracionMaximaAsegurable', $event)"
            />
            <div class="form-text">Tope SBS compartido por las 4 AFP (prima y aportes).</div>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="tasaOnp">ONP (%)</label>
            <EntradaInput
              id="tasaOnp"
              tipo="decimal"
              :limites="{ max: 100, decimales: 2 }"
              class="form-control"
              :model-value="form.tasaOnp"
              input-mode="decimal"
              auto-complete="off"
              @update:model-value="setField('tasaOnp', $event)"
            />
            <div class="form-text">Para trabajadores en régimen ONP.</div>
          </div>
        </div>
      </section>

      <div class="config-grid">
        <section class="panel config-section">
          <header class="config-section__head">
            <div>
              <h2 class="config-section__title">Aporte del empleador</h2>
              <p class="config-section__desc">No se descuenta al trabajador.</p>
            </div>
          </header>
          <label class="form-label" for="tasaEssalud">EsSalud (%)</label>
          <EntradaInput
            id="tasaEssalud"
            tipo="decimal"
            :limites="{ max: 100, decimales: 2 }"
            class="form-control"
            :model-value="form.tasaEssalud"
            input-mode="decimal"
            auto-complete="off"
            @update:model-value="setField('tasaEssalud', $event)"
          />
          <div class="form-text">En EPS, la bonificación de gratificación usa el 75 % de esta tasa.</div>
        </section>

        <section class="panel config-section">
          <header class="config-section__head">
            <div>
              <h2 class="config-section__title">Parámetros legales</h2>
              <p class="config-section__desc">RMV y UIT vigentes.</p>
            </div>
          </header>
          <div class="row">
            <div class="col-md-6 mb-3 mb-md-0">
              <label class="form-label" for="rmv">RMV (S/)</label>
              <EntradaInput
                id="rmv"
                tipo="decimal"
                :limites="{ max: 100_000, decimales: 2 }"
                class="form-control"
                :model-value="form.rmv"
                input-mode="decimal"
                auto-complete="off"
                @update:model-value="setField('rmv', $event)"
              />
              <div class="form-text">Asignación familiar = 10 % de la RMV.</div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="uit">UIT (S/)</label>
              <EntradaInput
                id="uit"
                tipo="entero"
                :limites="{ min: 1, max: 100_000 }"
                class="form-control"
                :model-value="form.uit"
                input-mode="numeric"
                auto-complete="off"
                @update:model-value="setField('uit', $event)"
              />
            </div>
          </div>
        </section>
      </div>

      <section class="panel config-section">
        <header class="config-section__head">
          <div>
            <h2 class="config-section__title">Políticas de pago</h2>
            <p class="config-section__desc">Reglas internas al procesar la planilla.</p>
          </div>
        </header>
        <div class="row align-items-start">
          <div class="col-md-4 mb-3">
            <label class="form-label" for="adelantoQuincenalPct">Adelanto quincenal (%)</label>
            <EntradaInput
              id="adelantoQuincenalPct"
              tipo="decimal"
              :limites="{ max: 100, decimales: 2 }"
              class="form-control"
              :model-value="form.adelantoQuincenalPct"
              input-mode="decimal"
              auto-complete="off"
              @update:model-value="setField('adelantoQuincenalPct', $event)"
            />
          </div>
          <div class="col-md-8 mb-3">
            <span class="form-label d-block">Impuesto a la renta</span>
            <label class="config-check">
              <input
                id="quinta"
                type="checkbox"
                :checked="form.aplicarQuintaCategoria"
                @change="setField('aplicarQuintaCategoria', ($event.target as HTMLInputElement).checked)"
              />
              <span>
                <strong>Retener 5.ª categoría</strong>
                <small>En el fin de mes, con proyección de remuneración estable.</small>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div class="config-actions panel">
        <div class="config-actions__save">
          <button type="submit" class="btn btn-primary" :disabled="!valid || guardando">
            {{ guardando ? 'Guardando…' : 'Guardar configuración' }}
          </button>
          <span v-if="touched && !valid" class="config-actions__hint">Revisa los campos marcados antes de guardar.</span>
        </div>
        <div class="config-danger">
          <div>
            <p class="config-danger__title">Zona peligrosa</p>
            <p class="config-danger__text">Borra empleados y boletas. La configuración de tasas se conserva.</p>
          </div>
          <button type="button" class="btn btn-outline-danger" @click="reiniciar()">
            Borrar empleados y boletas
          </button>
        </div>
      </div>
    </form>
  </template>
</template>
