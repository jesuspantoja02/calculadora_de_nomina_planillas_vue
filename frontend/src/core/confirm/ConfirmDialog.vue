<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import Icon from '../../shared/ui/Icon.vue';
import { useConfirm } from './useConfirm';

const { actual, responder } = useConfirm();
const abierto = computed(() => actual.value != null);

const icono = computed(() => {
  const v = actual.value?.variante ?? 'peligro';
  if (v === 'aviso') return 'alert';
  if (v === 'neutro') return 'check';
  return 'trash';
});

function onKeydown(e: KeyboardEvent) {
  if (!abierto.value) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    responder(false);
  }
}

watch(abierto, (v) => {
  document.body.style.overflow = v ? 'hidden' : '';
});

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="actual"
        class="confirm-backdrop no-print"
        role="presentation"
        @click.self="responder(false)"
      >
        <div
          class="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="'confirm-title'"
          :aria-describedby="'confirm-desc'"
          @click.stop
        >
          <div class="confirm-dialog__icon" :class="`confirm-dialog__icon--${actual.variante}`">
            <Icon :nombre="icono" :tamano="22" />
          </div>

          <div class="confirm-dialog__body">
            <h2 id="confirm-title" class="confirm-dialog__title">{{ actual.titulo }}</h2>
            <p id="confirm-desc" class="confirm-dialog__mensaje">{{ actual.mensaje }}</p>
            <p v-if="actual.detalle" class="confirm-dialog__detalle">{{ actual.detalle }}</p>
          </div>

          <div class="confirm-dialog__actions">
            <button type="button" class="btn btn-outline-secondary" @click="responder(false)">
              {{ actual.cancelarTexto }}
            </button>
            <button
              type="button"
              class="btn"
              :class="actual.variante === 'peligro' ? 'btn-danger-solid' : 'btn-primary'"
              autofocus
              @click="responder(true)"
            >
              {{ actual.confirmarTexto }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
