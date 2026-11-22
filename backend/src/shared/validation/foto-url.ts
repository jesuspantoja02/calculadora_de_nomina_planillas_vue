import { z } from 'zod';

/** Data URL de foto de perfil (mismo criterio que el logo de empresa). */
export const fotoUrlCampo = z
  .string()
  .max(600_000, 'La imagen es demasiado grande.')
  .refine(
    (v) => v === '' || /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(v),
    'Formato de imagen no válido. Usa PNG, JPEG o WebP.',
  );
