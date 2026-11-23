<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth/useAuth';
import {
  borrarCredencialesRecordadas,
  guardarCredencialesRecordadas,
  leerCredencialesRecordadas,
} from '../auth/credencialesRecordadas';
import {
  inspeccionarCuentaApi,
  recuperarClaveAdminApi,
  type EstadoCuentaLoginApi,
} from '../auth/authApi';
import { useToast } from '../notifications/useToast';
import ThemeToggle from '../theme/ThemeToggle.vue';
import BrandLogo from '../../shared/ui/BrandLogo.vue';
import PasswordRevealButton from '../../shared/ui/PasswordRevealButton.vue';

const { isAuthenticated, login } = useAuth();
const router = useRouter();
const toast = useToast();

const recordadas = leerCredencialesRecordadas();
const usuario = ref(recordadas?.usuario ?? '');
const password = ref(recordadas?.password ?? '');
const remember = ref(recordadas != null);
const mostrarPassword = ref(false);
const error = ref('');
const loading = ref(false);
const exiting = ref(false);

const modo = ref<'login' | 'recuperar'>('login');
const inspeccion = ref<EstadoCuentaLoginApi | null>(null);
const inspeccionando = ref(false);
const codigoRecuperacion = ref('');
const passwordNueva = ref('');
const passwordNuevaConfirm = ref('');
const mostrarCodigo = ref(false);
const mostrarNueva = ref(false);
const mostrarNuevaConfirm = ref(false);
const recuperando = ref(false);
const errorRecuperacion = ref('');

const puedeRecuperarAdmin = computed(() => Boolean(inspeccion.value?.puedeRecuperarAdmin));
const cuentaAdminDetectada = computed(() => Boolean(inspeccion.value?.esAdmin));

watch(
  isAuthenticated,
  (auth) => {
    if (auth) void router.replace('/');
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = '';
});

async function onSubmit(event: Event) {
  event.preventDefault();
  error.value = '';
  loading.value = true;

  const result = await login(usuario.value, password.value);
  if (!result.ok) {
    loading.value = false;
    error.value = result.message;
    return;
  }

  if (remember.value) {
    guardarCredencialesRecordadas(usuario.value.trim(), password.value);
  } else {
    borrarCredencialesRecordadas();
  }

  exiting.value = true;
  window.setTimeout(() => {
    void router.replace('/');
  }, 320);
}

async function onOlvidoClave() {
  errorRecuperacion.value = '';
  codigoRecuperacion.value = '';
  passwordNueva.value = '';
  passwordNuevaConfirm.value = '';
  mostrarCodigo.value = false;
  mostrarNueva.value = false;
  mostrarNuevaConfirm.value = false;
  inspeccion.value = null;

  const nombre = usuario.value.trim();
  if (!nombre) {
    error.value = 'Indica tu usuario antes de recuperar el acceso.';
    return;
  }

  inspeccionando.value = true;
  modo.value = 'recuperar';
  try {
    inspeccion.value = await inspeccionarCuentaApi(nombre);
  } catch {
    inspeccion.value = null;
  } finally {
    inspeccionando.value = false;
  }
}

function volverAlLogin() {
  if (recuperando.value) return;
  modo.value = 'login';
  errorRecuperacion.value = '';
  codigoRecuperacion.value = '';
  passwordNueva.value = '';
  passwordNuevaConfirm.value = '';
}

