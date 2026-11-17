import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/ui/EmptyState';
import { Imagen } from '@/components/publico/Imagen';
import { TourCard } from '@/components/publico/TourCard';
import { WhatsAppButton } from '@/components/publico/WhatsAppButton';
import { Link } from '@/i18n/routing';
import { IMAGEN_RESPALDO } from '@/lib/imagenes';
import { alternativas, recortar, tituloNoEncontrada } from '@/lib/seo';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; negocio: string }>;
}): Promise<Metadata> {
  const { locale, negocio: slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const supabase = createPublicClient();
  const { data: negocio } = await supabase
    .from('negocios')
    .select('id, nombre, descripcion_es, descripcion_en, portada_url')
    .eq('slug', slug)
    .maybeSingle();
  if (!negocio) return await tituloNoEncontrada(locale);

  const { data: tour } = await supabase
    .from('tours')
    .select('imagen_url')
    .eq('negocio_id', negocio.id)
    .not('imagen_url', 'is', null)
    .order('creado_en')
    .limit(1)
    .maybeSingle();

  const descripcion = recortar(
    (locale === 'en' ? negocio.descripcion_en : negocio.descripcion_es) ||
      t('negocioRespaldo', { nombre: negocio.nombre }),
  );
  const imagen = negocio.portada_url ?? tour?.imagen_url ?? IMAGEN_RESPALDO;
  return {
    title: negocio.nombre,
    description: descripcion,
    alternates: alternativas(locale, `/${slug}`),
    openGraph: {
      title: negocio.nombre,
      description: descripcion,
      images: [{ url: imagen, alt: negocio.nombre }],
      locale: locale === 'en' ? 'en_US' : 'es_CR',
    },
  };
}

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
    .select(
      'id, slug, nombre, descripcion_es, descripcion_en, whatsapp, portada_url',
    )
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
  // Portada del negocio; si no tiene, la foto de su primer tour; si no, la de respaldo.
  const portada =
    negocio.portada_url ??
    tours?.find((t) => t.imagen_url)?.imagen_url ??
    IMAGEN_RESPALDO;

  return (
    <main>
      <header className="border-b border-borde">
        <div className="relative aspect-[16/9] max-h-[440px] w-full md:aspect-[21/9]">
          <Imagen src={portada} alt={negocio.nombre} sizes="100vw" priority />
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 md:py-12">
          <Link
            href="/"
            className="inline-flex h-11 w-fit items-center text-sm font-semibold text-primario underline-offset-4 hover:underline"
          >
            <span aria-hidden="true" className="mr-1">
              ←
            </span>
            {t('volver')}
          </Link>
          <p className="text-sm font-semibold text-texto-suave">
            {t('operador')}
          </p>
          <h1 className="titulo-hero text-5xl md:text-7xl">{negocio.nombre}</h1>
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
          <h2 className="titulo text-4xl">{t('tours')}</h2>
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
