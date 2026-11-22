<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { container } from '../../composition/container';
import { CNJ_ESLOGAN, CNJ_LOGO_URL, CNJ_NOMBRE, CNJ_PANEL_HERO_URL } from '../../config/empresaBranding';

const cargando = ref(true);
const nombre = ref(CNJ_NOMBRE);
const eslogan = ref(CNJ_ESLOGAN);
const logoUrl = ref(CNJ_LOGO_URL);

onMounted(() => {
  void container.configuracion
    .obtener()
    .then((c) => {
      nombre.value = c.empresaNombre?.trim() || CNJ_NOMBRE;
      eslogan.value = c.empresaEslogan?.trim() || CNJ_ESLOGAN;
      logoUrl.value = c.empresaLogoUrl?.trim() || CNJ_LOGO_URL;
    })
    .catch(() => {
      /* valores CNJ por defecto */
    })
    .finally(() => {
      cargando.value = false;
    });
});
</script>

<template>
  <section
    class="welcome-panel no-print"
    aria-labelledby="welcome-panel-title"
    :style="{ backgroundImage: `url(${CNJ_PANEL_HERO_URL})` }"
  >
    <div class="welcome-panel__overlay" aria-hidden="true" />
    <div class="welcome-panel__content">
      <p v-if="cargando" class="welcome-panel__loading">Cargando…</p>
      <template v-else>
        <div class="welcome-panel__logo-wrap">
          <img class="welcome-panel__logo" :src="logoUrl" :alt="`Logo de ${nombre}`" width="128" height="128" />
        </div>
        <h1 class="welcome-panel__nombre" id="welcome-panel-title">{{ nombre }}</h1>
        <p class="welcome-panel__eslogan">{{ eslogan }}</p>
        <p class="welcome-panel__guia">Selecciona una opción del menú lateral para comenzar.</p>
      </template>
    </div>
  </section>
</template>
