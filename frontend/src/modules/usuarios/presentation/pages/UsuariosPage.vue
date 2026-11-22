<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuth } from '../../../../core/auth/useAuth';
import { esAdmin } from '../../../../core/auth/roles';
import { useConfirm } from '../../../../core/confirm/useConfirm';
import PageHeader from '../../../../shared/ui/PageHeader.vue';
import UsuarioForm from '../components/UsuarioForm.vue';
import UsuarioLista from '../components/UsuarioLista.vue';
import type { ActualizarUsuarioDto, UsuarioCuenta, UsuarioCuentaDto } from '../../domain/usuario.model';
import { useUsuariosStore } from '../composables/useUsuariosStore';

const { rol, userId, actualizarFotoLocal } = useAuth();
const { confirmar } = useConfirm();
const admin = computed(() => esAdmin(rol.value));
const store = useUsuariosStore(admin.value);
const { items, rolesAsignables, cargando, guardando, editando, editar, guardar, eliminar } = store;
const limpiarForm = ref<(() => void) | null>(null);

async function onGuardar(dto: UsuarioCuentaDto | ActualizarUsuarioDto, esNuevo: boolean) {
  const ok = await guardar(dto, esNuevo);
  if (ok && esNuevo) limpiarForm.value?.();
  if (ok && ok.id === userId.value) {
    actualizarFotoLocal(ok.fotoUrl ?? '');
  }
}

async function onEliminar(u: UsuarioCuenta) {
  const ok = await confirmar({
    titulo: 'Eliminar cuenta',
    mensaje: `¿Deseas eliminar la cuenta «${u.usuario}»?`,
    detalle: 'La persona ya no podrá iniciar sesión con estas credenciales.',
    confirmarTexto: 'Eliminar',
    cancelarTexto: 'Cancelar',
    variante: 'peligro',
  });
  if (ok) void eliminar(u);
}

const titulo = computed(() => (admin.value ? 'Usuarios del sistema' : 'Agregar nuevo usuario'));
const descripcion = computed(() =>
  admin.value
    ? 'Cuentas con acceso a planilla, empleados y configuración según su rol.'
    : 'Registra una cuenta nueva con el rol permitido para tu perfil. No verás el listado de cuentas existentes.',
);
</script>

<template>
  <PageHeader :titulo="titulo" :descripcion="descripcion">
    <template v-if="admin" #acciones>
      <a class="btn btn-primary" href="#alta-usuario">Nueva cuenta</a>
    </template>
  </PageHeader>

  <div class="row g-4" :class="{ 'justify-content-center': !admin }">
    <section :class="admin ? 'col-xl-5' : 'col-lg-6 usuarios-solo-alta'" id="alta-usuario">
      <UsuarioForm
        :cuenta="admin ? editando : null"
        :roles-asignables="rolesAsignables"
        :guardando="guardando"
        :solo-alta="!admin"
        @guardar="onGuardar"
        @cancelar="editar(null)"
        @limpiar-ref="(fn) => (limpiarForm = fn)"
      />
    </section>

    <section v-if="admin" class="col-xl-7">
      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">
            Cuentas activas <span class="count">{{ items.length }}</span>
          </h2>
        </div>
        <UsuarioLista
          :items="items"
          :cargando="cargando"
          :editando-id="editando?.id ?? null"
          :sesion-id="userId"
          @editar="editar"
          @eliminar="onEliminar"
        />
      </div>
    </section>
  </div>
</template>
