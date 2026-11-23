<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { etiquetaRol, type RolUsuario } from '../../../../core/auth/roles';
import { useToast } from '../../../../core/notifications/useToast';
import FormFieldStatus from '../../../../shared/ui/FormFieldStatus.vue';
import FormSelect from '../../../../shared/ui/FormSelect.vue';
import PasswordRevealButton from '../../../../shared/ui/PasswordRevealButton.vue';
import { iniciales } from '../../../../shared/formatters';
import { prepararFotoPerfil } from '../../../../shared/utils/prepararFotoPerfil';
import { claseValidacion } from '../../../../shared/validators/formularios';
import type { ActualizarUsuarioDto, UsuarioCuenta, UsuarioCuentaDto } from '../../domain/usuario.model';

const props = withDefaults(
  defineProps<{
    cuenta: UsuarioCuenta | null;
    rolesAsignables: RolUsuario[];
    guardando: boolean;
    soloAlta?: boolean;
    sesionId?: string | null;
  }>(),
  { soloAlta: false, sesionId: null },
);

const emit = defineEmits<{
  guardar: [dto: UsuarioCuentaDto | ActualizarUsuarioDto, esNuevo: boolean];
  cancelar: [];
  'limpiar-ref': [fn: () => void];
}>();

const toast = useToast();
const usuarioRegex = /^[a-zA-Z0-9._-]+$/;

function usuarioValido(v: string): boolean {
  const t = v.trim();
  return t.length >= 3 && t.length <= 64 && usuarioRegex.test(t);
}

function passwordValida(v: string, requerida: boolean): boolean {
  if (!requerida && v === '') return true;
  return v.length >= 8 && v.length <= 128;
}

function estadoCampo(ok: boolean, tocado: boolean, valor: string): 'valid' | 'invalid' | 'idle' {
  if (!tocado || valor === '') return 'idle';
  return ok ? 'valid' : 'invalid';
}

const esNuevo = computed(() => props.cuenta == null || props.soloAlta);
const rolInicial = computed(() => props.rolesAsignables[0] ?? 'usuario');

const usuario = ref('');
const password = ref('');
const mostrarPassword = ref(false);
const cambioPasswordAbierto = ref(false);
const rol = ref<RolUsuario>(rolInicial.value);
const fotoUrl = ref('');
const fotoInicial = ref('');
const activo = ref(true);
const activoInicial = ref(true);
const touched = ref<Record<string, boolean>>({});

const esSesionActual = computed(
  () => !esNuevo.value && props.cuenta != null && props.cuenta.id === props.sesionId,
);

function limpiar() {
  usuario.value = '';
  password.value = '';
  mostrarPassword.value = false;
  cambioPasswordAbierto.value = false;
  rol.value = rolInicial.value;
  fotoUrl.value = '';
  fotoInicial.value = '';
  activo.value = true;
  activoInicial.value = true;
  touched.value = {};
}

emit('limpiar-ref', limpiar);

watch(
  () => [props.cuenta, props.soloAlta] as const,
  () => {
    if (props.cuenta && !props.soloAlta) {
      usuario.value = props.cuenta.usuario;
      password.value = '';
      mostrarPassword.value = false;
      cambioPasswordAbierto.value = false;
      rol.value = props.cuenta.rol;
      fotoUrl.value = props.cuenta.fotoUrl ?? '';
      fotoInicial.value = props.cuenta.fotoUrl ?? '';
      activo.value = props.cuenta.activo !== false;
      activoInicial.value = props.cuenta.activo !== false;
      touched.value = {};
    } else {
      limpiar();
    }
  },
);

watch(
  () => props.rolesAsignables,
  (roles) => {
    if (!roles.includes(rol.value)) {
      rol.value = roles[0] ?? 'usuario';
    }
  },
);

