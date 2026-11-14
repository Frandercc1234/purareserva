import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/ui/EmptyState';
import { TourCard } from '@/components/publico/TourCard';
import { WhatsAppButton } from '@/components/publico/WhatsAppButton';
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
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">{negocio.nombre}</h1>
        {descripcion && (
          <p className="max-w-2xl text-lg text-texto-suave">{descripcion}</p>
        )}
        <div>
          <WhatsAppButton numero={negocio.whatsapp} />
        </div>
      </header>

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
    </main>
  );
}
