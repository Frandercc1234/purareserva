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
      className="group flex h-full flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] hover:border-primario/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
    >
      <div className="aspect-video overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagenUrl ?? '/tour-default.svg'}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] motion-safe:group-hover:scale-[1.03]"
        />
      </div>
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
