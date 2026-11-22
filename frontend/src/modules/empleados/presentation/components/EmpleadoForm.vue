<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AFP_ENTIDADES, CARGOS, type AfpEntidad, type Regimen } from '../../../../shared/models/tipos';
import Icon from '../../../../shared/ui/Icon.vue';
import EntradaInput from '../../../../shared/ui/EntradaInput.vue';
import { claseValidacion, dniValido, nombreValido } from '../../../../shared/validators/formularios';
import type { Empleado, EmpleadoDto, HijoEmpleado } from '../../domain/empleado.model';

const props = defineProps<{
  empleado: Empleado | null;
  guardando: boolean;
}>();

const emit = defineEmits<{
  guardar: [dto: EmpleadoDto];
  cancelar: [];
  'limpiar-ref': [fn: () => void];
}>();

type HijoForm = { id: string; nombre: string; edad: string };

const MSG_EDAD_SIN_ASIGNACION =
  'No aplica asignación familiar: el hijo debe tener menos de 18 años. Corrige la edad o elimina el registro.';

const nuevoHijo = (): HijoForm => ({ id: crypto.randomUUID(), nombre: '', edad: '' });

const aHijosForm = (hijos: HijoEmpleado[]): HijoForm[] =>
  hijos.map((h) => ({ id: crypto.randomUUID(), nombre: h.nombre, edad: String(h.edad) }));

const vacio = () => ({
  dni: '',
  nombre: '',
  cargo: '',
  sueldoBase: '',
  regimen: '' as Regimen | '',
  afp: '' as AfpEntidad | '',
  tieneHijos: false,
  hijos: [] as HijoForm[],
});

const form = ref(vacio());
const touched = ref<Record<string, boolean>>({});
const hijosIntento = ref(false);
const hijoEntranteId = ref<string | null>(null);

function limpiar() {
  form.value = vacio();
  touched.value = {};
  hijosIntento.value = false;
  hijoEntranteId.value = null;
}

emit('limpiar-ref', limpiar);

watch(hijoEntranteId, (id) => {
  if (!id) return;
  const t = window.setTimeout(() => {
    hijoEntranteId.value = null;
  }, 320);
  return () => window.clearTimeout(t);
});

watch(
  () => props.empleado?.id,
  () => {
    const empleado = props.empleado;
    if (empleado) {
      const hijos = empleado.tieneHijos
        ? empleado.hijos?.length
          ? aHijosForm(empleado.hijos)
          : [nuevoHijo()]
        : [];
      form.value = {
        dni: empleado.dni,
        nombre: empleado.nombre,
        cargo: empleado.cargo,
        sueldoBase: String(empleado.sueldoBase),
        regimen: empleado.regimen,
        afp: empleado.regimen === 'AFP' && empleado.afp ? empleado.afp : '',
        tieneHijos: empleado.tieneHijos,
        hijos,
      };
      touched.value = {};
      hijosIntento.value = false;
    } else {
      limpiar();
    }
  },
);

function edadNum(edad: string): number | null {
  if (edad === '') return null;
  const n = Number(edad);
  return Number.isInteger(n) ? n : null;
}

function hijoSinAsignacion(h: HijoForm): boolean {
  const n = edadNum(h.edad);
  return n !== null && n >= 18;
}

function hijoValido(h: HijoForm): boolean {
  const n = edadNum(h.edad);
  return nombreValido(h.nombre) && n !== null && n >= 0 && n < 18;
}

const sueldoNum = computed(() => Number(form.value.sueldoBase));
const afpOk = computed(() => form.value.regimen !== 'AFP' || form.value.afp !== '');
const hijosOk = computed(
  () =>
    !form.value.tieneHijos ||
    (form.value.hijos.length > 0 && form.value.hijos.every(hijoValido) && !form.value.hijos.some(hijoSinAsignacion)),
);
const valid = computed(
  () =>
    dniValido(form.value.dni) &&
    nombreValido(form.value.nombre) &&
    form.value.cargo !== '' &&
    form.value.regimen !== '' &&
    afpOk.value &&
    Number.isFinite(sueldoNum.value) &&
    sueldoNum.value > 0 &&
    sueldoNum.value <= 1_000_000 &&
    hijosOk.value,
);

