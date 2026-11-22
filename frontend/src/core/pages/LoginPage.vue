<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth/useAuth';
import {
  borrarCredencialesRecordadas,
  guardarCredencialesRecordadas,
  leerCredencialesRecordadas,
} from '../auth/credencialesRecordadas';
import ThemeToggle from '../theme/ThemeToggle.vue';
import BrandLogo from '../../shared/ui/BrandLogo.vue';
import PasswordRevealButton from '../../shared/ui/PasswordRevealButton.vue';
import '../../styles/login.css';

const { isAuthenticated, login } = useAuth();
const router = useRouter();

const recordadas = leerCredencialesRecordadas();
const usuario = ref(recordadas?.usuario ?? '');
const password = ref(recordadas?.password ?? '');
const remember = ref(recordadas != null);
const mostrarPassword = ref(false);
const error = ref('');
const loading = ref(false);
const exiting = ref(false);

watch(
  isAuthenticated,
  (auth) => {
    if (auth) void router.replace('/');
  },
  { immediate: true },
);

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
      <section class="login-page__card login-reveal login-reveal--1" aria-labelledby="login-heading">
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
            <a class="login-page__link" href="#recuperar" @click.prevent>¿Olvidaste tu clave?</a>
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