const usuarioOk = computed(() => usuarioValido(usuario.value));
const passwordRequerida = computed(() => esNuevo.value || cambioPasswordAbierto.value);
const passwordOk = computed(() => passwordValida(password.value, passwordRequerida.value));
const titulo = computed(() => (esNuevo.value ? (props.soloAlta ? 'Nuevo usuario' : 'Nueva cuenta') : 'Editar cuenta'));

const ayudaRol = computed(() => {
  if (props.rolesAsignables.length === 1 && props.rolesAsignables[0] === 'usuario') {
    return 'Con tu rol solo puedes crear usuarios operativos.';
  }
  if (props.rolesAsignables.includes('jefe') && !props.rolesAsignables.includes('admin')) {
    return 'Puedes asignar rol Jefe o Usuario.';
  }
  return 'Elige el nivel de acceso al sistema.';
});

async function elegirFoto(file: File | null) {
  if (!file) return;
  try {
    fotoUrl.value = await prepararFotoPerfil(file);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'No se pudo cargar la imagen.');
  }
}

async function enviar(e: Event) {
  e.preventDefault();
  touched.value = { usuario: true, password: passwordRequerida.value, rol: true };
  if (!usuarioOk.value || !passwordOk.value || !props.rolesAsignables.includes(rol.value)) return;

  if (esNuevo.value) {
    emit(
      'guardar',
      {
        usuario: usuario.value.trim(),
        password: password.value,
        rol: rol.value,
        fotoUrl: fotoUrl.value,
      },
      true,
    );
  } else {
    const dto: ActualizarUsuarioDto = {};
    if (usuario.value.trim() !== props.cuenta!.usuario) dto.usuario = usuario.value.trim();
    if (cambioPasswordAbierto.value && password.value) dto.password = password.value;
    if (rol.value !== props.cuenta!.rol) dto.rol = rol.value;
    if (fotoUrl.value !== fotoInicial.value) dto.fotoUrl = fotoUrl.value;
    if (activo.value !== activoInicial.value) dto.activo = activo.value;
    if (Object.keys(dto).length === 0) return;
    emit('guardar', dto, false);
  }
}

const claseUsuario = computed(
  () =>
    `form-control form-control--status-external ${claseValidacion(usuarioOk.value, !usuarioOk.value, !!touched.value.usuario, !!touched.value.usuario)}`,
);
const clasePassword = computed(
  () =>
    `form-control form-control--status-external ${claseValidacion(passwordOk.value, !passwordOk.value, !!touched.value.password, !!touched.value.password)}`,
);
</script>

