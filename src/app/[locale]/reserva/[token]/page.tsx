import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CancelarReserva } from '@/components/publico/CancelarReserva';
import { ResumenReserva } from '@/components/publico/ResumenReserva';
import { WhatsAppButton } from '@/components/publico/WhatsAppButton';
import { Badge, type TonoBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { evaluarCancelacion } from '@/lib/cancelacion';
import { formatearUSD } from '@/lib/dinero';
import { formatearFechaHora } from '@/lib/fechas';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/tokens';

export const dynamic = 'force-dynamic';

const TONOS: Record<string, TonoBadge> = {
  confirmada: 'exito',
  pendiente_pago: 'aviso',
  cancelada: 'error',
  reembolsada: 'neutro',
  expirada: 'neutro',
};

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('ReservaPagina');

  const { data: r } = await createAdminClient()
    .from('reservas')
    .select(
      'nombre, personas, estado, total_cents, deposito_cents, salidas(inicia_en, tours(nombre_es, nombre_en, punto_encuentro, punto_encuentro_en, negocios(nombre, email_contacto, whatsapp, horas_cancelacion)))',
    )
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  const salida = r?.salidas;
  const tour = salida?.tours;
  const negocio = tour?.negocios;
  if (!r || !salida || !tour || !negocio) notFound();

  const iniciaEn = new Date(salida.inicia_en);
  const { reembolso } = evaluarCancelacion(
    iniciaEn,
    negocio.horas_cancelacion,
    new Date(),
  );
  const puedeCancelar =
    r.estado === 'confirmada' && iniciaEn.getTime() > Date.now();

  const punto =
    (locale === 'en' && tour.punto_encuentro_en) || tour.punto_encuentro;

  const nota: Record<string, string> = {
    cancelada: t('notaCancelada'),
    reembolsada: t('notaReembolsada'),
    pendiente_pago: t('notaPendiente'),
    expirada: t('notaExpirada'),
  };

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="titulo text-4xl break-words md:text-5xl">{r.nombre}</h1>
        <Badge tono={TONOS[r.estado] ?? 'neutro'}>
          {t(`estados.${r.estado}` as 'estados.confirmada')}
        </Badge>
      </div>

      {nota[r.estado] && <p className="text-texto-suave">{nota[r.estado]}</p>}

      <Card>
        <ResumenReserva
          datos={{
            tour: locale === 'en' ? tour.nombre_en : tour.nombre_es,
            fecha: formatearFechaHora(salida.inicia_en, locale),
            personas: r.personas,
            total: formatearUSD(r.total_cents, locale),
            deposito: formatearUSD(r.deposito_cents, locale),
            saldo: formatearUSD(r.total_cents - r.deposito_cents, locale),
            punto,
            operador: negocio.nombre,
          }}
        />
      </Card>

      {puedeCancelar && (
        <CancelarReserva
          token={token}
          reembolso={reembolso}
          horas={negocio.horas_cancelacion}
          deposito={formatearUSD(r.deposito_cents, locale)}
        />
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t('contacto')}</h2>
        <p className="text-texto-suave">{negocio.email_contacto}</p>
        <div>
          <WhatsAppButton numero={negocio.whatsapp} />
        </div>
      </section>
    </main>
  );
}
