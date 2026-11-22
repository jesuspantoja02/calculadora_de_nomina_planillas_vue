import type { MensajeLlm } from '../infrastructure/llm-cliente.ts';

function normalizar(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[¿?¡!.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function incluye(haystack: string, ...palabras: string[]): boolean {
  return palabras.every((p) => haystack.includes(p));
}

function alguna(haystack: string, grupos: string[][]): boolean {
  return grupos.some((g) => incluye(haystack, ...g));
}

/** Respuestas locales cuando no hay Gemini/OpenAI/Ollama. */
export function responderLocal(historial: MensajeLlm[], contextoVivo: string): string {
  const ultimo = [...historial].reverse().find((m) => m.role === 'user')?.text ?? '';
  const q = normalizar(ultimo);

  if (!q) {
    return 'Hola. Pregúntame sobre empleados, AFP, ONP, quinta, boletas o cómo usar el menú.';
  }

  if (alguna(q, [['hola'], ['buenas'], ['buen dia'], ['buenos dias'], ['hey'], ['hi']])) {
    return 'Hola. Soy el asistente de planillas. Puedo explicarte AFP, quinta, gratificaciones, CTS o guiarte por Empleados, Procesar pago y Boletas.';
  }

  if (alguna(q, [['gracias'], ['ok gracias'], ['perfecto']])) {
    return 'Con gusto. Si surge otra duda de planilla o del sistema, aquí estoy.';
  }

  if (alguna(q, [['quien eres'], ['que eres'], ['que puedes'], ['para que sirves'], ['ayuda']])) {
    return [
      'Soy el asistente de esta calculadora de nómina.',
      'Puedo explicar:',
      '• Cálculos (AFP/ONP, horas extra, asignación familiar, gratificación, CTS, quinta)',
      '• Uso de la app (empleados, procesar pago, boletas, configuración, usuarios)',
      '',
      'Escribe tu pregunta con naturalidad.',
    ].join('\n');
  }

  if (alguna(q, [['quinta'], ['impuesto a la renta'], ['retencion'], ['renta de quinta']])) {
    return [
      '**Quinta categoría** (en este sistema):',
      '1. Proyecta renta anual ≈ 12 remuneraciones ordinarias + 2 gratificaciones.',
      '2. Resta 7 UIT y el aporte obligatorio a pensión (AFP 10 % u ONP) × 12.',
      '3. Aplica tramos 8 %, 14 %, 17 %, 20 % y 30 %.',
      '4. Divide el impuesto anual entre 12 para la retención mensual.',
      '',
      'La bonificación extraordinaria de gratificación **no** integra quinta.',
      'Puedes activar/desactivar quinta en **Configuración**.',
      '',
      contextoVivo,
    ].join('\n');
  }

  if (alguna(q, [['afp']]) || alguna(q, [['integra']]) || alguna(q, [['prima']]) || alguna(q, [['profuturo']]) || alguna(q, [['habitat']])) {
    return [
      '**AFP** en la boleta (hasta la remuneración máxima asegurable):',
      '• Aporte al fondo: 10 %',
      '• Prima de seguro',
      '• Comisión por flujo (si la AFP está en esquema flujo); la comisión sobre saldo no se descuenta del sueldo',
      '',
      'Las tasas por AFP (Integra, Prima, Profuturo, Habitat) se editan en **Configuración**.',
      'Cada empleado tiene su AFP; el cálculo usa esas tasas.',
      '',
      contextoVivo,
    ].join('\n');
  }

  if (alguna(q, [['onp']])) {
    return [
      '**ONP** (D.L. 19990): descuento del **13 %** sobre la base pensionable.',
      'No aplica el tope de remuneración máxima asegurable de las AFP.',
      'En el empleado elige régimen ONP (sin AFP).',
    ].join('\n');
  }

  if (alguna(q, [['hora extra'], ['horas extra'], ['horas extras'], ['sobretiempo']])) {
    return [
      '**Horas extra** (D.S. 007-2002-TR):',
      '• Valor hora = remuneración ordinaria ÷ 30 ÷ 8',
      '• Primeras 2 horas del día: 125 %',
      '• Siguientes: 135 %',
      '',
      'Se registran al **Procesar pago**.',
    ].join('\n');
  }

  if (alguna(q, [['asignacion familiar'], ['asignación familiar'], ['hijos']])) {
    return [
      '**Asignación familiar** (Ley 25129): **10 % de la RMV** si el trabajador tiene hijos a cargo.',
      'Es una por trabajador (no por hijo). Márcalo en la ficha del empleado.',
      '',
      contextoVivo,
    ].join('\n');
  }

  if (alguna(q, [['gratificacion'], ['gratificación'], ['aguinaldo']])) {
    return [
      '**Gratificación** (Ley 27735): un sueldo computable por semestre (proporcional a meses/6), sin descuento de pensión.',
      '**Bonificación extraordinaria** (Ley 30334): 9 % (EsSalud) o 6,75 % si está en EPS.',
      'Esa bonificación no entra a quinta categoría.',
    ].join('\n');
  }

  if (alguna(q, [['cts']])) {
    return [
      '**CTS** (T.U.O. D.S. 001-97-TR):',
      '(básico + asignación familiar + 1/6 de la gratificación) × tiempo / 12.',
      'Es un **depósito**, no un pago de sueldo en la boleta mensual típica.',
    ].join('\n');
  }

  if (alguna(q, [['empleado'], ['empleados'], ['trabajador'], ['dni']])) {
    return [
      'En **Empleados** das de alta o editas: DNI, nombres, sueldo, régimen AFP/ONP, AFP, hijos, etc.',
      'Luego en **Procesar pago** eliges al trabajador y el período para generar la boleta.',
      'Las boletas quedan en **Boletas de pago** (PDF).',
      '',
      contextoVivo,
    ].join('\n');
  }

  if (alguna(q, [['boleta'], ['boletas'], ['pdf']])) {
    return 'Ve a **Boletas de pago** para ver, imprimir o descargar PDF (una o todas). Se generan desde **Procesar pago**.';
  }

  if (alguna(q, [['configuracion'], ['configuración'], ['rmv'], ['uit'], ['empresa'], ['logo']])) {
    return [
      'En **Configuración** (roles admin/jefe/gerente) ajustas:',
      '• Datos de empresa (nombre, RUC, eslogan, logo)',
      '• Tasas AFP por administradora, ONP, EsSalud, RMV, UIT',
      '• Adelanto quincenal y si aplica quinta',
      '',
      contextoVivo,
    ].join('\n');
  }

  if (alguna(q, [['usuario'], ['usuarios'], ['rol'], ['admin'], ['permiso']])) {
    return [
      '**Usuarios del sistema**: admin gestiona cuentas y roles (admin, jefe, gerente, usuario).',
      'Jefe/gerente pueden agregar usuarios según permisos.',
      'Cada perfil puede tener foto; tú puedes cambiar la tuya en **Mi perfil**.',
    ].join('\n');
  }

  if (alguna(q, [['dashboard'], ['resumen'], ['grafico'], ['gráfico']])) {
    return 'El **Dashboard** resume indicadores de planilla y personal (AFP/ONP, montos, etc.) a partir de empleados y boletas registradas.';
  }

  if (alguna(q, [['feriado'], ['descanso'], ['domingo']])) {
    return 'Si trabaja en descanso o feriado **sin día sustitutorio**, la sobretasa es del **100 %** (el día ya está cubierto por el sueldo mensual). Se indica al procesar el pago.';
  }

  if (alguna(q, [['adelanto'], ['quincena'], ['quincenal']])) {
    return [
      'El **adelanto quincenal** es política de la empresa (la ley no fija el %).',
      'El porcentaje se configura en **Configuración** y se usa al procesar pagos.',
      '',
      contextoVivo,
    ].join('\n');
  }

  if (alguna(q, [['essalud'], ['eps']])) {
    return 'EsSalud a cargo del empleador usa la tasa de configuración (por defecto 9 %). En gratificación, la bonificación extraordinaria es 9 %, o 6,75 % si el trabajador está en EPS.';
  }

  return [
    'No tengo una respuesta cerrada para eso en el modo local, pero puedo ayudarte con:',
    'AFP · ONP · quinta · horas extra · asignación familiar · gratificación · CTS · empleados · boletas · configuración · roles.',
    '',
    'Reformula la pregunta o sé más específico (por ejemplo: «¿cómo se calcula la quinta?» o «¿dónde configuro las tasas AFP?»).',
    '',
    'Para respuestas más abiertas con modelo en la nube, configura `GEMINI_API_KEY` en el `.env` del backend.',
  ].join('\n');
}
