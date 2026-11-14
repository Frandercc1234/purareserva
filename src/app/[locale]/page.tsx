import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/routing';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

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
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 md:py-16">
      <section className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl font-semibold md:text-4xl">{t('titulo')}</h1>
        <p className="text-lg text-texto-suave">{t('subtitulo')}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">{t('operadores')}</h2>
        {!negocios?.length ? (
          <EmptyState titulo={t('vacio')} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {negocios.map((n) => {
              const cantidad = n.tours[0]?.count ?? 0;
              const descripcion =
                locale === 'en' ? n.descripcion_en : n.descripcion_es;
              return (
                <li key={n.slug}>
                  <Link href={`/${n.slug}`} className="block h-full">
                    <Card className="flex h-full flex-col gap-1 hover:border-primario">
                      <span className="text-lg font-semibold">{n.nombre}</span>
                      {descripcion && (
                        <span className="text-sm text-texto-suave">
                          {descripcion}
                        </span>
                      )}
                      <span className="mt-1 text-sm font-semibold text-primario">
                        {t('cantidadTours', { count: cantidad })}
                      </span>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
