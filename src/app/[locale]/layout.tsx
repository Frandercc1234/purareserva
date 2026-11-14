import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { HtmlLang } from '@/components/publico/HtmlLang';
import { LocaleSwitcher } from '@/components/publico/LocaleSwitcher';

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
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <span className="font-semibold">PuraReserva</span>
        <LocaleSwitcher />
      </header>
      {children}
    </NextIntlClientProvider>
  );
}
