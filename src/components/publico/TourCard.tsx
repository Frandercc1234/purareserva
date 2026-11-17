import { useTranslations } from 'next-intl';
import { Imagen } from '@/components/publico/Imagen';
import { Link } from '@/i18n/routing';
import { IMAGEN_RESPALDO } from '@/lib/imagenes';
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
      className="group flex h-full flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta transition-[transform,border-color] duration-200 ease-[var(--ease-out)] hover:border-primario motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Imagen
          src={imagenUrl ?? IMAGEN_RESPALDO}
          alt={nombre}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-300 ease-[var(--ease-out)] motion-safe:group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="titulo text-3xl break-words decoration-2 underline-offset-4 group-hover:underline">
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
