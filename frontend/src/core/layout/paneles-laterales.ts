import { ref, watch } from 'vue';

/** Un solo panel lateral a la vez: perfil y asistente no se solapan. */
export const perfilAbierto = ref(false);
export const asistenteAbierto = ref(false);

watch(perfilAbierto, (abierto) => {
  if (abierto) asistenteAbierto.value = false;
});

watch(asistenteAbierto, (abierto) => {
  if (abierto) perfilAbierto.value = false;
});
