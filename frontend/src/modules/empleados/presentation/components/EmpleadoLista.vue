<script setup lang="ts">
import { useTheme } from '../../../../core/theme/useTheme';
import {
  enmascararDni,
  estilosAvatarTinte,
  formatoMoneda,
  iniciales,
  tituloPalabras,
  tintePersona,
} from '../../../../shared/formatters';
import { etiquetaSistemaPensiones } from '../../../../shared/pensiones';
import Icon from '../../../../shared/ui/Icon.vue';
import type { Empleado } from '../../domain/empleado.model';

defineProps<{
  items: Empleado[];
  cargando: boolean;
  editandoId: string | null;
}>();

const emit = defineEmits<{
  editar: [e: Empleado];
  eliminar: [e: Empleado];
}>();

const { tema } = useTheme();
</script>

<template>
  <div v-if="items.length === 0">
    <div
      v-if="cargando"
      class="empleado-lista-estado"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="empleado-lista-estado__marca" aria-hidden="true">
        <Icon nombre="users" :tamano="22" />
      </div>
      <p class="empleado-lista-estado__titulo">Cargando personal</p>
      <p class="empleado-lista-estado__detalle">Consultando el registro…</p>
    </div>
    <div
      v-else
      class="empleado-lista-estado empleado-lista-estado--vacio reveal-in"
      role="status"
      aria-live="polite"
    >
      <div class="empleado-lista-estado__marca empleado-lista-estado__marca--vacio" aria-hidden="true">
        <Icon nombre="users" :tamano="22" />
      </div>
      <p class="empleado-lista-estado__titulo">Sin coincidencias</p>
      <p class="empleado-lista-estado__detalle">
        No hay empleados que coincidan con los filtros actuales. Registra el primero con el formulario de la izquierda.
      </p>
      <a class="empleado-lista-estado__cta" href="#alta-empleado">Ir al formulario de alta</a>
    </div>
  </div>
  <div v-else class="empleado-lista" :aria-busy="cargando || undefined">
    <div
      v-for="e in items"
      :key="e.id"
      class="row-item"
      :class="{ selected: e.id === editandoId }"
    >
      <span
        class="avatar"
        aria-hidden="true"
        :style="estilosAvatarTinte(tintePersona(e.nombre, tema))"
      >
        {{ iniciales(e.nombre) }}
      </span>
      <div class="flex-grow-1 min-w-0">
        <div class="fw-semibold text-truncate">{{ tituloPalabras(e.nombre) }}</div>
        <small class="text-secondary">{{ e.cargo }} · DNI {{ enmascararDni(e.dni) }}</small>
      </div>
      <div class="text-end">
        <div class="fw-semibold fig-tabular" style="font-family: var(--mono); font-weight: 500">
          {{ formatoMoneda(e.sueldoBase) }}
        </div>
        <span class="pill">{{ etiquetaSistemaPensiones(e.regimen, e.afp) }}</span>
        <span
          v-if="e.tieneHijos"
          class="pill ms-1"
          title="Hijos registrados para asignación familiar"
        >
          Hijos menores: {{ e.hijos?.length ?? 0 }}
        </span>
      </div>
      <div class="btn-group btn-group-sm">
        <button
          type="button"
          class="btn btn-outline-primary"
          :aria-label="`Editar ${e.nombre}`"
          @click="emit('editar', e)"
        >
          <Icon nombre="edit" />
        </button>
        <button
          type="button"
          class="btn btn-outline-danger"
          :aria-label="`Eliminar ${e.nombre}`"
          @click="emit('eliminar', e)"
        >
          <Icon nombre="trash" />
        </button>
      </div>
    </div>
  </div>
</template>
