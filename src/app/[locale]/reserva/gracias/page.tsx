import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ConfirmandoPago } from '@/components/publico/ConfirmandoPago';
import { ResumenReserva } from '@/components/publico/ResumenReserva';
import { WhatsAppButton } from '@/components/publico/WhatsAppButton';
import { botonClases } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Link } from '@/i18n/routing';
import { formatearUSD } from '@/lib/dinero';
import { formatearFechaHora } from '@/lib/fechas';
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
    .select(
      'estado, personas, total_cents, deposito_cents, salidas(inicia_en, tours(nombre_es, nombre_en, punto_encuentro, punto_encuentro_en, negocios(nombre, email_contacto, whatsapp)))',
    )
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (!reserva) notFound();

  const salida = reserva.salidas;
  const tour = salida?.tours;
  const negocio = tour?.negocios;
  const datos =
    salida && tour && negocio
      ? {
          tour: locale === 'en' ? tour.nombre_en : tour.nombre_es,
          fecha: formatearFechaHora(salida.inicia_en, locale),
          personas: reserva.personas,
          total: formatearUSD(reserva.total_cents, locale),
          deposito: formatearUSD(reserva.deposito_cents, locale),
          saldo: formatearUSD(
            reserva.total_cents - reserva.deposito_cents,
            locale,
          ),
          punto:
            (locale === 'en' && tour.punto_encuentro_en) ||
            tour.punto_encuentro,
          operador: negocio.nombre,
        }
      : null;

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
            {datos && <ResumenReserva datos={datos} />}
            <p className="text-texto-suave">{t('correo')}</p>
            <div>
              <Link href={`/reserva/${token}`} className={botonClases()}>
                {t('verReserva')}
              </Link>
            </div>
            {negocio && (
              <section className="flex flex-col gap-2 border-t border-borde pt-4">
                <h2 className="text-lg font-semibold">{t('contacto')}</h2>
                <p className="text-texto-suave">{negocio.email_contacto}</p>
                <div>
                  <WhatsAppButton numero={negocio.whatsapp} />
                </div>
              </section>
            )}
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
