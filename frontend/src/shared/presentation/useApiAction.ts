import { ApiError } from '../infrastructure/http/apiClient';
import { useToast } from '../../core/notifications/useToast';

/** Envuelve una promesa de API y muestra el error en un toast. */
export function useApiAction() {
  const toast = useToast();

  return async <T>(accion: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await accion();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error('Error inesperado.');
      return undefined;
    }
  };
}
