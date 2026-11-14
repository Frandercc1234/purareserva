'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/components/ui/cn';
import { diaCR, formatearDia, formatearHora } from '@/lib/fechas';

export type SalidaDisponible = {
  id: string;
  inicia_en: string;
  libres: number;
};

export function SalidaPicker({
  salidas,
  onSeleccionar,
}: {
  salidas: SalidaDisponible[];
  onSeleccionar?: (salida: SalidaDisponible | null) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('Tour');
  const [elegida, setElegida] = useState<string | null>(null);

  const dias = new Map<string, SalidaDisponible[]>();
  for (const s of salidas) {
    const k = diaCR(s.inicia_en);
    dias.set(k, [...(dias.get(k) ?? []), s]);
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-lg font-semibold">
        {t('elegirSalida')}
      </legend>
      {[...dias.entries()].map(([dia, lista]) => (
        <div key={dia} className="flex flex-col gap-2">
          <p className="font-semibold first-letter:uppercase">
            {formatearDia(lista[0].inicia_en, locale)}
          </p>
          <div className="flex flex-wrap gap-2">
            {lista.map((s) => {
              const agotado = s.libres <= 0;
              const on = elegida === s.id;
              return (
                <label
                  key={s.id}
                  className={cn(
                    'flex min-h-11 cursor-pointer flex-col justify-center rounded-control border px-4 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primario',
                    agotado &&
                      'cursor-not-allowed border-borde bg-fondo text-texto-suave',
                    !agotado &&
                      on &&
                      'border-primario bg-primario text-superficie',
                    !agotado &&
                      !on &&
                      'border-borde bg-superficie hover:border-primario',
                  )}
                >
                  <input
                    type="radio"
                    name="salida_id"
                    value={s.id}
                    disabled={agotado}
                    checked={on}
                    onChange={() => {
                      setElegida(s.id);
                      onSeleccionar?.(s);
                    }}
                    className="sr-only"
                  />
                  <span className="font-semibold">
                    {formatearHora(s.inicia_en, locale)}
                  </span>
                  <span className="text-sm">
                    {agotado ? t('agotado') : t('cupos', { count: s.libres })}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
