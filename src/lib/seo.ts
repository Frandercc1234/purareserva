import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/** Enlaces canónico y por idioma (hreflang) de una ruta pública, sin el prefijo de idioma. */
export function alternativas(
  locale: string,
  ruta = '',
): Metadata['alternates'] {
  return {
    canonical: `/${locale}${ruta}`,
    languages: {
      es: `/es${ruta}`,
      en: `/en${ruta}`,
      'x-default': `/es${ruta}`,
    },
  };
}

/** Recorta un texto a `max` caracteres sin cortar a mitad de palabra. */
export function recortar(texto: string, max = 155) {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(' ') > 80 ? corte.lastIndexOf(' ') : max).trimEnd()}…`;
}

/**
 * Título para cuando el negocio o el tour no existen: la página llama a notFound() y
 * en producción el título de not-found.tsx no pisa al del layout, así que se fija aquí.
 */
export async function tituloNoEncontrada(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'NotFound' });
  return { title: t('titulo') };
}
