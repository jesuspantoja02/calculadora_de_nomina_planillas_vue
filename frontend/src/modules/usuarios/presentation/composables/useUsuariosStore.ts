import { ref, watch } from 'vue';
import { container } from '../../../../composition/container';
import { useToast } from '../../../../core/notifications/useToast';
import type { RolUsuario } from '../../../../core/auth/roles';
import { useApiAction } from '../../../../shared/presentation/useApiAction';
import type { ActualizarUsuarioDto, UsuarioCuenta, UsuarioCuentaDto } from '../../domain/usuario.model';

const usuarios = container.usuarios;

export function useUsuariosStore(esAdministrador: boolean) {
  const toast = useToast();
  const run = useApiAction();

  const items = ref<UsuarioCuenta[]>([]);
  const rolesAsignables = ref<RolUsuario[]>([]);
  const cargando = ref(false);
  const guardando = ref(false);
  const editando = ref<UsuarioCuenta | null>(null);
  const version = ref(0);

  watch(
    [version, () => esAdministrador],
    (_, __, onCleanup) => {
      const ctrl = new AbortController();
      const mostrarCarga = items.value.length === 0;
      if (mostrarCarga) cargando.value = true;

      const promesa = esAdministrador
        ? Promise.all([usuarios.listar(), usuarios.rolesAsignables()])
        : usuarios.rolesAsignables().then((roles) => [[], roles] as [UsuarioCuenta[], RolUsuario[]]);

      promesa
        .then(([lista, roles]) => {
          if (!ctrl.signal.aborted) {
            items.value = lista;
            rolesAsignables.value = roles;
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
    { immediate: true },
  );

  function refrescar() {
    version.value += 1;
  }

  async function guardar(dto: UsuarioCuentaDto | ActualizarUsuarioDto, esNuevo: boolean) {
    guardando.value = true;
    const actual = editando.value;
    const accion = esNuevo
      ? () => usuarios.crear(dto as UsuarioCuentaDto)
      : () => usuarios.actualizar(actual!.id, dto as ActualizarUsuarioDto);
    const u = await run(accion);
    guardando.value = false;
    if (u) {
      toast.exito(esNuevo ? `Cuenta «${u.usuario}» creada.` : `Cuenta «${u.usuario}» actualizada.`);
      editando.value = null;
      refrescar();
    }
    return u;
  }

  async function eliminar(cuenta: UsuarioCuenta) {
    const ok = await run(() => usuarios.eliminar(cuenta.id));
    if (ok) {
      toast.exito('Cuenta eliminada.');
      if (editando.value?.id === cuenta.id) editando.value = null;
      refrescar();
    }
  }

  async function liberarBloqueo(cuenta: UsuarioCuenta) {
    const u = await run(() => usuarios.liberarBloqueo(cuenta.id));
    if (u) {
      toast.exito(`Cuenta «${u.usuario}» liberada. Ya puede iniciar sesión.`);
      refrescar();
    }
  }

  return {
    items,
    rolesAsignables,
    cargando,
    guardando,
    editando,
    editar: (u: UsuarioCuenta | null) => {
      editando.value = u;
    },
    guardar,
    eliminar,
    liberarBloqueo,
  };
}
