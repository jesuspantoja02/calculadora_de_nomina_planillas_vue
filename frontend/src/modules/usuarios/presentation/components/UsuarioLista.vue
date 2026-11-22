<script setup lang="ts">
import { etiquetaRol } from '../../../../core/auth/roles';
import { useTheme } from '../../../../core/theme/useTheme';
import { estilosAvatarTinte, iniciales, tintePersona } from '../../../../shared/formatters';
import Icon from '../../../../shared/ui/Icon.vue';
import type { UsuarioCuenta } from '../../domain/usuario.model';

defineProps<{
  items: UsuarioCuenta[];
  cargando: boolean;
  editandoId: string | null;
  sesionId: string | null;
}>();

const emit = defineEmits<{
  editar: [u: UsuarioCuenta];
  eliminar: [u: UsuarioCuenta];
}>();

const { tema } = useTheme();

function formatoFecha(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
</script>

<template>
  <div v-if="items.length === 0">
    <div v-if="cargando" class="empleado-lista-estado" role="status" aria-live="polite" aria-busy="true">
      <div class="empleado-lista-estado__marca" aria-hidden="true">
        <Icon nombre="shield" :tamano="22" />
      </div>
      <p class="empleado-lista-estado__titulo">Cargando cuentas</p>
      <p class="empleado-lista-estado__detalle">Consultando usuarios del sistema…</p>
    </div>
    <div v-else class="empleado-lista-estado empleado-lista-estado--vacio reveal-in" role="status" aria-live="polite">
      <div class="empleado-lista-estado__marca empleado-lista-estado__marca--vacio" aria-hidden="true">
        <Icon nombre="shield" :tamano="22" />
      </div>
      <p class="empleado-lista-estado__titulo">Sin cuentas aún</p>
      <p class="empleado-lista-estado__detalle">Crea la primera cuenta con el formulario de la izquierda.</p>
      <a class="empleado-lista-estado__cta" href="#alta-usuario">Ir al formulario</a>
    </div>
  </div>
  <div v-else class="empleado-lista" :aria-busy="cargando || undefined">
    <div
      v-for="u in items"
      :key="u.id"
      class="row-item"
      :class="{ selected: u.id === editandoId }"
    >
      <span
        v-if="u.fotoUrl"
        class="avatar avatar--foto"
        aria-hidden="true"
      >
        <img :src="u.fotoUrl" alt="" />
      </span>
      <span
        v-else
        class="avatar"
        aria-hidden="true"
        :style="estilosAvatarTinte(tintePersona(u.usuario, tema))"
      >
        {{ iniciales(u.usuario) }}
      </span>
      <div class="flex-grow-1 min-w-0">
        <div class="fw-semibold text-truncate">{{ u.usuario }}</div>
        <small class="text-secondary">Alta {{ formatoFecha(u.creadoEn) }}</small>
      </div>
      <div class="text-end">
        <span class="pill cuenta-rol" :class="`cuenta-rol--${u.rol}`">{{ etiquetaRol(u.rol) }}</span>
        <span v-if="u.id === sesionId" class="pill ms-1">Tu sesión</span>
      </div>
      <div class="btn-group btn-group-sm">
        <button
          type="button"
          class="btn btn-outline-primary"
          :aria-label="`Editar ${u.usuario}`"
          @click="emit('editar', u)"
        >
          <Icon nombre="edit" />
        </button>
        <button
          type="button"
          class="btn btn-outline-danger"
          :aria-label="`Eliminar ${u.usuario}`"
          :disabled="u.id === sesionId"
          :title="u.id === sesionId ? 'No puedes eliminar tu propia cuenta' : undefined"
          @click="emit('eliminar', u)"
        >
          <Icon nombre="trash" />
        </button>
      </div>
    </div>
  </div>
</template>
