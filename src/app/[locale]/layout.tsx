import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { HtmlLang } from '@/components/publico/HtmlLang';
import { AsistenteCarga } from '@/components/asistente/AsistenteCarga';
import { Footer } from '@/components/publico/Footer';
import { Header } from '@/components/publico/Header';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'es' | 'en')) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLang locale={locale} />
      <Header />
      {children}
      <Footer />
      <AsistenteCarga />
    </NextIntlClientProvider>
  );
}
