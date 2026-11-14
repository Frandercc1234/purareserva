'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

const CADA_MS = 3000;
const MAX_INTENTOS = 10; // 30 segundos

/** Refresca la página cada 3 s mientras el webhook no confirma el pago. */
export function ConfirmandoPago() {
  const t = useTranslations('Gracias');
  const router = useRouter();
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    if (intentos >= MAX_INTENTOS) return;
    const id = setTimeout(() => {
      router.refresh();
      setIntentos((n) => n + 1);
    }, CADA_MS);
    return () => clearTimeout(id);
  }, [intentos, router]);

  if (intentos >= MAX_INTENTOS) {
    return <p className="text-texto-suave">{t('demora')}</p>;
  }
  return (
    <p className="flex items-center gap-3 text-texto-suave" role="status">
      <Spinner etiqueta={t('confirmando')} />
      {t('confirmando')}
    </p>
  );
}
