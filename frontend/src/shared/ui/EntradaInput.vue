<script setup lang="ts">
import { filtrarEntrada, entradaValida, type LimitesEntrada, type TipoEntrada } from '../validators/formularios';

const props = withDefaults(
  defineProps<{
    tipo: TipoEntrada;
    modelValue: string;
    limites?: LimitesEntrada;
    id?: string;
    class?: string | Record<string, boolean>;
    placeholder?: string;
    maxLength?: number;
    inputMode?: 'numeric' | 'decimal' | 'text' | 'search' | 'email' | 'tel' | 'url' | 'none';
    autoComplete?: string;
    disabled?: boolean;
    ariaLabel?: string;
    ariaInvalid?: boolean | 'true' | 'false';
    ariaDescribedby?: string;
  }>(),
  { limites: () => ({}) },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
}>();

function limpiar(raw: string) {
  return filtrarEntrada(props.tipo, raw, props.limites);
}

function onBeforeInput(event: Event) {
  const ie = event as InputEvent;
  const inputType = ie.inputType ?? '';
  if (inputType.startsWith('delete') || inputType === 'historyUndo' || inputType === 'historyRedo') return;
  if (ie.data == null) return;

  const data = ie.data.replace(/,/g, '.');
  const el = event.target as HTMLInputElement;
  let start = el.value.length;
  let end = start;
  try {
    if (el.selectionStart != null) {
      start = el.selectionStart;
      end = el.selectionEnd ?? start;
    }
  } catch {
    /* type="number" */
  }
  const next = el.value.slice(0, start) + data + el.value.slice(end);
  if (entradaValida(props.tipo, next, props.limites)) {
    if (data !== ie.data) {
      event.preventDefault();
      emit('update:modelValue', next);
    }
    return;
  }
  event.preventDefault();
  if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop') {
    emit('update:modelValue', limpiar(next));
  }
}

function onChange(e: Event) {
  const limpio = limpiar((e.target as HTMLInputElement).value);
  if (limpio !== props.modelValue) emit('update:modelValue', limpio);
}
</script>

<template>
  <input
    :id="id"
    :class="props.class"
    :value="modelValue"
    :placeholder="placeholder"
    :maxlength="maxLength"
    :inputmode="inputMode"
    :autocomplete="autoComplete"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-invalid="ariaInvalid"
    :aria-describedby="ariaDescribedby"
    @beforeinput="onBeforeInput"
    @input="onChange"
    @blur="emit('blur', $event)"
  />
</template>
