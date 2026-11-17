import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ConfirmandoPago } from '@/components/publico/ConfirmandoPago';
import { botonClases } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Link } from '@/i18n/routing';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

export default async function GraciasPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { locale } = await params;
  const { t: token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('Gracias');
  if (!token) notFound();

  const { data: reserva } = await createAdminClient()
    .from('reservas')
    .select('estado')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (!reserva) notFound();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12">
      <Card className="flex flex-col gap-4">
        <h1 className="titulo text-5xl">{t('titulo')}</h1>
        {reserva.estado === 'pendiente_pago' && <ConfirmandoPago />}
        {reserva.estado === 'confirmada' && (
          <>
            <p className="text-lg font-semibold text-exito">
              {t('confirmada')}
            </p>
            <p className="text-texto-suave">{t('confirmadaAyuda')}</p>
            <div>
              <Link href={`/reserva/${token}`} className={botonClases()}>
                {t('verReserva')}
              </Link>
            </div>
          </>
        )}
        {reserva.estado !== 'pendiente_pago' &&
          reserva.estado !== 'confirmada' && (
            <>
              <p className="text-texto-suave">{t('noConfirmada')}</p>
              <div>
                <Link href="/" className={botonClases('secundario')}>
                  {t('volverInicio')}
                </Link>
              </div>
            </>
          )}
      </Card>
    </main>
  );
}
