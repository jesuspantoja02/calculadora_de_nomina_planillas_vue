import type { AfpEntidad } from '../../../shared/models/tipos';

export type TipoComisionAfp = 'flujo' | 'saldo';

export interface TasasAfpEntidad {
  aporteAfpPct: number;
  primaSeguroPct: number;
  comisionFlujoPct: number;
  comisionSaldoPct: number;
  tipoComisionAfp: TipoComisionAfp;
}

export interface Configuracion {
  aporteAfpPct: number;
  primaSeguroPct: number;
  comisionFlujoPct: number;
  tipoComisionAfp: TipoComisionAfp;
  tasasAfp: Record<AfpEntidad, TasasAfpEntidad>;
  remuneracionMaximaAsegurable: number;
  tasaOnp: number;
  tasaEssalud: number;
  rmv: number;
  uit: number;
  adelantoQuincenalPct: number;
  aplicarQuintaCategoria: boolean;
  empresaNombre: string;
  empresaRuc: string;
  empresaEslogan: string;
  empresaLogoUrl: string;
}
