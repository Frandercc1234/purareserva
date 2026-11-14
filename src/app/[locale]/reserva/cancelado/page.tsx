import { getTranslations, setRequestLocale } from 'next-intl/server';
import { botonClases } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Link } from '@/i18n/routing';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export default async function CanceladoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale } = await params;
  const { t: token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('Cancelado');

  // Para volver al tour se busca la reserva por su token.
  let destino: string | null = null;
  if (token) {
    const { data } = await createAdminClient()
      .from('reservas')
      .select('salidas(tours(slug, negocios(slug)))')
      .eq('token_hash', hashToken(token))
      .maybeSingle();
    const tour = data?.salidas?.tours;
    if (tour?.negocios?.slug) destino = `/${tour.negocios.slug}/${tour.slug}`;
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12">
      <Card className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold">{t('titulo')}</h1>
        <p className="text-texto-suave">{t('cuerpo')}</p>
        <div>
          <Link href={destino ?? '/'} className={botonClases()}>
            {destino ? t('volverTour') : t('volverInicio')}
          </Link>
        </div>
      </Card>
    </main>
  );
}
