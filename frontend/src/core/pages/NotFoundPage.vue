<script setup lang="ts">
import PageHeader from '../../shared/ui/PageHeader.vue';
</script>

<template>
  <PageHeader titulo="Página no encontrada" descripcion="La ruta que buscas no existe o fue movida (404)." />
  <RouterLink class="btn btn-primary" to="/empleados">Volver al inicio</RouterLink>
</template>
