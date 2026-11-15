import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NoEncontrada } from '@/components/publico/NoEncontrada';

// El layout de [locale] pone la cabecera, el pie y el idioma.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('NotFound');
  return { title: t('titulo') };
}

export default function NotFound() {
  return <NoEncontrada />;
}
