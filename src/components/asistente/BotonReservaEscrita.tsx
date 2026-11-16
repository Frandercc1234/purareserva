'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { reservarDesdeChat } from '@/lib/asistente/acciones';

/**
 * Botón de respaldo: el modelo escribió la reserva como JSON en vez de llamar a la
 * herramienta. Se valida en el servidor igual que el botón de la tarjeta.
 */
export function BotonReservaEscrita({
  salidaId,
  personas,
  alNavegar,
}: {
  salidaId: string;
  personas: number;
  alNavegar?: () => void;
}) {
  const t = useTranslations('Asistente');
  const locale = useLocale() as 'es' | 'en';
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-tarjeta border border-borde bg-superficie p-3 text-sm leading-5">
      <Button
        type="button"
        className="w-full"
        disabled={pendiente}
        onClick={() =>
          empezar(async () => {
            setError(false);
            const r = await reservarDesdeChat({
              salida_id: salidaId,
              personas,
              locale,
            });
            if (r.ok) {
              alNavegar?.();
              router.push(r.url);
            } else setError(true);
          })
        }
      >
        {pendiente ? t('reservando') : t('completarReserva')}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-error">
          {t('salidaNoDisponible')}
        </p>
      )}
    </div>
  );
}
