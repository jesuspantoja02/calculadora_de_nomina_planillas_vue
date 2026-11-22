<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth/useAuth';
import { esAdmin, esGestor, etiquetaRol } from '../auth/roles';
import ThemeToggle from '../theme/ThemeToggle.vue';
import BrandLogo from '../../shared/ui/BrandLogo.vue';
import Icon from '../../shared/ui/Icon.vue';
import type { NombreIcono } from '../../shared/ui/iconTypes';
import ProfileSheet from './ProfileSheet.vue';
import { perfilAbierto } from './paneles-laterales';

defineProps<{ abierto: boolean }>();
const emit = defineEmits<{ navegar: [] }>();

interface ItemNav {
  ruta: string;
  etiqueta: string;
  icono: NombreIcono;
}

const operacion: ItemNav[] = [
  { ruta: '/empleados', etiqueta: 'Empleados', icono: 'users' },
  { ruta: '/planilla/procesar-pago', etiqueta: 'Procesar pago', icono: 'wallet' },
  { ruta: '/planilla/boletas', etiqueta: 'Boletas de pago', icono: 'file' },
  { ruta: '/dashboard', etiqueta: 'Dashboard', icono: 'chart' },
];

const { logout, userEmail, rol, fotoUrl } = useAuth();
const router = useRouter();
const navFadeAbajo = ref(false);
const navScrollRef = ref<HTMLDivElement | null>(null);

/** Solo admin, jefe y gerente ven Sistema (usuarios + configuración). */
const sistema = computed(() => {
  if (!esGestor(rol.value)) return [] as ItemNav[];

  const items: ItemNav[] = [];
  if (esAdmin(rol.value)) {
    items.push({ ruta: '/usuarios', etiqueta: 'Usuarios del sistema', icono: 'shield' });
  } else {
    items.push({ ruta: '/usuarios', etiqueta: 'Agregar nuevo usuario', icono: 'user-plus' });
  }
  items.push({ ruta: '/configuracion', etiqueta: 'Configuración', icono: 'sliders' });
  return items;
});

function actualizarFade() {
  const el = navScrollRef.value;
  if (!el) return;
  const hayMas = el.scrollHeight > el.clientHeight + 2;
  const alFinal = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
  navFadeAbajo.value = hayMas && !alFinal;
}

onMounted(() => {
  void nextTick(actualizarFade);
  window.addEventListener('resize', actualizarFade);
});

onUnmounted(() => {
  window.removeEventListener('resize', actualizarFade);
});

watch(sistema, () => {
  void nextTick(actualizarFade);
});

function irInicio() {
  emit('navegar');
  void router.push('/');
}

function onNavClick() {
  emit('navegar');
}

function cerrarSesion() {
  logout();
  emit('navegar');
  void router.replace('/login');
}
</script>

<template>
  <aside class="sidebar no-print" :class="{ abierto }">
    <div class="sidebar-brand-row">
      <button
        type="button"
        class="brand brand--home"
        aria-label="Ir al inicio — Planilla Nómina Perú"
        @click="irInicio"
      >
        <BrandLogo variant="lockup" :size="40" />
      </button>
      <ThemeToggle compact />
    </div>

    <div class="sidebar-nav-wrap" :class="{ 'sidebar-nav-wrap--fade': navFadeAbajo }">
      <div ref="navScrollRef" class="sidebar-nav-scroll" @scroll="actualizarFade">
        <nav class="nav" aria-label="Navegación principal">
          <div class="nav-group">
            <p class="nav-label">Operación</p>
            <div class="nav-group__items">
              <RouterLink
                v-for="item in operacion"
                :key="item.ruta"
                :to="item.ruta"
                class="nav-item"
                active-class="active"
                @click="onNavClick"
              >
                <span class="nav-icon">
                  <Icon :nombre="item.icono" :tamano="18" />
                </span>
                <span class="nav-item__label">{{ item.etiqueta }}</span>
              </RouterLink>
            </div>
          </div>

          <template v-if="sistema.length">
            <div class="nav-divider" role="presentation" aria-hidden="true" />

            <div class="nav-group">
              <p class="nav-label">Sistema</p>
              <div class="nav-group__items">
                <RouterLink
                  v-for="item in sistema"
                  :key="item.ruta"
                  :to="item.ruta"
                  class="nav-item"
                  active-class="active"
                  @click="onNavClick"
                >
                  <span class="nav-icon">
                    <Icon :nombre="item.icono" :tamano="18" />
                  </span>
                  <span class="nav-item__label">{{ item.etiqueta }}</span>
                </RouterLink>
              </div>
            </div>
          </template>
        </nav>
      </div>
    </div>

    <div class="sidebar-divider" role="presentation" aria-hidden="true" />

    <div class="sidebar-foot">
      <button
        v-if="userEmail"
        type="button"
        class="sidebar-profile-btn"
        aria-label="Ver mi perfil"
        @click="perfilAbierto = true"
      >
        <span class="sidebar-profile-btn__avatar" aria-hidden="true">
          <img v-if="fotoUrl" :src="fotoUrl" alt="" />
          <Icon v-else nombre="user" :tamano="18" />
        </span>
        <span class="sidebar-profile-btn__meta">
          <span class="sidebar-profile-btn__name">{{ userEmail }}</span>
          <span v-if="rol" class="sidebar-role" :class="`sidebar-role--${rol}`">{{ etiquetaRol(rol) }}</span>
        </span>
      </button>
      <button type="button" class="sidebar-logout" @click="cerrarSesion">Cerrar sesión</button>
      <span class="sidebar-foot-note">Ley laboral · AFP, ONP, quinta</span>
    </div>
  </aside>

  <ProfileSheet :abierto="perfilAbierto" @cerrar="perfilAbierto = false" />
</template>