async function onRecuperarAdmin(event?: Event) {
  event?.preventDefault();
  errorRecuperacion.value = '';

  if (!puedeRecuperarAdmin.value) {
    errorRecuperacion.value = 'Solo una cuenta administrador puede usar esta recuperación.';
    return;
  }

  const nombre = (inspeccion.value?.usuario || usuario.value).trim();
  if (!nombre) {
    errorRecuperacion.value = 'Indica tu usuario administrador.';
    return;
  }
  if (!codigoRecuperacion.value.trim()) {
    errorRecuperacion.value = 'Ingresa la clave de recuperación del sistema.';
    return;
  }
  if (passwordNueva.value.length < 8) {
    errorRecuperacion.value = 'La contraseña nueva debe tener al menos 8 caracteres.';
    return;
  }
  if (passwordNueva.value !== passwordNuevaConfirm.value) {
    errorRecuperacion.value = 'Las contraseñas nuevas no coinciden.';
    return;
  }

  recuperando.value = true;
  try {
    await recuperarClaveAdminApi(nombre, codigoRecuperacion.value, passwordNueva.value);
    usuario.value = nombre;
    password.value = passwordNueva.value;
    codigoRecuperacion.value = '';
    passwordNueva.value = '';
    passwordNuevaConfirm.value = '';
    modo.value = 'login';
    toast.exito('Contraseña de administrador actualizada. Ya puedes iniciar sesión.');
  } catch (e) {
    errorRecuperacion.value = e instanceof Error ? e.message : 'No se pudo restablecer la clave.';
  } finally {
    recuperando.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__theme no-print">
      <ThemeToggle />
    </div>
    <div class="login-page__fields" aria-hidden="true">
      <div class="login-page__field-block login-page__field-block--a" />
      <div class="login-page__field-block login-page__field-block--b" />
      <div class="login-page__field-block login-page__field-block--c" />
    </div>

    <div class="login-page__grid">
      <section
        class="login-page__card login-reveal login-reveal--1"
        :aria-labelledby="modo === 'login' ? 'login-heading' : 'recuperar-titulo'"
      >
        <template v-if="modo === 'login'">
          <div class="login-page__card-head">
            <BrandLogo :size="40" variant="mark" />
            <div>
              <h2 id="login-heading">Iniciar sesión</h2>
              <p>Ingresa tu usuario y contraseña del sistema.</p>
            </div>
          </div>

          <form novalidate @submit="onSubmit">
            <div class="login-page__error" role="alert" :data-hidden="error ? 'false' : 'true'">
              {{ error || ' ' }}
            </div>

            <div class="login-page__field login-reveal login-reveal--2">
              <label for="login-usuario">Usuario</label>
              <div class="login-page__input-wrap">
                <input
                  id="login-usuario"
                  v-model="usuario"
                  type="text"
                  name="usuario"
                  autocomplete="username"
                  required
                  placeholder="Tu usuario"
                />
                <span class="login-page__input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>
            </div>

            <div class="login-page__field login-reveal login-reveal--3">
              <label for="login-password">Contraseña</label>
              <div class="login-page__input-wrap login-page__input-wrap--secret">
                <input
                  id="login-password"
                  v-model="password"
                  :type="mostrarPassword ? 'text' : 'password'"
                  name="password"
                  autocomplete="current-password"
                  required
                  minlength="6"
                  placeholder="••••••••"
                />
                <span class="login-page__input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <PasswordRevealButton
                  :visible="mostrarPassword"
                  class-name="login-page__reveal"
                  @toggle="mostrarPassword = !mostrarPassword"
                />
              </div>
            </div>

            <div class="login-page__row login-reveal login-reveal--4">
              <label class="login-page__remember">
                <input v-model="remember" type="checkbox" />
                Recordarme
              </label>
              <button type="button" class="login-page__link" @click="onOlvidoClave">
                ¿Olvidaste tu clave?
              </button>
            </div>

            <button
              type="submit"
              class="login-page__submit login-reveal login-reveal--5"
              :class="{ 'login-page__submit--exit': exiting }"
              :disabled="loading"
            >
              <template v-if="loading">
                <span class="login-page__spinner" aria-hidden="true" />
                Verificando…
              </template>
              <template v-else>Entrar al panel</template>
            </button>
          </form>
        </template>

        <template v-else>
          <div class="login-page__recovery-panel">
            <h2 id="recuperar-titulo" class="login-page__recovery-title">Recuperar acceso admin</h2>
            <p class="login-page__recovery-subtitle">
              <template v-if="inspeccionando">Verificando la cuenta…</template>
              <template v-else-if="puedeRecuperarAdmin">
                Cuenta detectada como administrador. Confirma con la clave de recuperación del servidor.
              </template>
              <template v-else>
                Esta recuperación solo está disponible para cuentas administrador.
              </template>
            </p>

            <div v-if="puedeRecuperarAdmin" class="login-page__recovery-badge" role="status">
              Cuenta: <strong>{{ inspeccion?.usuario }}</strong> · Administrador
            </div>

            <div
              v-if="!inspeccionando && !puedeRecuperarAdmin"
              class="login-page__recovery-blocked"
              role="status"
            >
              <template v-if="cuentaAdminDetectada">
                La recuperación de administrador no está configurada en el servidor.
              </template>
              <template v-else>
                Si olvidaste tu clave, pide a un administrador que te asigne una nueva desde Usuarios.
              </template>
            </div>

            <template v-if="puedeRecuperarAdmin">
              <div
                class="login-page__error login-page__error--recovery"
                role="alert"
                :data-hidden="errorRecuperacion ? 'false' : 'true'"
              >
                {{ errorRecuperacion || ' ' }}
              </div>

              <div class="login-page__field">
                <label for="login-codigo-recuperacion">Clave de recuperación del sistema</label>
                <div class="login-page__input-wrap login-page__input-wrap--secret">
                  <input
                    id="login-codigo-recuperacion"
                    v-model="codigoRecuperacion"
                    :type="mostrarCodigo ? 'text' : 'password'"
                    name="codigoRecuperacion"
                    autocomplete="off"
                    required
                    placeholder="ADMIN_RECOVERY_KEY"
                  />
                  <span class="login-page__input-icon" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
                      />
                      <circle cx="16.5" cy="7.5" r="0.5" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                  <PasswordRevealButton
                    :visible="mostrarCodigo"
                    class-name="login-page__reveal"
                    @toggle="mostrarCodigo = !mostrarCodigo"
                  />
                </div>
              </div>

              <div class="login-page__field">
                <label for="login-password-nueva">Nueva contraseña</label>
                <div class="login-page__input-wrap login-page__input-wrap--secret">
                  <input
                    id="login-password-nueva"
                    v-model="passwordNueva"
                    :type="mostrarNueva ? 'text' : 'password'"
                    name="passwordNueva"
                    autocomplete="new-password"
                    required
                    minlength="8"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <span class="login-page__input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <PasswordRevealButton
                    :visible="mostrarNueva"
                    class-name="login-page__reveal"
                    @toggle="mostrarNueva = !mostrarNueva"
                  />
                </div>
              </div>

              <div class="login-page__field">
                <label for="login-password-nueva-confirm">Confirmar nueva contraseña</label>
                <div class="login-page__input-wrap login-page__input-wrap--secret">
                  <input
                    id="login-password-nueva-confirm"
                    v-model="passwordNuevaConfirm"
                    :type="mostrarNuevaConfirm ? 'text' : 'password'"
                    name="passwordNuevaConfirm"
                    autocomplete="new-password"
                    required
                    minlength="8"
                    placeholder="Repite la nueva contraseña"
                    @keydown.enter.prevent="onRecuperarAdmin"
                  />
                  <span class="login-page__input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <PasswordRevealButton
                    :visible="mostrarNuevaConfirm"
                    class-name="login-page__reveal"
                    @toggle="mostrarNuevaConfirm = !mostrarNuevaConfirm"
                  />
                </div>
              </div>

              <button
                type="button"
                class="login-page__submit login-page__submit--recovery"
                :disabled="recuperando"
                @click="onRecuperarAdmin"
              >
                <template v-if="recuperando">
                  <span class="login-page__spinner" aria-hidden="true" />
                  Guardando…
                </template>
                <template v-else>Restablecer contraseña admin</template>
              </button>
            </template>

            <button type="button" class="login-page__recovery-back" @click="volverAlLogin">
              Volver al inicio de sesión
            </button>
          </div>
        </template>
      </section>

      <header class="login-page__hero login-reveal login-reveal--2">
        <div class="login-page__hero-logo">
          <BrandLogo :size="48" variant="mark" />
        </div>
        <h1 class="login-page__title">Nómina con precisión, lista para operar</h1>
        <p class="login-page__lead">
          Empleados, planilla y boletas con reglas laborales peruanas — AFP, ONP y quinta — en un solo panel.
        </p>
        <div class="login-page__stats">
          <div class="login-page__stat">
            <strong>AFP · ONP</strong>
            <span>Aportes al día</span>
          </div>
          <div class="login-page__stat">
            <strong>Quinta</strong>
            <span>Retenciones</span>
          </div>
          <div class="login-page__stat">
            <strong>Boletas</strong>
            <span>PDF listo</span>
          </div>
        </div>
      </header>
    </div>
  </div>
</template>
