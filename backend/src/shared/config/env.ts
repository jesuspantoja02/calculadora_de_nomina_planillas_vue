import { z } from 'zod';

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:5174'),
  DATABASE_FILE: z.string().default('data/nomina.db'),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  AUTH_SECRET: z.string().min(16).default('dev-nomina-auth-secret-cambiar-en-prod'),
  AUTH_TOKEN_TTL_HOURS: z.coerce.number().positive().max(168).default(12),
  /** Google AI Studio / Gemini (recomendado para el asistente). */
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-3.1-flash-lite'),
  /** Alternativa OpenAI u otro endpoint compatible. */
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_BASE_URL: z.string().optional().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().optional().default('gpt-4o-mini'),
  /** Ollama local, ej. http://127.0.0.1:11434 */
  OLLAMA_BASE_URL: z.string().optional().default(''),
  OLLAMA_MODEL: z.string().optional().default('llama3.2'),
});

const resultado = esquema.safeParse(process.env);
if (!resultado.success) {
  console.error('Variables de entorno inválidas:\n' + z.prettifyError(resultado.error));
  process.exit(1);
}

export const env = resultado.data;
export const origenesPermitidos = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
