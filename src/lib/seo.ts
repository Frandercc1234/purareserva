import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { recortar } from './texto';

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

/**
 * Título para cuando el negocio o el tour no existen: la página llama a notFound() y
 * en producción el título de not-found.tsx no pisa al del layout, así que se fija aquí.
 */
export async function tituloNoEncontrada(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'NotFound' });
  return { title: t('titulo') };
}

export { recortar };
