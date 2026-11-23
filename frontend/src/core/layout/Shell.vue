<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '../../shared/ui/Icon.vue';
import AsistenteIaFab from './AsistenteIaFab.vue';
import WelcomePanel from './WelcomePanel.vue';
import Sidebar from './Sidebar.vue';

const menuAbierto = ref(false);
const route = useRoute();
const enCartilla = computed(() => route.path === '/');

function cerrarMenu() {
  menuAbierto.value = false;
}

function abrirMenu() {
  menuAbierto.value = true;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && menuAbierto.value) {
    cerrarMenu();
  }
}

watch(
  () => route.fullPath,
  () => {
    cerrarMenu();
  },
);

watch(menuAbierto, (abierto) => {
  document.body.classList.toggle('nav-drawer-open', abierto);
});

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.classList.remove('nav-drawer-open');
});
</script>

<template>
  <div class="shell">
    <button
      type="button"
      class="menu-btn no-print"
      :aria-expanded="menuAbierto"
      aria-controls="app-sidebar"
      aria-label="Abrir menú"
      @click="abrirMenu"
    >
      <Icon nombre="menu" :tamano="20" />
    </button>
    <div
      class="sidebar-backdrop no-print"
      :class="{ abierto: menuAbierto }"
      role="presentation"
      @click="cerrarMenu"
    />

    <Sidebar id="app-sidebar" :abierto="menuAbierto" @navegar="cerrarMenu" />

    <main class="main" :class="{ 'main--cartilla': enCartilla }">
      <WelcomePanel v-if="enCartilla" />
      <div v-else class="view">
        <RouterView />
      </div>
    </main>

    <AsistenteIaFab />
  </div>
</template>
