import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// Las páginas de la reserva llevan un enlace secreto: no se indexan.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('reservaTitulo'),
    description: t('reservaDescripcion'),
    robots: { index: false, follow: false },
  };
}

export default function ReservaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
