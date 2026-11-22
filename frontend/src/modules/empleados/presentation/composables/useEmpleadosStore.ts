import { computed, ref, watch } from 'vue';
import { container } from '../../../../composition/container';
import { useToast } from '../../../../core/notifications/useToast';
import { useApiAction } from '../../../../shared/presentation/useApiAction';
import type { Empleado, EmpleadoDto, FiltroEmpleados } from '../../domain/empleado.model';
import { filtrosEmpleadosIguales } from '../../domain/filtrosEmpleados';

const empleados = container.empleados;

export function useEmpleadosStore() {
  const toast = useToast();
  const run = useApiAction();

  const filtros = ref<FiltroEmpleados>({});
  const items = ref<Empleado[]>([]);
  const cargando = ref(false);
  const guardando = ref(false);
  const editando = ref<Empleado | null>(null);
  const version = ref(0);

  watch(
    [filtros, version],
    (_, __, onCleanup) => {
      const ctrl = new AbortController();
      const mostrarCarga = items.value.length === 0;
      if (mostrarCarga) cargando.value = true;
      empleados
        .listar(filtros.value)
        .then((lista) => {
          if (!ctrl.signal.aborted) items.value = lista;
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

  function filtrar(f: FiltroEmpleados) {
    if (!filtrosEmpleadosIguales(filtros.value, f)) {
      filtros.value = f;
    }
  }

  function refrescar() {
    version.value += 1;
  }

  async function guardar(dto: EmpleadoDto) {
    guardando.value = true;
    const actual = editando.value;
    const accion = actual ? () => empleados.actualizar(actual.id, dto) : () => empleados.crear(dto);
    const e = await run(accion);
    guardando.value = false;
    if (e) {
      toast.exito(actual ? `Empleado «${e.nombre}» actualizado.` : `Empleado «${e.nombre}» registrado.`);
      editando.value = null;
      refrescar();
    }
    return e;
  }

  async function eliminar(empleado: Empleado) {
    const ok = await run(() => empleados.eliminar(empleado.id));
    if (ok) {
      toast.exito('Empleado eliminado.');
      if (editando.value?.id === empleado.id) editando.value = null;
      refrescar();
    }
  }

  return {
    filtros,
    items,
    cargando,
    guardando,
    editando,
    filtrar,
    editar: (e: Empleado | null) => {
      editando.value = e;
    },
    guardar,
    eliminar,
    editandoId: computed(() => editando.value?.id ?? null),
  };
}
