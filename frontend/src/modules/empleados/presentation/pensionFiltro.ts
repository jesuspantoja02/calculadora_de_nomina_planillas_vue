import { AFP_ENTIDADES, type AfpEntidad, type Regimen } from '../../../shared/models/tipos';
import type { FiltroEmpleados } from '../domain/empleado.model';

/** Valor del selector unificado de sistema de pensión. */
export type PensionFiltro = '' | 'ONP' | 'AFP' | `AFP:${AfpEntidad}`;

export function pensionDesdeFiltros(regimen?: Regimen | '', afp?: AfpEntidad | ''): PensionFiltro {
  if (afp && AFP_ENTIDADES.includes(afp)) return `AFP:${afp}`;
  if (regimen === 'ONP') return 'ONP';
  if (regimen === 'AFP') return 'AFP';
  return '';
}

export function filtrosDesdePension(pension: PensionFiltro): Pick<FiltroEmpleados, 'regimen' | 'afp'> {
  if (pension === 'ONP') return { regimen: 'ONP' };
  if (pension === 'AFP') return { regimen: 'AFP' };
  if (pension.startsWith('AFP:')) {
    const entidad = pension.slice(4) as AfpEntidad;
    if (AFP_ENTIDADES.includes(entidad)) return { regimen: 'AFP', afp: entidad };
  }
  return {};
}

export function pensionInicialDesdeUrl(regimen?: string | null, afp?: string | null): PensionFiltro {
  const entidad = afp && AFP_ENTIDADES.includes(afp as AfpEntidad) ? (afp as AfpEntidad) : '';
  return pensionDesdeFiltros(regimen === 'AFP' || regimen === 'ONP' ? regimen : '', entidad);
}