<template>
  <div class="panel reveal-in">
    <div class="panel-head">
      <h2 class="panel-title">{{ titulo }}</h2>
    </div>
    <form class="panel-body" novalidate @submit="enviar">
      <div class="mb-4">
        <span class="form-label d-block">Foto de perfil</span>
        <div class="perfil-foto">
          <div class="perfil-foto__preview" aria-hidden="true">
            <img v-if="fotoUrl" :src="fotoUrl" alt="" />
            <span v-else>{{ iniciales(usuario || 'U') }}</span>
          </div>
          <div class="perfil-foto__actions">
            <label class="btn btn-secondary btn-sm mb-0">
              Subir foto
              <input
                type="file"
                accept="image/*"
                class="visually-hidden"
                :disabled="guardando"
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
              v-if="fotoUrl"
              type="button"
              class="btn btn-link btn-sm p-0 text-secondary"
              :disabled="guardando"
              @click="fotoUrl = ''"
            >
              Quitar foto
            </button>
            <small class="text-secondary">Cualquier foto · se enmarca el rostro</small>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label for="cuenta-usuario">Usuario de acceso</label>
        <FormFieldStatus
          :estado="estadoCampo(usuarioOk, !!touched.usuario, usuario)"
          :mostrar="!!touched.usuario && usuario !== ''"
        >
          <input
            id="cuenta-usuario"
            v-model="usuario"
            type="text"
            :class="claseUsuario"
            autocomplete="off"
            spellcheck="false"
            :disabled="guardando"
            @blur="touched = { ...touched, usuario: true }"
          />
        </FormFieldStatus>
        <small class="text-secondary">Letras, números, punto, guion y guion bajo. Mínimo 3 caracteres.</small>
      </div>

      <div v-if="esNuevo" class="mb-3">
        <label for="cuenta-password">Contraseña</label>
        <FormFieldStatus
          :estado="estadoCampo(passwordOk, !!touched.password, password)"
          :mostrar="!!touched.password && password !== ''"
        >
          <div class="form-secret-wrap">
            <input
              id="cuenta-password"
              v-model="password"
              :type="mostrarPassword ? 'text' : 'password'"
              :class="clasePassword"
              autocomplete="new-password"
              :disabled="guardando"
              @blur="touched = { ...touched, password: true }"
            />
            <PasswordRevealButton
              :visible="mostrarPassword"
              class-name="form-secret-wrap__reveal"
              @toggle="mostrarPassword = !mostrarPassword"
            />
          </div>
        </FormFieldStatus>
      </div>
      <div v-else class="mb-3">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          :disabled="guardando"
          @click="
            cambioPasswordAbierto = !cambioPasswordAbierto;
            if (!cambioPasswordAbierto) {
              password = '';
              touched = { ...touched, password: false };
            }
          "
        >
          {{ cambioPasswordAbierto ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña' }}
        </button>
        <div v-if="cambioPasswordAbierto" class="cuenta-password-panel">
          <label for="cuenta-password">Nueva contraseña</label>
          <FormFieldStatus
            :estado="estadoCampo(passwordOk, !!touched.password, password)"
            :mostrar="!!touched.password && password !== ''"
          >
            <div class="form-secret-wrap">
              <input
                id="cuenta-password"
                v-model="password"
                :type="mostrarPassword ? 'text' : 'password'"
                :class="clasePassword"
                autocomplete="new-password"
                :disabled="guardando"
                @blur="touched = { ...touched, password: true }"
              />
              <PasswordRevealButton
                :visible="mostrarPassword"
                class-name="form-secret-wrap__reveal"
                @toggle="mostrarPassword = !mostrarPassword"
              />
            </div>
          </FormFieldStatus>
          <small class="text-secondary">Mínimo 8 caracteres.</small>
        </div>
      </div>

      <div class="mb-4">
        <label for="cuenta-rol">Rol en el sistema</label>
        <FormSelect
          id="cuenta-rol"
          v-model="rol"
          :disabled="guardando || rolesAsignables.length <= 1"
        >
          <option v-for="r in rolesAsignables" :key="r" :value="r">{{ etiquetaRol(r) }}</option>
        </FormSelect>
        <small class="text-secondary">{{ ayudaRol }}</small>
      </div>

      <div v-if="!esNuevo" class="form-check form-switch mb-4">
        <input
          id="cuenta-activo"
          v-model="activo"
          class="form-check-input"
          type="checkbox"
          role="switch"
          :disabled="guardando || esSesionActual"
        />
        <label class="form-check-label" for="cuenta-activo">
          {{ activo ? 'Usuario habilitado' : 'Usuario deshabilitado' }}
        </label>
        <small v-if="esSesionActual" class="d-block text-secondary">
          No puedes deshabilitar tu propia cuenta.
        </small>
        <small v-else class="d-block text-secondary">
          Si lo deshabilitas, no podrá iniciar sesión ni usar el sistema.
        </small>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="guardando || !usuarioOk || !passwordOk || !rolesAsignables.includes(rol)"
        >
          {{ guardando ? 'Guardando…' : esNuevo ? 'Crear cuenta' : 'Guardar cambios' }}
        </button>
        <button
          v-if="!esNuevo"
          type="button"
          class="btn btn-outline-secondary"
          :disabled="guardando"
          @click="emit('cancelar')"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>
