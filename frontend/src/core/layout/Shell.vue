<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '../../shared/ui/Icon.vue';
import AsistenteIaFab from './AsistenteIaFab.vue';
import WelcomePanel from './WelcomePanel.vue';
import Sidebar from './Sidebar.vue';

const menuAbierto = ref(false);
const route = useRoute();
const enCartilla = computed(() => route.path === '/');
</script>

<template>
  <div class="shell">
    <button type="button" class="menu-btn no-print" aria-label="Abrir menú" @click="menuAbierto = true">
      <Icon nombre="menu" :tamano="20" />
    </button>
    <div
      class="sidebar-backdrop no-print"
      :class="{ abierto: menuAbierto }"
      role="presentation"
      @click="menuAbierto = false"
    />

    <Sidebar :abierto="menuAbierto" @navegar="menuAbierto = false" />

    <main class="main" :class="{ 'main--cartilla': enCartilla }">
      <WelcomePanel v-if="enCartilla" />
      <div v-else class="view">
        <RouterView />
      </div>
    </main>

    <AsistenteIaFab />
  </div>
</template>
