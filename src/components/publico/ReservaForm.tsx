'use client';

import { useLocale, useTranslations } from 'next-intl';
import { startTransition, useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SalidaPicker,
  type SalidaDisponible,
} from '@/components/publico/SalidaPicker';
import {
  crearReserva,
  type EstadoReserva,
} from '@/app/[locale]/[negocio]/[tour]/actions';
import { formatearUSD } from '@/lib/dinero';

export function ReservaForm({
  salidas,
  precioCents,
  depositoPct,
}: {
  salidas: SalidaDisponible[];
  precioCents: number;
  depositoPct: number;
}) {
  const locale = useLocale();
  const t = useTranslations('Reserva');
  const [estado, accion, pendiente] = useActionState<EstadoReserva, FormData>(
    crearReserva,
    null,
  );
  const [salida, setSalida] = useState<SalidaDisponible | null>(null);
  const [personas, setPersonas] = useState('1');

  const campos = estado?.campos ?? {};
  const err = (campo: string) =>
    campos[campo] ? t(`errores.${campo}` as 'errores.nombre') : undefined;

  // Solo para mostrar: el servidor recalcula total y depósito desde la base.
  const n = Math.max(1, Math.min(Number(personas) || 1, salida?.libres ?? 50));
  const total = precioCents * n;
  const deposito = Math.round((total * depositoPct) / 100);

  const errorGeneral =
    estado && !estado.campos ? t(`errores.${estado.error}`) : null;

  return (
    <form
      method="post"
      onSubmit={(e) => {
        // Sin reinicio automático: si hay un error se conservan los datos.
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        startTransition(() => accion(datos));
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <input type="hidden" name="idioma" value={locale} />
      <div>
        <SalidaPicker
          salidas={salidas}
          onSeleccionar={(s) => {
            setSalida(s);
            if (s && Number(personas) > s.libres) setPersonas(String(s.libres));
          }}
        />
        {campos.salida_id && (
          <p role="alert" className="mt-2 text-sm text-error">
            {err('salida_id')}
          </p>
        )}
      </div>

      <h2 className="text-lg font-semibold">{t('titulo')}</h2>
      <Input
        label={t('nombre')}
        name="nombre"
        autoComplete="name"
        error={err('nombre')}
      />
      <Input
        label={t('email')}
        name="email"
        type="email"
        autoComplete="email"
        error={err('email')}
      />
      <Input
        label={t('telefono')}
        name="telefono"
        type="tel"
        autoComplete="tel"
        error={err('telefono')}
      />
      <Input
        label={t('personas')}
        name="personas"
        type="number"
        inputMode="numeric"
        min={1}
        max={salida?.libres ?? 50}
        value={personas}
        onChange={(e) => setPersonas(e.target.value)}
        hint={salida ? t('personasAyuda', { max: salida.libres }) : undefined}
        error={err('personas')}
      />

      <dl className="flex flex-col gap-1 rounded-control bg-fondo p-3 text-sm">
        <div className="flex justify-between">
          <dt>{t('total')}</dt>
          <dd>{formatearUSD(total, locale)}</dd>
        </div>
        <div className="flex justify-between font-semibold text-primario">
          <dt>{t('depositoAhora')}</dt>
          <dd>{formatearUSD(deposito, locale)}</dd>
        </div>
        <div className="flex justify-between text-texto-suave">
          <dt>{t('saldo')}</dt>
          <dd>{formatearUSD(total - deposito, locale)}</dd>
        </div>
      </dl>

      {errorGeneral && (
        <p role="alert" className="text-error">
          {errorGeneral}
        </p>
      )}

      {/* En móvil el botón queda fijo abajo. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <Button type="submit" disabled={pendiente} className="w-full">
          {pendiente
            ? t('procesando')
            : t('pagar', { monto: formatearUSD(deposito, locale) })}
        </Button>
      </div>
    </form>
  );
}
