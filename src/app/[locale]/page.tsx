import type { Metadata } from 'next';
import NextLink from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Imagen } from '@/components/publico/Imagen';
import { botonClases } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { IMAGEN_RESPALDO } from '@/lib/imagenes';
import { alternativas } from '@/lib/seo';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

/** Foto del hero: costa de Nicoya (Unsplash, créditos en docs/creditos-fotos.md). */
const FOTO_HERO = '/fotos/costa-nicoya.jpg';
const PASOS = ['uno', 'dos', 'tres'] as const;
const BENEFICIOS = ['uno', 'dos', 'tres'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('landingTitulo'),
    description: t('landingDescripcion'),
    alternates: alternativas(locale),
    openGraph: {
      title: t('landingTitulo'),
      description: t('landingDescripcion'),
      locale: locale === 'en' ? 'en_US' : 'es_CR',
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Landing');
  const c = await getTranslations('Comun');

  const supabase = createPublicClient();
  const [{ data: negocios }, { data: tours }] = await Promise.all([
    supabase
      .from('negocios')
      .select(
        'id, slug, nombre, descripcion_es, descripcion_en, portada_url, tours(count)',
      )
      .order('nombre'),
    // Solo los tours activos son públicos (RLS). Sirven de portada de respaldo y para el hero.
    supabase
      .from('tours')
      .select('negocio_id, imagen_url')
      .not('imagen_url', 'is', null)
      .order('creado_en'),
  ]);

  // Un negocio sin tours activos no se enlaza desde la landing (su página sigue existiendo).
  const negociosVisibles = (negocios ?? []).filter(
    (n) => (n.tours[0]?.count ?? 0) > 0,
  );

  const primeraImagenPorNegocio = new Map<string, string>();
  for (const tour of tours ?? []) {
    if (tour.imagen_url && !primeraImagenPorNegocio.has(tour.negocio_id))
      primeraImagenPorNegocio.set(tour.negocio_id, tour.imagen_url);
  }
  return (
    <main>
      <section className="sobre-carbon bg-carbon text-hueso lg:relative lg:flex lg:min-h-[680px] lg:items-end">
        {/* Foto a sangre. En móvil va arriba y el bloque carbón debajo, sin texto encima. */}
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
          <Imagen src={FOTO_HERO} alt={t('heroAlt')} sizes="100vw" priority />
        </div>
        <div className="relative border-t-4 border-cuero bg-carbon px-4 py-8 sm:px-8 lg:mb-16 lg:ml-[max(1rem,calc((100vw-64rem)/2+1rem))] lg:max-w-3xl lg:border-t-0 lg:border-l-8 lg:p-10">
          <p
            className="entrar mb-3 text-sm font-semibold tracking-wide text-cuero"
            style={{ '--i': 0 } as React.CSSProperties}
          >
            {t('etiqueta')}
          </p>
          <h1
            className="entrar titulo-hero text-[3.25rem] sm:text-7xl lg:text-8xl"
            style={{ '--i': 1 } as React.CSSProperties}
          >
            {t('titulo')}
          </h1>
          <p
            className="entrar mt-4 max-w-xl text-lg text-hueso-suave"
            style={{ '--i': 2 } as React.CSSProperties}
          >
            {t('subtitulo')}
          </p>
          <div
            className="entrar mt-6"
            style={{ '--i': 3 } as React.CSSProperties}
          >
            <a href="#operadores" className={botonClases('primario')}>
              {c('verTours')}
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-5xl flex-col gap-20 px-4 pt-12 pb-0 md:pt-16">
        <section id="operadores" className="flex scroll-mt-24 flex-col gap-6">
          <h2 className="titulo text-4xl md:text-5xl">{t('operadores')}</h2>
          {!negociosVisibles.length ? (
            <EmptyState titulo={t('vacio')} />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {negociosVisibles.map((n) => {
                const cantidad = n.tours[0]?.count ?? 0;
                const descripcion =
                  locale === 'en' ? n.descripcion_en : n.descripcion_es;
                const portada =
                  n.portada_url ??
                  primeraImagenPorNegocio.get(n.id) ??
                  IMAGEN_RESPALDO;
                return (
                  <li key={n.slug}>
                    <Link
                      href={`/${n.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta transition-[transform,border-color] duration-200 ease-[var(--ease-out)] hover:border-primario motion-safe:hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Imagen
                          src={portada}
                          alt={n.nombre}
                          sizes="(min-width: 1024px) 480px, (min-width: 640px) 45vw, 100vw"
                          className="object-cover transition-transform duration-500 ease-[var(--ease-out)] motion-safe:group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <span className="text-xl font-semibold">
                          {n.nombre}
                        </span>
                        {descripcion && (
                          <span className="text-texto-suave">
                            {descripcion}
                          </span>
                        )}
                        <span className="mt-auto pt-1 text-sm font-semibold">
                          {t('cantidadTours', { count: cantidad })}
                          <span
                            aria-hidden="true"
                            className="ml-1 inline-block transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          id="como-funciona"
          className="flex scroll-mt-24 flex-col gap-6"
        >
          <h2 className="titulo text-4xl md:text-5xl">{t('comoTitulo')}</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {PASOS.map((p) => (
              <li key={p} className="border-t-2 border-primario pt-4">
                <h3 className="text-lg font-semibold">
                  {t(`pasos.${p}.titulo`)}
                </h3>
                <p className="mt-1 text-texto-suave">{t(`pasos.${p}.texto`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-8 rounded-tarjeta border-2 border-primario bg-superficie p-8 md:grid-cols-2 md:p-12">
          <div className="flex flex-col gap-4">
            <h2 className="titulo text-4xl md:text-5xl">{t('opTitulo')}</h2>
            <p className="text-texto-suave">{t('opTexto')}</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <NextLink href="/registro" className={botonClases('secundario')}>
                {t('opCta')}
              </NextLink>
              <NextLink
                href="/login"
                className="inline-flex h-11 items-center justify-center font-semibold underline underline-offset-4"
              >
                {t('opLogin')}
              </NextLink>
            </div>
          </div>
          <ul className="flex flex-col justify-center gap-3">
            {BENEFICIOS.map((b) => (
              <li key={b} className="border-t border-borde pt-3 text-lg">
                {t(`opBeneficios.${b}`)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
