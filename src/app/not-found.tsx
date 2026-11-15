import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Footer } from '@/components/publico/Footer';
import { Header } from '@/components/publico/Header';
import { NoEncontrada } from '@/components/publico/NoEncontrada';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('NotFound');
  return { title: t('titulo') };
}

/**
 * Respaldo para rutas que no encajan en ninguna página (por ejemplo `/en/a/b/c` o
 * `/api/x`). Usa el idioma de la petición y, si no hay, el español.
 */
export default async function NotFound() {
  const locale = await getLocale();
  const messages = await getMessages({ locale });
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <NoEncontrada />
      <Footer />
    </NextIntlClientProvider>
  );
}
