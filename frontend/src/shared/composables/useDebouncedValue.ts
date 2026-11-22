import { ref, watch, type Ref } from 'vue';

export function useDebouncedValue<T>(valor: Ref<T>, ms: number): Ref<T> {
  const debounced = ref(valor.value) as Ref<T>;
  let id: number | undefined;

  watch(
    valor,
    (v) => {
      if (id !== undefined) window.clearTimeout(id);
      id = window.setTimeout(() => {
        debounced.value = v;
      }, ms);
    },
    { deep: true },
  );

  return debounced;
}
