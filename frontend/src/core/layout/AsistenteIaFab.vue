<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { chatAsistenteApi, fetchEstadoAsistente, type MensajeChat } from '../asistente/asistenteApi';
import { ApiError } from '../../shared/infrastructure/http/apiClient';
import Icon from '../../shared/ui/Icon.vue';
import { asistenteAbierto, perfilAbierto } from './paneles-laterales';

const SUGERENCIAS = [
  '¿Cómo se calcula la quinta categoría?',
  '¿Qué descuentos aplica la AFP?',
  '¿Dónde configuro las tasas AFP?',
  '¿Cómo genero una boleta de pago?',
  '¿Qué es la asignación familiar?',
  '¿Cuál es la diferencia entre AFP y ONP?',
] as const;

const borrador = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const cuerpoRef = ref<HTMLElement | null>(null);
const mensajes = ref<MensajeChat[]>([]);
const pensando = ref(false);
const errorEnvio = ref('');
const proveedor = ref<string>('local');
const saludoInicial =
  'Hola. Pregúntame sobre planillas, AFP, ONP, quinta, empleados, boletas o cómo usar el sistema.';

const abierto = asistenteAbierto;
const fabVisible = computed(() => !perfilAbierto.value && !abierto.value);
const puedeEnviar = computed(() => borrador.value.trim().length > 0 && !pensando.value);
const mostrarSugerencias = computed(
  () => !pensando.value && mensajes.value.length <= 1 && !errorEnvio.value,
);

const etiquetaProveedor = computed(() => {
  switch (proveedor.value) {
    case 'gemini':
      return 'Gemini';
    case 'openai':
      return 'OpenAI';
    case 'ollama':
      return 'Ollama';
    default:
      return 'Asistente local';
  }
});

watch(abierto, async (v) => {
  if (!v) return;
  await nextTick();
  inputRef.value?.focus();
  if (mensajes.value.length === 0) {
    mensajes.value = [{ role: 'assistant', content: saludoInicial }];
  }
  try {
    const estado = await fetchEstadoAsistente();
    proveedor.value = estado.proveedor;
  } catch {
    /* el chat igual funciona al enviar */
  }
  await scrollAlFinal();
});

async function scrollAlFinal() {
  await nextTick();
  const el = cuerpoRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function cerrar() {
  abierto.value = false;
}

function abrir() {
  abierto.value = true;
}

function onTecla(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void enviar();
  }
}

function usarSugerencia(texto: string) {
  borrador.value = texto;
  void enviar();
}

/** Solo turnos reales de conversación (sin el saludo inicial). */
function historialParaApi(): MensajeChat[] {
  return mensajes.value.filter((m) => !(m.role === 'assistant' && m.content === saludoInicial));
}

async function enviar(e?: Event) {
  e?.preventDefault();
  const texto = borrador.value.trim();
  if (!texto || pensando.value) return;

  errorEnvio.value = '';
  const historial = historialParaApi();
  mensajes.value = [...mensajes.value, { role: 'user', content: texto }];
  borrador.value = '';
  pensando.value = true;
  await scrollAlFinal();

  try {
    const data = await chatAsistenteApi(texto, historial);
    proveedor.value = data.proveedor;
    mensajes.value = [...mensajes.value, { role: 'assistant', content: data.respuesta }];
  } catch (err) {
    const msg =
      err instanceof ApiError
        ? err.message
        : 'No se pudo obtener respuesta. ¿Está encendido el backend?';
    errorEnvio.value = msg;
    mensajes.value = [
      ...mensajes.value,
      {
        role: 'assistant',
        content: `No pude responder ahora: ${msg}\n\nPrueba de nuevo en unos segundos o elige una sugerencia.`,
      },
    ];
  } finally {
    pensando.value = false;
    await scrollAlFinal();
    inputRef.value?.focus();
  }
}

/** Render mínimo de negritas **texto** y saltos de línea. */
function bloques(texto: string): Array<{ tipo: 'p'; html: string }> {
  const escapar = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const conNegrita = (s: string) =>
    escapar(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return texto.split(/\n+/).filter(Boolean).map((linea) => ({ tipo: 'p' as const, html: conNegrita(linea) }));
}
</script>

<template>
  <div class="asistente-ia no-print">
    <div
      class="asistente-ia__backdrop"
      :class="{ 'asistente-ia__backdrop--open': abierto }"
      role="presentation"
      @click="cerrar"
    />

    <aside
      class="asistente-ia__panel"
      :class="{ 'asistente-ia__panel--open': abierto }"
      :aria-hidden="!abierto"
      aria-label="Asistente de consultas"
    >
      <header class="asistente-ia__head">
        <div class="asistente-ia__head-text">
          <h2 class="asistente-ia__title">Asistente</h2>
          <p class="asistente-ia__subtitle">{{ etiquetaProveedor }} · consultas del sistema</p>
        </div>
        <button type="button" class="asistente-ia__close" aria-label="Cerrar asistente" @click="cerrar">
          <Icon nombre="x" :tamano="20" />
        </button>
      </header>

      <div ref="cuerpoRef" class="asistente-ia__body" role="log" aria-live="polite">
        <div
          v-for="(m, i) in mensajes"
          :key="i"
          class="asistente-ia__msg"
          :class="m.role === 'user' ? 'asistente-ia__msg--user' : 'asistente-ia__msg--bot'"
        >
          <p v-for="(b, j) in bloques(m.content)" :key="j" v-html="b.html" />
        </div>
        <div v-if="pensando" class="asistente-ia__msg asistente-ia__msg--bot asistente-ia__msg--typing">
          <span class="asistente-ia__dots" aria-label="Escribiendo">
            <i /><i /><i />
          </span>
        </div>

        <div v-if="mostrarSugerencias" class="asistente-ia__sugerencias">
          <p class="asistente-ia__sugerencias-label">Sugerencias</p>
          <div class="asistente-ia__chips">
            <button
              v-for="s in SUGERENCIAS"
              :key="s"
              type="button"
              class="asistente-ia__chip"
              :disabled="pensando"
              @click="usarSugerencia(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
      </div>

      <form class="asistente-ia__composer" @submit="enviar">
        <label class="visually-hidden" for="asistente-ia-input">Escribe tu consulta</label>
        <textarea
          id="asistente-ia-input"
          ref="inputRef"
          v-model="borrador"
          class="asistente-ia__input"
          rows="2"
          placeholder="Escribe tu pregunta… (Enter envía)"
          :disabled="pensando"
          @keydown="onTecla"
        />
        <div class="asistente-ia__composer-row">
          <p v-if="errorEnvio" class="asistente-ia__error">{{ errorEnvio }}</p>
          <button type="submit" class="btn btn-primary asistente-ia__send" :disabled="!puedeEnviar">
            {{ pensando ? '…' : 'Enviar' }}
          </button>
        </div>
      </form>
    </aside>

    <button
      v-show="fabVisible"
      type="button"
      class="asistente-ia__fab"
      aria-expanded="false"
      aria-label="Abrir asistente de consultas"
      @click="abrir"
    >
      <Icon nombre="message" :tamano="22" />
    </button>
  </div>
</template>
