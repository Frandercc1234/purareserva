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

const HECHOS = ['cupo', 'deposito', 'idiomas'] as const;
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

  const primeraImagenPorNegocio = new Map<string, string>();
  for (const tour of tours ?? []) {
    if (tour.imagen_url && !primeraImagenPorNegocio.has(tour.negocio_id))
      primeraImagenPorNegocio.set(tour.negocio_id, tour.imagen_url);
  }
  const fotosHero = (tours ?? [])
    .map((tour) => tour.imagen_url)
    .filter((u): u is string => !!u);
  while (fotosHero.length < 3) fotosHero.push(IMAGEN_RESPALDO);

  return (
    <main>
      <section className="relative overflow-hidden bg-primario-oscuro text-superficie">
        {/* Móvil: la primera foto de fondo, atenuada. */}
        <div className="absolute inset-0 lg:hidden">
          <Imagen src={fotosHero[0]} alt="" sizes="100vw" priority />
          <div className="absolute inset-0 bg-primario-oscuro/85" />
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-24 w-full md:h-40"
        >
          <path
            d="M0 120c240-80 480-80 720 0s480 80 720 0v80H0z"
            fill="#0E7C86"
            fillOpacity=".55"
          />
          <path
            d="M0 150c240-60 480-60 720 0s480 60 720 0v50H0z"
            fill="#FAFAF7"
          />
        </svg>
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 pt-14 pb-32 md:pt-20 md:pb-44 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-6">
            <p
              className="entrar inline-flex w-fit items-center gap-2 rounded-full bg-superficie/10 px-3 py-1 text-sm font-semibold"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <span className="size-2 rounded-full bg-acento" />
              {t('etiqueta')}
            </p>
            <h1
              className="entrar max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl"
              style={{ '--i': 1 } as React.CSSProperties}
            >
              {t('titulo')}
            </h1>
            <p
              className="entrar max-w-xl text-lg text-superficie/85 md:text-xl"
              style={{ '--i': 2 } as React.CSSProperties}
            >
              {t('subtitulo')}
            </p>
            <div className="entrar" style={{ '--i': 3 } as React.CSSProperties}>
              <a
                href="#operadores"
                className={botonClases('onDark', 'w-full sm:w-auto')}
              >
                {c('verTours')}
              </a>
            </div>
            <dl
              className="entrar mt-4 grid gap-4 border-t border-superficie/20 pt-6 sm:grid-cols-3"
              style={{ '--i': 4 } as React.CSSProperties}
            >
              {HECHOS.map((h) => (
                <div key={h} className="flex flex-col">
                  <dt className="text-2xl font-semibold text-acento">
                    {t(`hechos.${h}.valor`)}
                  </dt>
                  <dd className="text-sm text-superficie/80">
                    {t(`hechos.${h}.texto`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Escritorio: composición con tres fotos de tours activos. */}
          <div
            aria-hidden="true"
            className="entrar hidden h-[380px] grid-cols-2 grid-rows-2 gap-3 lg:grid"
            style={{ '--i': 2 } as React.CSSProperties}
          >
            <div className="relative row-span-2 overflow-hidden rounded-tarjeta">
              <Imagen
                src={fotosHero[0]}
                alt=""
                sizes="(min-width: 1024px) 25vw, 0px"
                priority
              />
            </div>
            <div className="relative overflow-hidden rounded-tarjeta">
              <Imagen
                src={fotosHero[1]}
                alt=""
                sizes="(min-width: 1024px) 25vw, 0px"
              />
            </div>
            <div className="relative overflow-hidden rounded-tarjeta">
              <Imagen
                src={fotosHero[2]}
                alt=""
                sizes="(min-width: 1024px) 25vw, 0px"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-12 md:py-16">
        <section id="operadores" className="flex scroll-mt-24 flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t('operadores')}
          </h2>
          {!negocios?.length ? (
            <EmptyState titulo={t('vacio')} />
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {negocios.map((n, i) => {
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
                      className="group flex h-full flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-tarjeta transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] hover:border-primario/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <Imagen
                          src={portada}
                          alt={n.nombre}
                          sizes="(min-width: 1024px) 480px, (min-width: 640px) 45vw, 100vw"
                          priority={i === 0}
                          className="object-cover transition-transform duration-500 ease-[var(--ease-out)] motion-safe:group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <span className="text-xl font-semibold group-hover:text-primario">
                          {n.nombre}
                        </span>
                        {descripcion && (
                          <span className="text-texto-suave">
                            {descripcion}
                          </span>
                        )}
                        <span className="mt-auto pt-1 text-sm font-semibold text-primario">
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
          className="flex scroll-mt-24 flex-col gap-8"
        >
          <h2 className="text-3xl font-semibold tracking-tight">
            {t('comoTitulo')}
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p} className="flex flex-col gap-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-acento/20 font-semibold text-aviso">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">
                  {t(`pasos.${p}.titulo`)}
                </h3>
                <p className="text-texto-suave">{t(`pasos.${p}.texto`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-8 rounded-tarjeta bg-primario-oscuro p-8 text-superficie md:grid-cols-2 md:p-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {t('opTitulo')}
            </h2>
            <p className="text-superficie/85">{t('opTexto')}</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <NextLink href="/registro" className={botonClases('onDark')}>
                {t('opCta')}
              </NextLink>
              <NextLink
                href="/login"
                className="inline-flex h-11 items-center justify-center font-semibold underline underline-offset-4 hover:text-acento"
              >
                {t('opLogin')}
              </NextLink>
            </div>
          </div>
          <ul className="flex flex-col justify-center gap-4">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-acento text-sm font-semibold text-texto"
                >
                  ✓
                </span>
                <span className="text-lg">{t(`opBeneficios.${b}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
