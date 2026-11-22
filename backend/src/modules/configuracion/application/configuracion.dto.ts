import { z } from 'zod';
import { AFP_ENTIDADES } from '../../../shared/config/catalogos.ts';
import { sanitizarTexto } from '../../../shared/utils/sanitize.ts';
import { normalizarConfiguracion } from '../domain/configuracion.ts';

const soles = (max: number) => z.number().finite().min(0).max(max);
const porcentaje = z.number().finite().min(0).max(100);

const tasasAfpEntidadSchema = z.strictObject({
  aporteAfpPct: porcentaje,
  primaSeguroPct: porcentaje,
  comisionFlujoPct: porcentaje,
  comisionSaldoPct: porcentaje,
  tipoComisionAfp: z.enum(['flujo', 'saldo']),
});

const tasasAfpSchema = z.strictObject({
  Integra: tasasAfpEntidadSchema,
  Prima: tasasAfpEntidadSchema,
  Profuturo: tasasAfpEntidadSchema,
  Habitat: tasasAfpEntidadSchema,
});

export const configuracionSchema = z
  .strictObject({
    aporteAfpPct: porcentaje,
    primaSeguroPct: porcentaje,
    comisionFlujoPct: porcentaje,
    tipoComisionAfp: z.enum(['flujo', 'saldo']),
    tasasAfp: tasasAfpSchema,
    remuneracionMaximaAsegurable: soles(1_000_000),
    tasaOnp: porcentaje,
    tasaEssalud: porcentaje,
    rmv: soles(100_000),
    uit: z.number().finite().positive().max(100_000),
    adelantoQuincenalPct: porcentaje,
    aplicarQuintaCategoria: z.boolean(),
    empresaNombre: z
      .string()
      .transform(sanitizarTexto)
      .pipe(z.string().regex(/^[\p{L}\p{N} .,&'-]{2,60}$/u, 'Nombre de empresa inválido (2 a 60 caracteres).')),
    empresaRuc: z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos.'),
    empresaEslogan: z
      .string()
      .transform(sanitizarTexto)
      .pipe(z.string().max(120, 'El eslogan no puede superar 120 caracteres.')),
    empresaLogoUrl: z
      .string()
      .max(600_000, 'La imagen del logo es demasiado grande.')
      .refine((v) => v === '' || /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(v), 'Formato de logo no válido.'),
  })
  .transform((datos) => normalizarConfiguracion(datos));

export type ConfiguracionDto = z.infer<typeof configuracionSchema>;

/** Asegura que el schema cubra las 4 AFP del catálogo. */
void AFP_ENTIDADES;
