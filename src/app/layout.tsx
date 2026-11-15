import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { SITIO_URL } from '@/lib/sitio';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '600'],
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
    <html lang={locale} className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
