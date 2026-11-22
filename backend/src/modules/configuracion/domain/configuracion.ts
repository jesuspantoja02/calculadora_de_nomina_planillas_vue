import { AFP_ENTIDADES, type AfpEntidad } from '../../../shared/config/catalogos.ts';

export type TipoComisionAfp = 'flujo' | 'saldo';

/** Tasas SBS por administradora (aporte, prima y comisiones). */
export interface TasasAfpEntidad {
  aporteAfpPct: number;
  primaSeguroPct: number;
  /** Comisión mensual sobre la remuneración (se descuenta en boleta si el tipo es flujo). */
  comisionFlujoPct: number;
  /** Comisión anual sobre el fondo (no se descuenta del sueldo). */
  comisionSaldoPct: number;
  /** Esquema de comisión que usa esta AFP en el cálculo de boleta. */
  tipoComisionAfp: TipoComisionAfp;
}

/**
 * Parámetros de planilla. Las tasas AFP son las publicadas por la SBS
 * (devengue octubre 2026: aporte 10 %, prima 1,37 %, comisiones por entidad).
 */
export interface Configuracion {
  /** @deprecated Preferir tasasAfp; se mantiene sincronizado con Integra. */
  aporteAfpPct: number;
  /** @deprecated Preferir tasasAfp. */
  primaSeguroPct: number;
  /** @deprecated Preferir tasasAfp. */
  comisionFlujoPct: number;
  /** @deprecated Preferir tasasAfp. */
  tipoComisionAfp: TipoComisionAfp;
  /** Tasas por AFP (Integra, Prima, Profuturo, Habitat). */
  tasasAfp: Record<AfpEntidad, TasasAfpEntidad>;
  /** Tope de remuneración asegurable (SBS, devengue octubre 2026). */
  remuneracionMaximaAsegurable: number;
  tasaOnp: number;
  /** EsSalud a cargo del empleador. La bonificación de gratificación usa esta tasa, o el 75 % si el trabajador está en EPS. */
  tasaEssalud: number;
  /** Remuneración mínima vital vigente desde el 1 de octubre de 2026 (D.S. 015-2026-TR). */
  rmv: number;
  uit: number;
  /** Política de la empresa. La ley no fija un porcentaje de adelanto. */
  adelantoQuincenalPct: number;
  aplicarQuintaCategoria: boolean;
  empresaNombre: string;
  empresaRuc: string;
  /** Eslogan mostrado en el panel de inicio (junto al logo de la empresa). */
  empresaEslogan: string;
  /** Data URL de imagen (PNG/JPEG/WebP) para el logo de la empresa. */
  empresaLogoUrl: string;
}

/** Defaults SBS · comisión flujo / saldo por AFP (ago–oct 2026). */
export const TASAS_AFP_POR_DEFECTO: Readonly<Record<AfpEntidad, TasasAfpEntidad>> = Object.freeze({
  Integra: Object.freeze({
    aporteAfpPct: 10,
    primaSeguroPct: 1.37,
    comisionFlujoPct: 1.55,
    comisionSaldoPct: 0.78,
    tipoComisionAfp: 'flujo' as TipoComisionAfp,
  }),
  Prima: Object.freeze({
    aporteAfpPct: 10,
    primaSeguroPct: 1.37,
    comisionFlujoPct: 1.6,
    comisionSaldoPct: 1.25,
    tipoComisionAfp: 'flujo' as TipoComisionAfp,
  }),
  Profuturo: Object.freeze({
    aporteAfpPct: 10,
    primaSeguroPct: 1.37,
    comisionFlujoPct: 1.69,
    comisionSaldoPct: 0.68,
    tipoComisionAfp: 'flujo' as TipoComisionAfp,
  }),
  Habitat: Object.freeze({
    aporteAfpPct: 10,
    primaSeguroPct: 1.37,
    comisionFlujoPct: 1.47,
    comisionSaldoPct: 1.25,
    tipoComisionAfp: 'flujo' as TipoComisionAfp,
  }),
});

export const CONFIG_POR_DEFECTO: Readonly<Configuracion> = Object.freeze({
  aporteAfpPct: TASAS_AFP_POR_DEFECTO.Integra.aporteAfpPct,
  primaSeguroPct: TASAS_AFP_POR_DEFECTO.Integra.primaSeguroPct,
  comisionFlujoPct: TASAS_AFP_POR_DEFECTO.Integra.comisionFlujoPct,
  tipoComisionAfp: TASAS_AFP_POR_DEFECTO.Integra.tipoComisionAfp,
  tasasAfp: TASAS_AFP_POR_DEFECTO,
  remuneracionMaximaAsegurable: 12_732.7,
  tasaOnp: 13,
  tasaEssalud: 9,
  rmv: 1230,
  uit: 5500,
  adelantoQuincenalPct: 40,
  aplicarQuintaCategoria: true,
  empresaNombre: 'CNJ ESTUDIO CONTABLE',
  empresaRuc: '20123456789',
  empresaEslogan: 'Solidez contable, confianza en cada cifra',
  empresaLogoUrl: '',
});

export function tasasAfpDe(config: Configuracion, afp: AfpEntidad | null | undefined): TasasAfpEntidad {
  const porEntidad = afp ? config.tasasAfp?.[afp] : undefined;
  if (porEntidad) return porEntidad;
  return {
    aporteAfpPct: config.aporteAfpPct,
    primaSeguroPct: config.primaSeguroPct,
    comisionFlujoPct: config.comisionFlujoPct,
    comisionSaldoPct: TASAS_AFP_POR_DEFECTO.Integra.comisionSaldoPct,
    tipoComisionAfp: config.tipoComisionAfp,
  };
}

/** Completa tasas faltantes y sincroniza campos planos con Integra. */
export function normalizarConfiguracion(parcial: Partial<Configuracion> = {}): Configuracion {
  const tasasAfp = {} as Record<AfpEntidad, TasasAfpEntidad>;
  for (const entidad of AFP_ENTIDADES) {
    tasasAfp[entidad] = {
      ...TASAS_AFP_POR_DEFECTO[entidad],
      ...(parcial.tasasAfp?.[entidad] ?? {}),
    };
  }

  const integra = tasasAfp.Integra;
  return {
    ...CONFIG_POR_DEFECTO,
    ...parcial,
    tasasAfp,
    aporteAfpPct: integra.aporteAfpPct,
    primaSeguroPct: integra.primaSeguroPct,
    comisionFlujoPct: integra.comisionFlujoPct,
    tipoComisionAfp: integra.tipoComisionAfp,
  };
}
