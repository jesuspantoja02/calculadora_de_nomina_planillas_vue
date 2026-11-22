<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AFP_ENTIDADES, CARGOS } from '../../../../shared/models/tipos';
import { useDebouncedValue } from '../../../../shared/composables/useDebouncedValue';
import EntradaInput from '../../../../shared/ui/EntradaInput.vue';
import { rangoSalarialInvalido } from '../../../../shared/validators/formularios';
import type { FiltroEmpleados } from '../../domain/empleado.model';
import { filtrosDesdePension, type PensionFiltro } from '../pensionFiltro';

const props = withDefaults(
  defineProps<{
    pensionInicial?: PensionFiltro;
  }>(),
  { pensionInicial: '' },
);

const emit = defineEmits<{ cambio: [filtros: FiltroEmpleados] }>();

const cargo = ref('');
const pension = ref<PensionFiltro>(props.pensionInicial);
const min = ref('');
const max = ref('');

watch(
  () => props.pensionInicial,
  (v) => {
    pension.value = v;
  },
);

const estado = computed(() => ({
  cargo: cargo.value,
  pension: pension.value,
  min: min.value,
  max: max.value,
}));

const debounced = useDebouncedValue(estado, 250);
const rangoInvalido = computed(() => rangoSalarialInvalido(debounced.value.min, debounced.value.max));

watch(
  [debounced, rangoInvalido],
  () => {
    if (rangoInvalido.value) return;
    const f: FiltroEmpleados = { ...filtrosDesdePension(debounced.value.pension) };
    if (debounced.value.cargo) f.cargo = debounced.value.cargo;
    const minN = debounced.value.min !== '' ? Number(debounced.value.min) : null;
    const maxN = debounced.value.max !== '' ? Number(debounced.value.max) : null;
    if (minN !== null && Number.isFinite(minN)) f.min = minN;
    if (maxN !== null && Number.isFinite(maxN)) f.max = maxN;
    emit('cambio', f);
  },
  { deep: true },
);

function limpiar() {
  cargo.value = '';
  pension.value = '';
  min.value = '';
  max.value = '';
}
</script>

<template>
  <form class="empleado-filtros row g-2 mb-3" @submit.prevent>
    <div class="col-12 col-md-3">
      <select v-model="cargo" class="form-select form-select-sm" aria-label="Filtrar por cargo">
        <option value="">Todos los cargos</option>
        <option v-for="c in CARGOS" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
    <div class="col-12 col-md-3">
      <select v-model="pension" class="form-select form-select-sm" aria-label="Filtrar por sistema de pensión">
        <option value="">Todos los sistemas</option>
        <option value="ONP">ONP</option>
        <option value="AFP">Todas las AFP</option>
        <optgroup label="Por administradora AFP">
          <option v-for="entidad in AFP_ENTIDADES" :key="entidad" :value="`AFP:${entidad}`">AFP {{ entidad }}</option>
        </optgroup>
      </select>
    </div>
    <div class="col-6 col-md-2">
      <EntradaInput
        v-model="min"
        tipo="decimal"
        :limites="{ max: 1_000_000, decimales: 2 }"
        class="form-control form-control-sm"
        :class="{ 'is-invalid': rangoInvalido }"
        placeholder="Mín"
        input-mode="decimal"
        auto-complete="off"
        aria-label="Sueldo mínimo"
      />
    </div>
    <div class="col-6 col-md-2">
      <EntradaInput
        v-model="max"
        tipo="decimal"
        :limites="{ max: 1_000_000, decimales: 2 }"
        class="form-control form-control-sm"
        :class="{ 'is-invalid': rangoInvalido }"
        placeholder="Máx"
        input-mode="decimal"
        auto-complete="off"
        aria-label="Sueldo máximo"
      />
    </div>
    <div class="col-12 col-md-2 d-md-flex align-items-stretch">
      <button type="button" class="btn btn-sm btn-outline-secondary empleado-filtros__limpiar" @click="limpiar">
        Limpiar
      </button>
    </div>
    <div v-if="rangoInvalido" class="invalid-msg">El mínimo no puede ser mayor que el máximo.</div>
  </form>
</template>
