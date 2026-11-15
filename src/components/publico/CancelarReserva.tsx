'use client';

import { useTranslations } from 'next-intl';
import { startTransition, useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import {
  cancelarReserva,
  type EstadoCancelacion,
} from '@/app/[locale]/reserva/[token]/actions';

export function CancelarReserva({
  token,
  reembolso,
  horas,
  deposito,
}: {
  token: string;
  reembolso: boolean;
  horas: number;
  deposito: string;
}) {
  const t = useTranslations('ReservaPagina');
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, pendiente] = useActionState<
    EstadoCancelacion,
    FormData
  >(cancelarReserva, null);

  // Al terminar bien, la página se vuelve a renderizar con el nuevo estado.
  useEffect(() => {
    if (estado?.ok) setAbierto(false);
  }, [estado]);

  return (
    <>
      <div>
        <Button variante="secundario" onClick={() => setAbierto(true)}>
          {t('cancelar')}
        </Button>
      </div>
      <Dialog
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={t('dialogoTitulo')}
      >
        <p className="text-texto-suave">
          {reembolso
            ? t('conReembolso', { monto: deposito })
            : t('sinReembolso', { horas, monto: deposito })}
        </p>
        {estado && !estado.ok && (
          <p role="alert" className="text-error">
            {t(`errores.${estado.error}` as 'errores.DESCONOCIDO')}
          </p>
        )}
        <form
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            const datos = new FormData(e.currentTarget);
            startTransition(() => accion(datos));
          }}
          className="flex flex-wrap justify-end gap-2"
        >
          <input type="hidden" name="token" value={token} />
          <Button
            variante="secundario"
            onClick={() => setAbierto(false)}
            disabled={pendiente}
          >
            {t('volver')}
          </Button>
          <Button type="submit" disabled={pendiente}>
            {pendiente ? t('cancelando') : t('confirmarCancelar')}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
