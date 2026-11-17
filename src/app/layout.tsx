import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Big_Shoulders, Hanken_Grotesk } from 'next/font/google';
import { SITIO_URL } from '@/lib/sitio';
import './globals.css';

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
});

const bigShoulders = Big_Shoulders({
  variable: '--font-big-shoulders',
  subsets: ['latin'],
  weight: 'variable',
  axes: ['opsz'],
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: {
    default: 'PuraReserva – Tours en Guanacaste',
    template: '%s | PuraReserva',
  },
  description: 'Reservas de tours en Guanacaste',
  openGraph: { siteName: 'PuraReserva', type: 'website' },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${hanken.variable} ${bigShoulders.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
