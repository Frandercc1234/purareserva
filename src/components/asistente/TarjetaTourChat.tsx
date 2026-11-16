'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Imagen } from '@/components/publico/Imagen';
import { Button, botonClases } from '@/components/ui/Button';
import { reservarDesdeChat } from '@/lib/asistente/acciones';
import type { TourParaChat } from '@/lib/asistente/herramientas';
import Link from 'next/link';

/** Tarjeta de un tour encontrado por el asistente, con la foto real del tour. */
export function TarjetaTourChat({
  tour,
  personas,
  alNavegar,
}: {
  tour: TourParaChat;
  /** Personas que pidió el turista en la búsqueda (1 si no dijo). */
  personas: number;
  alNavegar?: () => void;
}) {
  const t = useTranslations('Asistente');
  const c = useTranslations('Tour');
  const locale = useLocale() as 'es' | 'en';
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState(false);
  const proxima = tour.salidas[0];

  return (
    <article className="overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta">
      <div className="relative aspect-[16/7] bg-fondo">
        <Imagen
          src={tour.imagen_url}
          alt={tour.tour}
          sizes="(min-width: 640px) 340px, 100vw"
        />
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <h3 className="text-base font-semibold">{tour.tour}</h3>
        <p className="text-sm text-texto-suave">{tour.negocio}</p>
        <p className="text-sm">
          {tour.precio_texto} · {tour.duracion_texto}
        </p>
        {proxima && (
          <p className="text-sm text-exito">
            {t('proxima', {
              fecha: proxima.fecha_hora_texto,
              cupos: c('cupos', { count: proxima.cupos }),
            })}
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <Link
            href={tour.url}
            onClick={alNavegar}
            className={botonClases('secundario', 'h-9 flex-1 px-3 text-sm')}
          >
            {t('ver')}
          </Link>
          <Button
            type="button"
            className="h-9 flex-1 px-3 text-sm"
            disabled={pendiente || !proxima}
            onClick={() =>
              empezar(async () => {
                setError(false);
                const r = await reservarDesdeChat({
                  salida_id: proxima!.id,
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
            {pendiente ? t('reservando') : t('reservar')}
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-1 text-sm text-error">
            {t('salidaNoDisponible')}
          </p>
        )}
      </div>
    </article>
  );
}
