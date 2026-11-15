'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/components/ui/cn';
import {
  diaCR,
  formatearDia,
  formatearDiaCorto,
  formatearHora,
} from '@/lib/fechas';

export type SalidaDisponible = {
  id: string;
  inicia_en: string;
  libres: number;
};

const DIAS_MAXIMOS = 14;
const DIAS_VISIBLES = 7;

/**
 * Selector de salidas en dos niveles: una tira de días (7 a la vez en pantallas
 * medianas y grandes; deslizable en móvil) y los horarios del día elegido.
 */
export function SalidaPicker({
  salidas,
  seleccionadaId,
  onSeleccionar,
  error,
}: {
  salidas: SalidaDisponible[];
  seleccionadaId: string | null;
  onSeleccionar: (salida: SalidaDisponible) => void;
  error?: string;
}) {
  const locale = useLocale();
  const t = useTranslations('Tour');

  const porDia = new Map<string, SalidaDisponible[]>();
  for (const s of salidas) {
    const k = diaCR(s.inicia_en);
    porDia.set(k, [...(porDia.get(k) ?? []), s]);
  }
  const dias = [...porDia.entries()].slice(0, DIAS_MAXIMOS);

  // Día inicial: el de la salida elegida (por ejemplo, desde la URL) o el primero con cupo.
  const diaDeLaElegida = salidas.find((s) => s.id === seleccionadaId);
  const diaInicial =
    (diaDeLaElegida && diaCR(diaDeLaElegida.inicia_en)) ??
    dias.find(([, l]) => l.some((s) => s.libres > 0))?.[0] ??
    dias[0]?.[0];
  const [dia, setDia] = useState(diaInicial);
  const indice = Math.max(
    0,
    dias.findIndex(([d]) => d === dia),
  );
  const [inicio, setInicio] = useState(
    Math.min(
      Math.floor(
        Math.max(
          0,
          dias.findIndex(([d]) => d === diaInicial),
        ) / DIAS_VISIBLES,
      ) * DIAS_VISIBLES,
      Math.max(0, dias.length - DIAS_VISIBLES),
    ),
  );
  const maxInicio = Math.max(0, dias.length - DIAS_VISIBLES);
  const horarios = dias[indice]?.[1] ?? [];

  return (
    <fieldset
      id="selector-salida"
      aria-describedby={error ? 'selector-salida-error' : undefined}
      className="flex min-w-0 flex-col gap-3"
    >
      <legend className="mb-1 text-lg font-semibold">
        {t('elegirSalida')}
      </legend>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('diasAnteriores')}
          disabled={inicio === 0}
          onClick={() => setInicio((i) => Math.max(0, i - DIAS_VISIBLES))}
          className="hidden h-16 w-8 shrink-0 items-center justify-center rounded-control text-lg text-primario transition-colors duration-150 hover:bg-fondo disabled:text-borde sm:flex"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div
          role="group"
          aria-label={t('dias')}
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto sm:overflow-visible"
        >
          {dias.map(([d, lista], i) => {
            const { semana, numero } = formatearDiaCorto(
              lista[0].inicia_en,
              locale,
            );
            const activo = d === dia;
            const hayCupo = lista.some((s) => s.libres > 0);
            const visible = i >= inicio && i < inicio + DIAS_VISIBLES;
            return (
              <button
                key={d}
                type="button"
                aria-pressed={activo}
                aria-label={formatearDia(lista[0].inicia_en, locale)}
                data-foco={activo ? '' : undefined}
                onClick={() => setDia(d)}
                className={cn(
                  'flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-control border transition-[background-color,border-color,color,transform] duration-150 ease-[var(--ease-out)] motion-safe:active:scale-[0.97] sm:w-auto sm:flex-1',
                  !visible && 'sm:hidden',
                  activo
                    ? 'border-primario bg-primario text-superficie'
                    : 'border-borde bg-superficie hover:border-primario',
                )}
              >
                <span className="text-xs uppercase">{semana}</span>
                <span className="text-lg leading-none font-semibold">
                  {numero}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1.5 rounded-full',
                    hayCupo
                      ? activo
                        ? 'bg-acento'
                        : 'bg-exito'
                      : 'bg-transparent',
                  )}
                />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label={t('diasSiguientes')}
          disabled={inicio >= maxInicio}
          onClick={() =>
            setInicio((i) => Math.min(maxInicio, i + DIAS_VISIBLES))
          }
          className="hidden h-16 w-8 shrink-0 items-center justify-center rounded-control text-lg text-primario transition-colors duration-150 hover:bg-fondo disabled:text-borde sm:flex"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t('horarios')}
      >
        {horarios.map((s) => {
          const agotado = s.libres <= 0;
          const on = seleccionadaId === s.id;
          return (
            <label
              key={s.id}
              className={cn(
                'flex min-h-11 cursor-pointer flex-col justify-center rounded-control border px-4 py-2 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primario',
                agotado &&
                  'cursor-not-allowed border-borde bg-fondo text-texto-suave',
                !agotado && on && 'border-primario bg-primario text-superficie',
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
                onChange={() => onSeleccionar(s)}
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

      {error && (
        <p
          id="selector-salida-error"
          role="alert"
          className="text-sm text-error"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
