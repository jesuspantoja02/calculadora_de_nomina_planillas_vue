import type { ConfiguracionService } from '../../configuracion/application/configuracion.service.ts';
import type { EmpleadoService } from '../../empleados/application/empleado.service.ts';
import type { TokenPayload } from '../../../shared/security/token.ts';
import { construirPromptSistema } from '../domain/conocimiento-sistema.ts';
import {
  completarConLlm,
  proveedorDesdeOpciones,
  type MensajeLlm,
  type OpcionesLlm,
  type ProveedorActivo,
} from '../infrastructure/llm-cliente.ts';
import { responderLocal } from './asistente-local.ts';
import type { chatAsistenteSchema } from './asistente.dto.ts';
import type { z } from 'zod';

export class AsistenteService {
  #configuracion: ConfiguracionService;
  #empleados: EmpleadoService;
  #llm: OpcionesLlm;

  constructor(configuracion: ConfiguracionService, empleados: EmpleadoService, llm: OpcionesLlm) {
    this.#configuracion = configuracion;
    this.#empleados = empleados;
    this.#llm = llm;
  }

  estado(): { proveedor: ProveedorActivo; listo: boolean } {
    const proveedor = proveedorDesdeOpciones(this.#llm);
    return { proveedor, listo: true };
  }

  async chatear(
    _actor: TokenPayload,
    body: z.infer<typeof chatAsistenteSchema>,
  ): Promise<{ respuesta: string; proveedor: ProveedorActivo }> {
    const contexto = await this.#contextoVivo();
    const system = construirPromptSistema(contexto);

    const historial: MensajeLlm[] = [
      ...body.historial.map((m) => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as MensajeLlm['role'],
        text: m.content,
      })),
      { role: 'user', text: body.mensaje },
    ];

    const proveedor = proveedorDesdeOpciones(this.#llm);
    if (proveedor === 'local') {
      return { respuesta: responderLocal(historial, contexto), proveedor: 'local' };
    }

    try {
      const { texto, proveedor: usado } = await completarConLlm(system, historial, this.#llm);
      return { respuesta: texto, proveedor: usado };
    } catch (error) {
      console.error('[asistente] fallback local tras error de proveedor', error);
      const aviso =
        '_(El proveedor en la nube falló; respondo con el asistente local.)_\n\n';
      return { respuesta: aviso + responderLocal(historial, contexto), proveedor: 'local' };
    }
  }

  async #contextoVivo(): Promise<string> {
    try {
      const [config, empleados] = await Promise.all([
        this.#configuracion.obtener(),
        this.#empleados.listar({}),
      ]);

      const lineasAfp = Object.entries(config.tasasAfp)
        .map(
          ([nombre, t]) =>
            `${nombre}: aporte ${t.aporteAfpPct}%, prima ${t.primaSeguroPct}%, comisión flujo ${t.comisionFlujoPct}% (${t.tipoComisionAfp})`,
        )
        .join(' · ');

      return [
        `Empresa: ${config.empresaNombre} (RUC ${config.empresaRuc || '—'}).`,
        `Empleados registrados: ${empleados.length}.`,
        `RMV: S/ ${config.rmv}. UIT: S/ ${config.uit}.`,
        `ONP: ${config.tasaOnp}%. EsSalud: ${config.tasaEssalud}%.`,
        `Remuneración máxima asegurable: S/ ${config.remuneracionMaximaAsegurable}.`,
        `Adelanto quincenal: ${config.adelantoQuincenalPct}%. Quinta activa: ${config.aplicarQuintaCategoria ? 'sí' : 'no'}.`,
        `Tasas AFP: ${lineasAfp}.`,
      ].join('\n');
    } catch (error) {
      console.error('[asistente] contexto vivo no disponible', error);
      return 'No se pudieron cargar los datos vivos de la instalación en este momento.';
    }
  }
}
