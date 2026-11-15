import NextLink from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { botonClases } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

const HECHOS = ['cupo', 'deposito', 'idiomas'] as const;
const PASOS = ['uno', 'dos', 'tres'] as const;
const BENEFICIOS = ['uno', 'dos', 'tres'] as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Landing');

  const { data: negocios } = await createPublicClient()
    .from('negocios')
    .select('slug, nombre, descripcion_es, descripcion_en, tours(count)')
    .order('nombre');

  return (
    <main>
      <section className="relative overflow-hidden bg-primario-oscuro text-superficie">
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
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-14 pb-32 md:pt-24 md:pb-48">
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
          <div
            className="entrar flex flex-col gap-3 sm:flex-row"
            style={{ '--i': 3 } as React.CSSProperties}
          >
            <a
              href="#operadores"
              className={botonClases(
                'primario',
                'bg-superficie !text-primario-oscuro hover:bg-fondo',
              )}
            >
              {t('verOperadores')}
            </a>
            <NextLink
              href="/registro"
              className={botonClases(
                'secundario',
                'border-superficie/60 bg-transparent !text-superficie hover:border-superficie hover:bg-superficie/10',
              )}
            >
              {t('opCta')}
            </NextLink>
          </div>
          <dl
            className="entrar mt-6 grid gap-4 border-t border-superficie/20 pt-6 sm:grid-cols-3"
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
      </section>

      <div className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-12 md:py-16">
        <section id="operadores" className="flex scroll-mt-24 flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t('operadores')}
          </h2>
          {!negocios?.length ? (
            <EmptyState titulo={t('vacio')} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {negocios.map((n) => {
                const cantidad = n.tours[0]?.count ?? 0;
                const descripcion =
                  locale === 'en' ? n.descripcion_en : n.descripcion_es;
                return (
                  <li key={n.slug}>
                    <Link
                      href={`/${n.slug}`}
                      className="group flex h-full flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-6 shadow-tarjeta transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] hover:border-primario/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
                    >
                      <span className="flex size-11 items-center justify-center rounded-full bg-primario/10 text-lg font-semibold text-primario">
                        {n.nombre.charAt(0)}
                      </span>
                      <span className="text-xl font-semibold group-hover:text-primario">
                        {n.nombre}
                      </span>
                      {descripcion && (
                        <span className="text-texto-suave">{descripcion}</span>
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
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-8">
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
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <NextLink
                href="/registro"
                className={botonClases(
                  'primario',
                  'bg-acento !text-texto hover:bg-acento/90',
                )}
              >
                {t('opCta')}
              </NextLink>
              <NextLink
                href="/login"
                className={botonClases(
                  'secundario',
                  'border-superficie/60 bg-transparent !text-superficie hover:border-superficie hover:bg-superficie/10',
                )}
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
