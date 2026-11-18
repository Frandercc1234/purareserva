/**
 * Decide si el siguiente paso del modelo debe ser `preparar_reserva` (sin dejarlo elegir).
 * Pasa cuando el usuario pidió reservar, ya hay una búsqueda con personas y esa búsqueda
 * dejó una sola salida posible: no queda nada que preguntar. En cualquier otro caso
 * (varias salidas, faltan personas) decide el modelo.
 */

type Llamada = { toolName: string; input?: unknown };
type Resultado = { toolName: string; output?: unknown };

/** Lo mínimo que se necesita de cada paso de `streamText` (compatible con `StepResult`). */
export type PasoAsistente = {
  toolCalls: readonly Llamada[];
  toolResults: readonly Resultado[];
};

const INTENCION_RESERVAR = /\b(reserv\w*|book\w*)\b/i;

function personasDe(input: unknown) {
  const personas = (input as { personas?: unknown } | null)?.personas;
  return typeof personas === 'number';
}

function unaSolaSalida(output: unknown) {
  const tours = (output as { tours?: unknown } | null)?.tours;
  if (!Array.isArray(tours) || tours.length !== 1) return false;
  const salidas = (tours[0] as { salidas?: unknown } | null)?.salidas;
  return Array.isArray(salidas) && salidas.length === 1;
}

export function debeForzarReserva({
  textoUsuario,
  pasos,
}: {
  textoUsuario: string;
  pasos: readonly PasoAsistente[];
}): boolean {
  if (!INTENCION_RESERVAR.test(textoUsuario)) return false;
  const llamadas = pasos.flatMap((p) => p.toolCalls);
  if (llamadas.some((l) => l.toolName === 'preparar_reserva')) return false;
  if (
    !llamadas.some((l) => l.toolName === 'buscar_tours' && personasDe(l.input))
  )
    return false;
  const busqueda = pasos
    .flatMap((p) => p.toolResults)
    .find((r) => r.toolName === 'buscar_tours');
  return busqueda !== undefined && unaSolaSalida(busqueda.output);
}

type NombreHerramienta = 'buscar_tours' | 'buscar_guia' | 'preparar_reserva';
const TODAS: NombreHerramienta[] = [
  'buscar_tours',
  'buscar_guia',
  'preparar_reserva',
];

/**
 * Qué puede hacer el modelo en el siguiente paso (`prepareStep` de `streamText`):
 * - Si hay que forzar la reserva, solo `preparar_reserva` y sin elegir.
 * - Si `buscar_tours` ya se llamó en este mensaje, deja de estar disponible: dos búsquedas
 *   en un mensaje solo duplican las tarjetas.
 * - Si no, sin cambios (`undefined`).
 */
export function configurarPaso({
  textoUsuario,
  pasos,
}: {
  textoUsuario: string;
  pasos: readonly PasoAsistente[];
}) {
  if (debeForzarReserva({ textoUsuario, pasos })) {
    return {
      toolChoice: {
        type: 'tool' as const,
        toolName: 'preparar_reserva' as const,
      },
      activeTools: ['preparar_reserva' as const],
    };
  }
  if (pasos.some((p) => p.toolCalls.some((l) => l.toolName === 'buscar_tours')))
    return { activeTools: TODAS.filter((n) => n !== 'buscar_tours') };
  return undefined;
}
