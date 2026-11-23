<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { actualizarPerfilApi, cambiarPasswordApi, fetchPerfilApi, type PerfilApi } from '../auth/authApi';
import { etiquetaRol } from '../auth/roles';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../notifications/useToast';
import FormFieldStatus from '../../shared/ui/FormFieldStatus.vue';
import Icon from '../../shared/ui/Icon.vue';
import PasswordRevealButton from '../../shared/ui/PasswordRevealButton.vue';
import { iniciales } from '../../shared/formatters';
import { prepararFotoPerfil } from '../../shared/utils/prepararFotoPerfil';
import { claseValidacion } from '../../shared/validators/formularios';
import { useApiAction } from '../../shared/presentation/useApiAction';

const props = defineProps<{ abierto: boolean }>();
const emit = defineEmits<{ cerrar: [] }>();

const toast = useToast();
const run = useApiAction();
const { actualizarFotoLocal } = useAuth();
const sheetRef = ref<HTMLElement | null>(null);

const perfil = ref<PerfilApi | null>(null);
const cargando = ref(false);
const panelPassword = ref(false);
const passwordActual = ref('');
const passwordNueva = ref('');
const mostrarActual = ref(false);
const mostrarNueva = ref(false);
const touched = ref<Record<string, boolean>>({});
const guardando = ref(false);
const guardandoFoto = ref(false);

function passwordValida(v: string): boolean {
  return v.length >= 8 && v.length <= 128;
}

function fechaLegible(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function limpiarPassword() {
  passwordActual.value = '';
  passwordNueva.value = '';
  mostrarActual.value = false;
  mostrarNueva.value = false;
  touched.value = {};
}

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) {
      panelPassword.value = false;
      limpiarPassword();
      return;
    }
    cargando.value = true;
    fetchPerfilApi()
      .then((p) => {
        perfil.value = p;
        actualizarFotoLocal(p.fotoUrl ?? '');
      })
      .catch(() => {
        perfil.value = null;
      })
      .finally(() => {
        cargando.value = false;
      });
  },
);

function cerrarTodo() {
  const activo = document.activeElement;
  if (activo instanceof HTMLElement && sheetRef.value?.contains(activo)) {
    activo.blur();
  }
  emit('cerrar');
  panelPassword.value = false;
  limpiarPassword();
}

const actualOk = computed(() => passwordActual.value.length > 0);
const nuevaOk = computed(() => passwordValida(passwordNueva.value));
const puedeGuardarPassword = computed(() => actualOk.value && nuevaOk.value);

async function guardarPassword(e: Event) {
  e.preventDefault();
  touched.value = { actual: true, nueva: true };
  if (!puedeGuardarPassword.value) return;
  guardando.value = true;
  const ok = await run(async () => {
    await cambiarPasswordApi(passwordActual.value, passwordNueva.value);
    return true;
  });
  guardando.value = false;
  if (ok) {
    toast.exito('Contraseña actualizada correctamente.');
    limpiarPassword();
    panelPassword.value = false;
  }
}

async function aplicarFoto(fotoUrl: string) {
  guardandoFoto.value = true;
  const ok = await run(async () => {
    const actualizado = await actualizarPerfilApi(fotoUrl);
    perfil.value = actualizado;
    actualizarFotoLocal(actualizado.fotoUrl ?? '');
    return true;
  });
  guardandoFoto.value = false;
  if (ok) {
    toast.exito(fotoUrl ? 'Foto de perfil actualizada.' : 'Foto de perfil eliminada.');
  }
}

async function elegirFoto(file: File | null) {
  if (!file) return;
  try {
    const data = await prepararFotoPerfil(file);
    await aplicarFoto(data);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'No se pudo cargar la imagen.');
  }
}

function estadoCampo(ok: boolean, tocado: boolean, valor: string): 'valid' | 'invalid' | 'idle' {
  if (!tocado || valor === '') return 'idle';
  return ok ? 'valid' : 'invalid';
}
</script>

