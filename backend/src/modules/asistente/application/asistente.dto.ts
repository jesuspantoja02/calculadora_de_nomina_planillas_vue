import { z } from 'zod';

const mensajeSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4000),
});

export const chatAsistenteSchema = z.object({
  mensaje: z.string().trim().min(1, 'Escribe un mensaje.').max(2000),
  historial: z.array(mensajeSchema).max(20).default([]),
});