function mark(campo: string) {
  touched.value = { ...touched.value, [campo]: true };
}

function cambiarRegimen(regimen: Regimen | '') {
  form.value = {
    ...form.value,
    regimen,
    afp: regimen === 'AFP' ? form.value.afp : '',
  };
}

function toggleHijos(checked: boolean) {
  hijosIntento.value = false;
  form.value = {
    ...form.value,
    tieneHijos: checked,
    hijos: checked ? (form.value.hijos.length ? form.value.hijos : [nuevoHijo()]) : [],
  };
}

function actualizarHijo(id: string, patch: Partial<Pick<HijoForm, 'nombre' | 'edad'>>) {
  form.value = {
    ...form.value,
    hijos: form.value.hijos.map((h) => (h.id === id ? { ...h, ...patch } : h)),
  };
}

function agregarHijo() {
  const hijo = nuevoHijo();
  hijoEntranteId.value = hijo.id;
  form.value = { ...form.value, hijos: [...form.value.hijos, hijo] };
}

function quitarHijo(id: string) {
  if (form.value.hijos.length <= 1) return;
  form.value = { ...form.value, hijos: form.value.hijos.filter((h) => h.id !== id) };
}

function enviar(e: Event) {
  e.preventDefault();
  hijosIntento.value = form.value.tieneHijos;
  const marcas: Record<string, boolean> = {
    dni: true,
    nombre: true,
    cargo: true,
    regimen: true,
    sueldoBase: true,
    afp: true,
  };
  if (form.value.tieneHijos) {
    for (const h of form.value.hijos) {
      marcas[`hijo-nombre-${h.id}`] = true;
      marcas[`hijo-edad-${h.id}`] = true;
    }
  }
  touched.value = { ...touched.value, ...marcas };
  if (!valid.value) return;
  emit('guardar', {
    dni: form.value.dni,
    nombre: form.value.nombre,
    cargo: form.value.cargo,
    sueldoBase: sueldoNum.value,
    regimen: form.value.regimen as Regimen,
    afp: form.value.regimen === 'AFP' ? (form.value.afp as AfpEntidad) : null,
    tieneHijos: form.value.tieneHijos,
    hijos: form.value.tieneHijos
      ? form.value.hijos.map((h) => ({ nombre: h.nombre, edad: edadNum(h.edad) ?? 0 }))
      : [],
  });
}
</script>

