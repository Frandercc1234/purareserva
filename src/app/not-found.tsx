import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Footer } from '@/components/publico/Footer';
import { Header } from '@/components/publico/Header';
import { NoEncontrada } from '@/components/publico/NoEncontrada';

/**
 * Respaldo para rutas fuera de [locale] (por ejemplo un idioma que no existe):
 * muestra la misma página en español.
 */
export default async function NotFound() {
  const messages = await getMessages({ locale: 'es' });
  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      <Header />
      <NoEncontrada />
      <Footer />
    </NextIntlClientProvider>
  );
}
