import { getTranslations } from 'next-intl/server';

export type DatosResumen = {
  tour: string;
  fecha: string;
  personas: number;
  total: string;
  deposito: string;
  saldo: string;
  punto?: string | null;
  operador: string;
};

/** Datos de la reserva como un boleto: qué, cuándo, dónde y cuánto falta por pagar. */
export async function ResumenReserva({ datos }: { datos: DatosResumen }) {
  const t = await getTranslations('ReservaPagina');
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xl font-semibold break-words">{datos.tour}</p>
        <p className="text-lg">{datos.fecha}</p>
      </div>
      <dl className="grid gap-x-6 gap-y-3 border-t border-borde pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-texto-suave">{t('personas')}</dt>
          <dd className="font-semibold">{datos.personas}</dd>
        </div>
        <div>
          <dt className="text-sm text-texto-suave">{t('operador')}</dt>
          <dd className="font-semibold">{datos.operador}</dd>
        </div>
        {datos.punto && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-texto-suave">{t('punto')}</dt>
            <dd className="font-semibold">{datos.punto}</dd>
          </div>
        )}
      </dl>
      <dl className="flex flex-col gap-1 rounded-control bg-fondo p-3">
        <div className="flex justify-between gap-4">
          <dt>{t('total')}</dt>
          <dd>{datos.total}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>{t('deposito')}</dt>
          <dd>{datos.deposito}</dd>
        </div>
        <div className="flex justify-between gap-4 font-semibold">
          <dt>{t('saldo')}</dt>
          <dd>{datos.saldo}</dd>
        </div>
      </dl>
    </div>
  );
}
