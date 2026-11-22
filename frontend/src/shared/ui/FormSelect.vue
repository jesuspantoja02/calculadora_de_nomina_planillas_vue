<script setup lang="ts">
import Icon from './Icon.vue';

defineProps<{
  id?: string;
  modelValue?: string;
  disabled?: boolean;
  className?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [event: Event];
}>();
</script>

<template>
  <div class="form-select-wrap">
    <select
      :id="id"
      class="form-control form-select-wrap__select"
      :class="className"
      :value="modelValue"
      :disabled="disabled"
      @change="
        (e) => {
          emit('update:modelValue', (e.target as HTMLSelectElement).value);
          emit('change', e);
        }
      "
    >
      <slot />
    </select>
    <span class="form-select-wrap__chevron" aria-hidden="true">
      <Icon nombre="chevron-down" :tamano="18" />
    </span>
  </div>
</template>
