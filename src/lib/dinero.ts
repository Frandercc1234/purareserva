/**
 * Centavos de USD a texto para mostrar: "US$85" y "US$21,25" en español, "$85" y
 * "$21.25" en inglés. Sin decimales cuando los centavos son 0.
 */
export function formatearUSD(cents: number, locale = 'en') {
  const sinDecimales = cents % 100 === 0;
  const numero = new Intl.NumberFormat(locale, {
    minimumFractionDigits: sinDecimales ? 0 : 2,
    maximumFractionDigits: sinDecimales ? 0 : 2,
  }).format(cents / 100);
  return `${locale === 'es' ? 'US$' : '$'}${numero}`;
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
