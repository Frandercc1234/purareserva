import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/ui/EmptyState';
import { TourCard } from '@/components/publico/TourCard';
import { WhatsAppButton } from '@/components/publico/WhatsAppButton';
import { Link } from '@/i18n/routing';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

export default async function NegocioPage({
  params,
}: {
  params: Promise<{ locale: string; negocio: string }>;
}) {
  const { locale, negocio: slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Negocio');
  const supabase = createPublicClient();

  const { data: negocio } = await supabase
    .from('negocios')
    .select('id, slug, nombre, descripcion_es, descripcion_en, whatsapp')
    .eq('slug', slug)
    .maybeSingle();
  if (!negocio) notFound();

  const { data: tours } = await supabase
    .from('tours')
    .select(
      'slug, nombre_es, nombre_en, imagen_url, duracion_min, precio_cents',
    )
    .eq('negocio_id', negocio.id)
    .order('creado_en');

  const descripcion =
    locale === 'en' ? negocio.descripcion_en : negocio.descripcion_es;

  return (
    <main>
      <header className="border-b border-borde bg-gradient-to-br from-primario/10 via-fondo to-acento/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 md:py-16">
          <Link
            href="/"
            className="inline-flex h-11 w-fit items-center text-sm font-semibold text-primario underline-offset-4 hover:underline"
          >
            <span aria-hidden="true" className="mr-1">
              ←
            </span>
            {t('volver')}
          </Link>
          <p className="text-sm font-semibold tracking-wide text-aviso uppercase">
            {t('operador')}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {negocio.nombre}
          </h1>
          {descripcion && (
            <p className="max-w-2xl text-lg text-texto-suave">{descripcion}</p>
          )}
          <div>
            <WhatsAppButton numero={negocio.whatsapp} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:py-14">
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">{t('tours')}</h2>
          {!tours?.length ? (
            <EmptyState titulo={t('sinTours')} />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <li key={tour.slug}>
                  <TourCard
                    negocioSlug={negocio.slug}
                    tourSlug={tour.slug}
                    nombre={locale === 'en' ? tour.nombre_en : tour.nombre_es}
                    imagenUrl={tour.imagen_url}
                    duracionMin={tour.duracion_min}
                    precioCents={tour.precio_cents}
                    locale={locale}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