<template>
  <form class="panel" novalidate @submit="enviar">
    <div class="panel-head">
      <h2 class="panel-title">{{ empleado ? 'Editar empleado' : 'Registrar empleado' }}</h2>
    </div>

    <div class="mb-3">
      <label class="form-label" for="dni">DNI</label>
      <EntradaInput
        id="dni"
        v-model="form.dni"
        tipo="dni"
        class="form-control"
        :class="claseValidacion(dniValido(form.dni), !dniValido(form.dni), !!touched.dni, !!touched.dni)"
        input-mode="numeric"
        :max-length="8"
        auto-complete="off"
        placeholder="8 dígitos"
        @blur="mark('dni')"
      />
      <div v-if="touched.dni && !dniValido(form.dni)" class="invalid-msg">El DNI debe tener exactamente 8 dígitos.</div>
    </div>

    <div class="mb-3">
      <label class="form-label" for="nombre">Nombres y apellidos</label>
      <EntradaInput
        id="nombre"
        v-model="form.nombre"
        tipo="nombre"
        class="form-control"
        :class="claseValidacion(nombreValido(form.nombre), !nombreValido(form.nombre), !!touched.nombre, !!touched.nombre)"
        :max-length="60"
        auto-complete="off"
        @blur="mark('nombre')"
      />
      <div v-if="touched.nombre && !nombreValido(form.nombre)" class="invalid-msg">Solo letras (3 a 60 caracteres).</div>
    </div>

    <div class="row">
      <div class="col-sm-6 mb-3">
        <label class="form-label" for="cargo">Cargo</label>
        <select
          id="cargo"
          v-model="form.cargo"
          class="form-select"
          :class="{ 'is-invalid': !form.cargo && touched.cargo }"
          @blur="mark('cargo')"
        >
          <option value="">Selecciona…</option>
          <option v-for="c in CARGOS" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="col-sm-6 mb-3">
        <label class="form-label" for="regimen">Sistema de pensiones</label>
        <select
          id="regimen"
          class="form-select"
          :class="{ 'is-invalid': !form.regimen && touched.regimen }"
          :value="form.regimen"
          @change="cambiarRegimen(($event.target as HTMLSelectElement).value as Regimen | '')"
          @blur="mark('regimen')"
        >
          <option value="">Selecciona…</option>
          <option value="AFP">AFP</option>
          <option value="ONP">ONP</option>
        </select>
      </div>
    </div>

    <section
      class="regimen-afp"
      :class="{ 'regimen-afp--open': form.regimen === 'AFP' }"
      :aria-hidden="form.regimen !== 'AFP'"
    >
      <div class="regimen-afp__collapse">
        <div class="regimen-afp__inner">
          <h3 class="regimen-afp__title">Administradora de fondos de pensiones</h3>
          <p class="regimen-afp__hint">
            Indica en qué AFP está o estará afiliado el trabajador (supervisadas por la SBS).
          </p>
          <label class="form-label" for="afp">AFP</label>
          <select
            id="afp"
            v-model="form.afp"
            class="form-select"
            :class="{ 'is-invalid': !form.afp && touched.afp }"
            :disabled="form.regimen !== 'AFP'"
            @blur="mark('afp')"
          >
            <option value="">Selecciona la AFP…</option>
            <option v-for="entidad in AFP_ENTIDADES" :key="entidad" :value="entidad">AFP {{ entidad }}</option>
          </select>
          <div v-if="touched.afp && form.regimen === 'AFP' && !form.afp" class="invalid-msg">
            Elige la administradora AFP del empleado.
          </div>
        </div>
      </div>
    </section>

    <div class="mb-3">
      <label class="form-label" for="sueldoBase">Sueldo básico (S/)</label>
      <EntradaInput
        id="sueldoBase"
        v-model="form.sueldoBase"
        tipo="decimal"
        :limites="{ max: 1_000_000, decimales: 2 }"
        class="form-control"
        :class="claseValidacion(sueldoNum > 0, !(sueldoNum > 0), !!touched.sueldoBase, !!touched.sueldoBase)"
        input-mode="decimal"
        auto-complete="off"
        @blur="mark('sueldoBase')"
      />
      <div v-if="touched.sueldoBase && !(sueldoNum > 0)" class="invalid-msg">Ingresa un sueldo mayor que 0.</div>
    </div>

    <section class="hijos-asignacion" :class="{ 'hijos-asignacion--open': form.tieneHijos }" aria-labelledby="tieneHijos">
      <div class="hijos-asignacion__toggle">
        <div class="hijos-asignacion__check">
          <input
            id="tieneHijos"
            type="checkbox"
            class="form-check-input hijos-asignacion__input"
            :checked="form.tieneHijos"
            @change="toggleHijos(($event.target as HTMLInputElement).checked)"
          />
          <div class="hijos-asignacion__check-text">
            <label class="hijos-asignacion__label" for="tieneHijos">Tiene hijos menores (asignación familiar)</label>
            <p class="hijos-asignacion__hint">
              Registra nombre y edad de cada hijo menor de 18 años para calcular la asignación familiar.
            </p>
          </div>
        </div>
      </div>

      <div class="hijos-asignacion__collapse" :aria-hidden="!form.tieneHijos">
        <div class="hijos-asignacion__collapse-inner">
          <div class="hijos-asignacion__head">
            <h3 class="hijos-asignacion__head-title">
              Hijos registrados
              <span class="hijos-asignacion__count">{{ form.hijos.length }}</span>
            </h3>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarHijo">Agregar hijo</button>
          </div>

          <ul class="hijos-asignacion__lista">
            <li
              v-for="(h, indice) in form.hijos"
              :key="h.id"
              class="hijo-ficha"
              :class="{
                'hijo-ficha--invalid': (touched[`hijo-edad-${h.id}`] || hijosIntento) && hijoSinAsignacion(h),
                'hijo-ficha--enter': h.id === hijoEntranteId,
              }"
            >
              <div class="hijo-ficha__head">
                <span class="hijo-ficha__index">Hijo {{ indice + 1 }}</span>
                <button
                  v-if="form.hijos.length > 1"
                  type="button"
                  class="hijo-ficha__quitar"
                  :aria-label="`Quitar hijo ${indice + 1}`"
                  @click="quitarHijo(h.id)"
                >
                  <Icon nombre="trash" />
                </button>
              </div>
              <div class="row g-2">
                <div class="col-sm-7">
                  <label class="form-label" :for="`hijo-nombre-${h.id}`">Nombre</label>
                  <EntradaInput
                    :id="`hijo-nombre-${h.id}`"
                    tipo="nombre"
                    class="form-control"
                    :class="
                      claseValidacion(
                        nombreValido(h.nombre),
                        !nombreValido(h.nombre),
                        !!touched[`hijo-nombre-${h.id}`],
                        !!touched[`hijo-nombre-${h.id}`],
                      )
                    "
                    :model-value="h.nombre"
                    :max-length="60"
                    auto-complete="off"
                    placeholder="Nombre completo"
                    @update:model-value="actualizarHijo(h.id, { nombre: $event })"
                    @blur="mark(`hijo-nombre-${h.id}`)"
                  />
                  <div v-if="touched[`hijo-nombre-${h.id}`] && !nombreValido(h.nombre)" class="invalid-msg">
                    Solo letras (3 a 60 caracteres).
                  </div>
                </div>
                <div class="col-sm-5">
                  <label class="form-label" :for="`hijo-edad-${h.id}`">Edad (años)</label>
                  <EntradaInput
                    :id="`hijo-edad-${h.id}`"
                    tipo="entero"
                    :limites="{ min: 0, max: 99 }"
                    class="form-control"
                    :class="
                      claseValidacion(
                        edadNum(h.edad) !== null && (edadNum(h.edad) as number) < 18 && !hijoSinAsignacion(h),
                        !(edadNum(h.edad) !== null && (edadNum(h.edad) as number) < 18) || hijoSinAsignacion(h),
                        !!touched[`hijo-edad-${h.id}`],
                        !!touched[`hijo-edad-${h.id}`],
                      )
                    "
                    :model-value="h.edad"
                    input-mode="numeric"
                    :max-length="2"
                    auto-complete="off"
                    placeholder="0–17"
                    :aria-invalid="(touched[`hijo-edad-${h.id}`] || hijosIntento) && hijoSinAsignacion(h) || undefined"
                    @update:model-value="actualizarHijo(h.id, { edad: $event })"
                    @blur="mark(`hijo-edad-${h.id}`)"
                  />
                  <div
                    v-if="(touched[`hijo-edad-${h.id}`] || hijosIntento) && hijoSinAsignacion(h)"
                    class="invalid-msg"
                    role="alert"
                  >
                    {{ MSG_EDAD_SIN_ASIGNACION }}
                  </div>
                  <div
                    v-else-if="
                      (touched[`hijo-edad-${h.id}`] || hijosIntento) &&
                      h.edad !== '' &&
                      !(edadNum(h.edad) !== null && (edadNum(h.edad) as number) < 18) &&
                      !hijoSinAsignacion(h)
                    "
                    class="invalid-msg"
                  >
                    Indica una edad válida menor de 18 años.
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <div class="d-flex gap-2">
      <button type="submit" class="btn btn-primary" :disabled="!valid || guardando">
        {{ empleado ? 'Guardar cambios' : 'Guardar empleado' }}
      </button>
      <button type="button" class="btn btn-outline-secondary" @click="empleado ? emit('cancelar') : limpiar()">
        {{ empleado ? 'Cancelar' : 'Limpiar' }}
      </button>
    </div>
  </form>
</template>
