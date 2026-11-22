import { AppError } from '../../../shared/errors/app-error.ts';

export type RolMensaje = 'user' | 'model';

export interface MensajeLlm {
  role: RolMensaje;
  text: string;
}

export interface OpcionesLlm {
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

export type ProveedorActivo = 'gemini' | 'openai' | 'ollama' | 'local';

export function proveedorDesdeOpciones(o: OpcionesLlm): ProveedorActivo {
  if (o.geminiApiKey?.trim()) return 'gemini';
  if (o.openaiApiKey?.trim()) return 'openai';
  if (o.ollamaBaseUrl?.trim()) return 'ollama';
  return 'local';
}

export async function completarConLlm(
  system: string,
  historial: MensajeLlm[],
  opciones: OpcionesLlm,
): Promise<{ texto: string; proveedor: ProveedorActivo }> {
  const proveedor = proveedorDesdeOpciones(opciones);
  if (proveedor === 'gemini') {
    return {
      texto: await llamarGemini(
        system,
        historial,
        opciones.geminiApiKey!.trim(),
        opciones.geminiModel?.trim() || 'gemini-3.1-flash-lite',
      ),
      proveedor,
    };
  }
  if (proveedor === 'openai') {
    return {
      texto: await llamarOpenAiCompatible(
        system,
        historial,
        opciones.openaiApiKey!.trim(),
        opciones.openaiBaseUrl?.trim() || 'https://api.openai.com/v1',
        opciones.openaiModel?.trim() || 'gpt-4o-mini',
      ),
      proveedor,
    };
  }
  if (proveedor === 'ollama') {
    return {
      texto: await llamarOllama(
        system,
        historial,
        opciones.ollamaBaseUrl!.trim().replace(/\/$/, ''),
        opciones.ollamaModel?.trim() || 'llama3.2',
      ),
      proveedor,
    };
  }
  throw new AppError(503, 'IA_NO_CONFIGURADA', 'No hay proveedor de IA configurado.');
}

/** Gemini exige que el primer turno sea `user` y que no haya dos roles iguales seguidos. */
function normalizarHistorialGemini(historial: MensajeLlm[]): MensajeLlm[] {
  const limpio: MensajeLlm[] = [];
  for (const m of historial) {
    const text = m.text.trim();
    if (!text) continue;
    const role = m.role === 'user' ? 'user' : 'model';
    const prev = limpio[limpio.length - 1];
    if (prev && prev.role === role) {
      prev.text = `${prev.text}\n\n${text}`;
      continue;
    }
    limpio.push({ role, text });
  }
  while (limpio.length > 0 && limpio[0]!.role !== 'user') limpio.shift();
  return limpio.slice(-12);
}

async function llamarGemini(system: string, historial: MensajeLlm[], apiKey: string, model: string): Promise<string> {
  const contents = normalizarHistorialGemini(historial).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  if (contents.length === 0) {
    throw new AppError(400, 'SIN_MENSAJE', 'Escribe un mensaje para el asistente.');
  }

  const modelos = [model, 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3-flash-preview'];
  const intentos = [...new Set(modelos.filter(Boolean))];
  let ultimoError = '';

  for (const nombre of intentos) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(nombre)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), 45_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controlador.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      });
    } catch (error) {
      clearTimeout(timer);
      ultimoError = error instanceof Error ? error.message : 'timeout/red';
      console.error('[asistente gemini] red', nombre, ultimoError);
      continue;
    }
    clearTimeout(timer);

    if (!res.ok) {
      ultimoError = await res.text().catch(() => '');
      console.error('[asistente gemini]', nombre, res.status, ultimoError.slice(0, 300));
      continue;
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    };
    const candidato = json.candidates?.[0];
    const texto = candidato?.content?.parts?.map((p) => p.text ?? '').join('')?.trim() ?? '';
    if (!texto) {
      ultimoError = `respuesta vacía (${candidato?.finishReason ?? 'sin razón'})`;
      continue;
    }
    return texto;
  }

  console.error('[asistente gemini] sin modelo usable', ultimoError.slice(0, 400));
  throw new AppError(502, 'IA_PROVEEDOR', 'El proveedor de IA no respondió correctamente. Revisa la API key o el modelo.');
}

async function llamarOpenAiCompatible(
  system: string,
  historial: MensajeLlm[],
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<string> {
  const messages = [
    { role: 'system', content: system },
    ...historial.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 1024 }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    console.error('[asistente openai]', res.status, detalle.slice(0, 400));
    throw new AppError(502, 'IA_PROVEEDOR', 'El proveedor de IA no respondió correctamente. Revisa la API key.');
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const texto = json.choices?.[0]?.message?.content?.trim() ?? '';
  if (!texto) throw new AppError(502, 'IA_VACIA', 'La IA no devolvió texto. Intenta de nuevo.');
  return texto;
}

async function llamarOllama(system: string, historial: MensajeLlm[], baseUrl: string, model: string): Promise<string> {
  const messages = [
    { role: 'system', content: system },
    ...historial.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0.4 } }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    console.error('[asistente ollama]', res.status, detalle.slice(0, 400));
    throw new AppError(502, 'IA_PROVEEDOR', 'No se pudo contactar a Ollama. ¿Está en ejecución?');
  }

  const json = (await res.json()) as { message?: { content?: string } };
  const texto = json.message?.content?.trim() ?? '';
  if (!texto) throw new AppError(502, 'IA_VACIA', 'Ollama no devolvió texto.');
  return texto;
}
