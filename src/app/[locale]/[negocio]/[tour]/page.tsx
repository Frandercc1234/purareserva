import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ReservaForm } from '@/components/publico/ReservaForm';
import { WhatsAppButton } from '@/components/publico/WhatsAppButton';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { formatearUSD } from '@/lib/dinero';
import { formatearDuracion } from '@/lib/fechas';
import { IMAGEN_RESPALDO } from '@/lib/imagenes';
import { alternativas, recortar, tituloNoEncontrada } from '@/lib/seo';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; negocio: string; tour: string }>;
}): Promise<Metadata> {
  const { locale, negocio: negocioSlug, tour: tourSlug } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const supabase = createPublicClient();
  const { data: negocio } = await supabase
    .from('negocios')
    .select('id, nombre')
    .eq('slug', negocioSlug)
    .maybeSingle();
  if (!negocio) return await tituloNoEncontrada(locale);
  const { data: tour } = await supabase
    .from('tours')
    .select(
      'nombre_es, nombre_en, descripcion_es, descripcion_en, precio_cents, imagen_url',
    )
    .eq('negocio_id', negocio.id)
    .eq('slug', tourSlug)
    .maybeSingle();
  if (!tour) return await tituloNoEncontrada(locale);

  const nombre = locale === 'en' ? tour.nombre_en : tour.nombre_es;
  const titulo = `${nombre} – ${negocio.nombre}`;
  const texto = locale === 'en' ? tour.descripcion_en : tour.descripcion_es;
  const descripcion = `${t('precioPorPersona', {
    precio: formatearUSD(tour.precio_cents, locale),
  })} ${recortar(texto)}`.trim();
  return {
    title: titulo,
    description: descripcion,
    alternates: alternativas(locale, `/${negocioSlug}/${tourSlug}`),
    openGraph: {
      title: titulo,
      description: descripcion,
      images: [{ url: tour.imagen_url ?? IMAGEN_RESPALDO, alt: nombre }],
      locale: locale === 'en' ? 'en_US' : 'es_CR',
    },
  };
}

export default async function TourPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; negocio: string; tour: string }>;
  searchParams: Promise<{ salida?: string; personas?: string }>;
}) {
  const { locale, negocio: negocioSlug, tour: tourSlug } = await params;
  const { salida: salidaParam, personas: personasParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('Tour');
  const c = await getTranslations('Comun');
  const supabase = createPublicClient();

  const { data: negocio } = await supabase
    .from('negocios')
    .select('id, slug, nombre, whatsapp, deposito_pct, horas_cancelacion')
    .eq('slug', negocioSlug)
    .maybeSingle();
  if (!negocio) notFound();

  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('negocio_id', negocio.id)
    .eq('slug', tourSlug)
    .maybeSingle();
  if (!tour) notFound();

  // Salidas futuras con más de 1 hora de anticipación (igual que crear_reserva).
  const limite = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data: salidas } = await supabase
    .from('salidas_ocupacion')
    .select('id, inicia_en, cupo, ocupados')
    .eq('tour_id', tour.id)
    .eq('estado', 'programada')
    .gt('inicia_en', limite)
    .order('inicia_en', { ascending: true })
    .limit(200);

  const disponibles = (salidas ?? []).flatMap((s) =>
    s.id && s.inicia_en
      ? [
          {
            id: s.id,
            inicia_en: s.inicia_en,
            libres: (s.cupo ?? 0) - (s.ocupados ?? 0),
          },
        ]
      : [],
  );

  const nombre = locale === 'en' ? tour.nombre_en : tour.nombre_es;
  const punto =
    (locale === 'en' && tour.punto_encuentro_en) || tour.punto_encuentro;
  const descripcion =
    locale === 'en' ? tour.descripcion_en : tour.descripcion_es;

  // Salida y personas que vienen en el enlace (por ejemplo, desde el asistente). Se validan
  // contra los cupos libres; el servidor vuelve a validar al reservar.
  const salidaInicial = disponibles.find(
    (s) => s.id === salidaParam && s.libres > 0,
  );
  const personasPedidas = Number.parseInt(personasParam ?? '', 10);
  const personasInicial =
    Number.isInteger(personasPedidas) && personasPedidas >= 1
      ? Math.min(personasPedidas, salidaInicial?.libres ?? 50)
      : 1;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-28 md:py-10 lg:pb-12">
      <div className="grid items-start gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <Link
            href={`/${negocio.slug}`}
            className="inline-flex h-11 w-fit items-center text-primario underline"
          >
            {negocio.nombre}
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tour.imagen_url ?? '/tour-default.svg'}
            alt={nombre}
            className="aspect-video w-full rounded-tarjeta object-cover"
          />
          <h1 className="text-3xl font-semibold tracking-tight">{nombre}</h1>
          <p>
            <span className="text-2xl font-semibold text-texto">
              {formatearUSD(tour.precio_cents, locale)}
            </span>{' '}
            <span className="text-texto-suave">{c('porPersona')}</span>
          </p>
          {descripcion && <p className="text-texto-suave">{descripcion}</p>}
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-texto-suave">{t('duracion')}</dt>
              <dd>{formatearDuracion(tour.duracion_min)}</dd>
            </div>
            {punto && (
              <div>
                <dt className="text-sm text-texto-suave">
                  {t('puntoEncuentro')}
                </dt>
                <dd>{punto}</dd>
              </div>
            )}
          </dl>
          <div className="flex flex-col gap-1 border-t border-borde pt-4 text-sm text-texto-suave">
            <p>{t('deposito', { pct: negocio.deposito_pct })}</p>
            <p>{t('cancelacion', { horas: negocio.horas_cancelacion })}</p>
          </div>
        </div>

        <Card className="flex h-fit min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          {disponibles.length ? (
            <ReservaForm
              salidas={disponibles}
              salidaInicialId={salidaInicial?.id ?? null}
              personasInicial={personasInicial}
              precioCents={tour.precio_cents}
              depositoPct={negocio.deposito_pct}
            />
          ) : (
            <EmptyState
              titulo={t('sinSalidas')}
              descripcion={t('sinSalidasAyuda')}
              accion={<WhatsAppButton numero={negocio.whatsapp} />}
            />
          )}
        </Card>
      </div>
    </main>
  );
}
