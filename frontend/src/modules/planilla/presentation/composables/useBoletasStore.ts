import { ref, watch } from 'vue';
import { container } from '../../../../composition/container';
import { useToast } from '../../../../core/notifications/useToast';
import { useApiAction } from '../../../../shared/presentation/useApiAction';
import type { FiltroPagos, Pago } from '../../domain/pago.model';

const pagos = container.pagos;

export function useBoletasStore() {
  const toast = useToast();
  const run = useApiAction();

  const filtros = ref<FiltroPagos>({});
  const items = ref<Pago[]>([]);
  const cargando = ref(false);
  const seleccionada = ref<Pago | null>(null);
  const version = ref(0);

  watch(
    [filtros, version],
    (_, __, onCleanup) => {
      const ctrl = new AbortController();
      cargando.value = true;
      pagos
        .listar(filtros.value)
        .then((lista) => {
          if (ctrl.signal.aborted) return;
          items.value = lista;
          if (seleccionada.value && !lista.some((p) => p.id === seleccionada.value!.id)) {
            seleccionada.value = null;
          }
        })
        .catch(() => {
          if (!ctrl.signal.aborted) items.value = [];
        })
        .finally(() => {
          if (!ctrl.signal.aborted) cargando.value = false;
        });
      onCleanup(() => ctrl.abort());
    },
    { immediate: true, deep: true },
  );

  function filtrar(f: FiltroPagos) {
    filtros.value = f;
  }

  async function eliminar(pago: Pago) {
    const ok = await run(() => pagos.eliminar(pago.id));
    if (ok) {
      toast.exito('Boleta eliminada.');
      version.value += 1;
    }
  }

  return {
    filtros,
    items,
    cargando,
    seleccionada,
    filtrar,
    seleccionar: (p: Pago | null) => {
      seleccionada.value = p;
    },
    eliminar,
  };
}
