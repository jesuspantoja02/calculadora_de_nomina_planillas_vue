import { apiGet, apiPost } from '../../shared/infrastructure/http/apiClient';

export type RolChat = 'user' | 'assistant';

export interface MensajeChat {
  role: RolChat;
  content: string;
}

export interface EstadoAsistente {
  proveedor: 'gemini' | 'openai' | 'ollama' | 'local';
  listo: boolean;
}

export interface RespuestaChat {
  respuesta: string;
  proveedor: EstadoAsistente['proveedor'];
}

export function fetchEstadoAsistente(): Promise<EstadoAsistente> {
  return apiGet<EstadoAsistente>('/asistente/estado');
}

export function chatAsistenteApi(mensaje: string, historial: MensajeChat[]): Promise<RespuestaChat> {
  return apiPost<RespuestaChat>('/asistente/chat', { mensaje, historial });
}
