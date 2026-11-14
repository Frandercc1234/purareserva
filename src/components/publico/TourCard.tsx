import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { formatearDuracion } from '@/lib/fechas';
import { formatearUSD } from '@/lib/dinero';

export function TourCard({
  negocioSlug,
  tourSlug,
  nombre,
  imagenUrl,
  duracionMin,
  precioCents,
  locale,
}: {
  negocioSlug: string;
  tourSlug: string;
  nombre: string;
  imagenUrl: string | null;
  duracionMin: number;
  precioCents: number;
  locale: string;
}) {
  const t = useTranslations('Comun');
  return (
    <Link
      href={`/${negocioSlug}/${tourSlug}`}
      className="group flex flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagenUrl ?? '/tour-default.svg'}
        alt=""
        loading="lazy"
        className="aspect-video w-full object-cover"
      />
      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-lg font-semibold group-hover:text-primario">
          {nombre}
        </h3>
        <p className="text-sm text-texto-suave">
          {formatearDuracion(duracionMin)}
        </p>
        <p>
          <span className="text-2xl font-semibold">
            {formatearUSD(precioCents, locale)}
          </span>{' '}
          <span className="text-sm text-texto-suave">{t('porPersona')}</span>
        </p>
      </div>
    </Link>
  );
}
