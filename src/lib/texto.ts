/** Utilidades de texto sin dependencias (se usan también en el asistente). */

/** Recorta un texto a `max` caracteres sin cortar a mitad de palabra. */
export function recortar(texto: string, max = 155) {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(' ') > 80 ? corte.lastIndexOf(' ') : max).trimEnd()}…`;
}
