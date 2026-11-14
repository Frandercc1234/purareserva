/** Centavos de USD a texto, por ejemplo 4500 -> "$45.00" (locale en). */
export function formatearUSD(cents: number, locale = 'en') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** Texto en dólares a centavos: "45.5" -> 4550. Devuelve null si no es válido. */
export function aCentavos(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null;
  return Math.round(Number(limpio) * 100);
}

/** Centavos a texto editable: 4500 -> "45.00". */
export function centavosATexto(cents: number) {
  return (cents / 100).toFixed(2);
}