<template>
  <div
    class="profile-sheet-backdrop no-print"
    :class="{ 'profile-sheet-backdrop--open': abierto }"
    role="presentation"
    @click="cerrarTodo"
  />
  <aside
    ref="sheetRef"
    class="profile-sheet no-print"
    :class="{
      'profile-sheet--open': abierto,
      'profile-sheet--password-open': panelPassword,
    }"
    :aria-hidden="abierto ? undefined : true"
    :inert="!abierto"
    aria-label="Mi perfil"
  >
    <div class="profile-sheet__main">
      <header class="profile-sheet__head">
        <h2 class="panel-title mb-0">Mi perfil</h2>
        <button type="button" class="profile-sheet__close" aria-label="Cerrar" @click="cerrarTodo">
          <Icon nombre="x" :tamano="20" />
        </button>
      </header>
      <div class="profile-sheet__body">
        <p v-if="cargando" class="text-secondary">Cargando perfil…</p>
        <template v-if="!cargando && perfil">
          <div class="profile-sheet__hero">
            <div class="profile-sheet__hero-avatar" aria-hidden="true">
              <img v-if="perfil.fotoUrl" :src="perfil.fotoUrl" alt="" />
              <span v-else>{{ iniciales(perfil.usuario) }}</span>
            </div>
            <div>
              <p class="mb-0 fw-semibold">{{ perfil.usuario }}</p>
              <span class="pill cuenta-rol" :class="`cuenta-rol--${perfil.rol}`">{{ etiquetaRol(perfil.rol) }}</span>
            </div>
            <div class="perfil-foto__actions perfil-foto__actions--center">
              <label class="btn btn-secondary btn-sm mb-0">
                {{ guardandoFoto ? 'Subiendo…' : 'Cambiar foto' }}
                <input
                  type="file"
                  accept="image/*"
                  class="visually-hidden"
                  :disabled="guardandoFoto"
                  @change="
                    (e) => {
                      const input = e.target as HTMLInputElement;
                      void elegirFoto(input.files?.[0] ?? null);
                      input.value = '';
                    }
                  "
                />
              </label>
              <button
                v-if="perfil.fotoUrl"
                type="button"
                class="btn btn-link btn-sm p-0 text-secondary"
                :disabled="guardandoFoto"
                @click="aplicarFoto('')"
              >
                Quitar foto
              </button>
              <small class="text-secondary">Cualquier foto · se enmarca el rostro</small>
            </div>
          </div>
          <dl class="profile-sheet__dl">
            <div class="profile-sheet__row">
              <dt>Usuario de acceso</dt>
              <dd>{{ perfil.usuario }}</dd>
            </div>
            <div class="profile-sheet__row">
              <dt>Contraseña</dt>
              <dd><span class="profile-sheet__secret">••••••••</span></dd>
            </div>
            <div class="profile-sheet__row">
              <dt>Cuenta creada</dt>
              <dd>{{ fechaLegible(perfil.creadoEn) }}</dd>
            </div>
          </dl>
          <p class="profile-sheet__note">
            Por seguridad, la contraseña no se muestra en pantalla. Usa el botón inferior para cambiarla.
          </p>
          <button type="button" class="btn btn-outline-primary w-100 mt-3" @click="panelPassword = !panelPassword">
            {{ panelPassword ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña' }}
          </button>
        </template>
      </div>
    </div>

    <div class="profile-sheet__password" :aria-hidden="!panelPassword">
      <div class="profile-sheet__password-inner">
        <h3 class="h6 mb-3">Nueva contraseña</h3>
        <form novalidate @submit="guardarPassword">
          <div class="mb-3">
            <label for="perfil-password-actual">Contraseña actual</label>
            <FormFieldStatus
              :estado="estadoCampo(actualOk, !!touched.actual, passwordActual)"
              :mostrar="!!touched.actual && passwordActual !== ''"
            >
              <div class="form-secret-wrap">
                <input
                  id="perfil-password-actual"
                  v-model="passwordActual"
                  :type="mostrarActual ? 'text' : 'password'"
                  class="form-control form-control--status-external"
                  :class="claseValidacion(actualOk, !actualOk, !!touched.actual, !!touched.actual)"
                  autocomplete="current-password"
                  :disabled="guardando"
                  @blur="touched = { ...touched, actual: true }"
                />
                <PasswordRevealButton
                  :visible="mostrarActual"
                  class-name="form-secret-wrap__reveal"
                  @toggle="mostrarActual = !mostrarActual"
                />
              </div>
            </FormFieldStatus>
          </div>
          <div class="mb-4">
            <label for="perfil-password-nueva">Contraseña nueva</label>
            <FormFieldStatus
              :estado="estadoCampo(nuevaOk, !!touched.nueva, passwordNueva)"
              :mostrar="!!touched.nueva && passwordNueva !== ''"
            >
              <div class="form-secret-wrap">
                <input
                  id="perfil-password-nueva"
                  v-model="passwordNueva"
                  :type="mostrarNueva ? 'text' : 'password'"
                  class="form-control form-control--status-external"
                  :class="claseValidacion(nuevaOk, !nuevaOk, !!touched.nueva, !!touched.nueva)"
                  autocomplete="new-password"
                  :disabled="guardando"
                  @blur="touched = { ...touched, nueva: true }"
                />
                <PasswordRevealButton
                  :visible="mostrarNueva"
                  class-name="form-secret-wrap__reveal"
                  @toggle="mostrarNueva = !mostrarNueva"
                />
              </div>
            </FormFieldStatus>
            <small class="text-secondary">Mínimo 8 caracteres.</small>
          </div>
          <button type="submit" class="btn btn-primary w-100" :disabled="guardando || !puedeGuardarPassword">
            {{ guardando ? 'Guardando…' : 'Actualizar contraseña' }}
          </button>
        </form>
      </div>
    </div>
  </aside>
</template>
