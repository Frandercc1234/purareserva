import { uuid } from '@/lib/validaciones';

/**
 * Respaldo para cuando el modelo escribe la llamada a `preparar_reserva` como texto
 * (un bloque ```json con salida_id y personas) en vez de llamar a la herramienta.
 * Nada de esto llega a la pantalla como texto; si el JSON es válido se ofrece el botón.
 */

const MAX_PERSONAS_ESCRITAS = 20;

/** Quita los bloques de código y cualquier objeto JSON que mencione `salida_id`. */
export function quitarCodigoYJson(texto: string) {
  return (
    texto
      // Bloques ``` completos y, mientras se escribe, el que todavía no cerró.
      .replace(/```[\s\S]*?(?:```|$)/g, '')
      // Objetos JSON planos con salida_id (y el que está a medio escribir).
      .replace(/\{[^{}]*salida_id[^{}]*\}/gi, '')
      .replace(/\{[^{}]*$/, (resto) => (/salida|personas/i.test(resto) ? '' : resto))
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
  );
}

/** Reserva que el modelo escribió como JSON, solo si es válida (uuid y 1 a 20 personas). */
export function reservaEscrita(
  texto: string,
): { salida_id: string; personas: number } | null {
  for (const candidato of texto.match(/\{[^{}]*\}/g) ?? []) {
    if (!/salida_id/.test(candidato)) continue;
    try {
      const datos = JSON.parse(candidato) as {
        salida_id?: unknown;
        personas?: unknown;
      };
      const id = uuid.safeParse(datos.salida_id);
      const personas = datos.personas;
      if (
        id.success &&
        typeof personas === 'number' &&
        Number.isInteger(personas) &&
        personas >= 1 &&
        personas <= MAX_PERSONAS_ESCRITAS
      )
        return { salida_id: id.data, personas };
    } catch {
      // No era JSON válido: se ignora.
    }
  }
  return null;
}
