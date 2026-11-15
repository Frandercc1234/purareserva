'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react';
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

/** Guarda la salida elegida en la URL para que recargar o compartir la conserve. */
function guardarSalidaEnUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('salida', id);
  window.history.replaceState(null, '', url);
}

const ORDEN = ['salida_id', 'nombre', 'email', 'telefono', 'personas'] as const;

/** Lleva el foco (y la vista) al campo indicado; la salida va al selector de días. */
function enfocarCampo(form: HTMLFormElement | null, campo: string) {
  if (!form) return;
  const el =
    campo === 'salida_id'
      ? form.querySelector<HTMLElement>('#selector-salida [data-foco]')
      : (form.elements.namedItem(campo) as HTMLElement | null);
  if (!el) return;
  el.scrollIntoView({ block: 'center' });
  el.focus({ preventScroll: true });
}

export function ReservaForm({
  salidas,
  salidaInicialId,
  precioCents,
  depositoPct,
}: {
  salidas: SalidaDisponible[];
  salidaInicialId: string | null;
  precioCents: number;
  depositoPct: number;
}) {
  const locale = useLocale();
  const t = useTranslations('Reserva');
  const [estado, accion, pendiente] = useActionState<EstadoReserva, FormData>(
    crearReserva,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [salida, setSalida] = useState<SalidaDisponible | null>(
    salidas.find((s) => s.id === salidaInicialId && s.libres > 0) ?? null,
  );
  const [personas, setPersonas] = useState('1');
  const [erroresCliente, setErroresCliente] = useState<string[]>([]);

  const campos = estado?.campos ?? {};
  const err = (campo: string) =>
    campos[campo] || erroresCliente.includes(campo)
      ? t(`errores.${campo}` as 'errores.nombre')
      : undefined;

  // Solo para mostrar: el servidor recalcula total y depósito desde la base.
  const n = Math.max(1, Math.min(Number(personas) || 1, salida?.libres ?? 50));
  const total = precioCents * n;
  const deposito = Math.round((total * depositoPct) / 100);

  const errorGeneral =
    estado && !estado.campos ? t(`errores.${estado.error}`) : null;

  const malos = ORDEN.filter((c) => campos[c] || erroresCliente.includes(c));

  // Errores del servidor: el foco va al primer campo con error.
  useEffect(() => {
    const primero = ORDEN.find((c) => estado?.campos?.[c]);
    if (primero) enfocarCampo(formRef.current, primero);
  }, [estado]);

  /** Campos incompletos según los atributos nativos; el servidor sigue siendo la fuente de verdad. */
  function camposIncompletos() {
    const form = formRef.current;
    if (!form) return [];
    const mal: string[] = [];
    if (!salida) mal.push('salida_id');
    for (const nombre of ['nombre', 'email', 'telefono', 'personas']) {
      const campo = form.elements.namedItem(nombre) as HTMLInputElement | null;
      const vacio = !campo?.value.trim();
      if (!campo || vacio || !campo.validity.valid) mal.push(nombre);
      else if (nombre === 'nombre' && campo.value.trim().length < 2)
        mal.push(nombre);
    }
    return mal;
  }

  const resumenErrores = malos.length > 0 && (
    <p role="alert" className="text-sm font-semibold text-error">
      {t('revisar', {
        campos: malos.map((c) => t(`camposLista.${c}`)).join(', '),
      })}
    </p>
  );

  return (
    <form
      ref={formRef}
      method="post"
      onSubmit={(e) => {
        // Sin reinicio automático: si hay un error se conservan los datos.
        e.preventDefault();
        const mal = camposIncompletos();
        setErroresCliente(mal);
        if (mal.length) {
          enfocarCampo(formRef.current, mal[0]);
          return;
        }
        const datos = new FormData(e.currentTarget);
        startTransition(() => accion(datos));
      }}
      onInput={(e) => {
        const nombre = (e.target as HTMLInputElement).name;
        setErroresCliente((c) => c.filter((x) => x !== nombre));
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <input type="hidden" name="idioma" value={locale} />
      <SalidaPicker
        salidas={salidas}
        seleccionadaId={salida?.id ?? null}
        onSeleccionar={(s) => {
          setSalida(s);
          setErroresCliente((c) => c.filter((x) => x !== 'salida_id'));
          guardarSalidaEnUrl(s.id);
          if (Number(personas) > s.libres) setPersonas(String(s.libres));
        }}
        error={err('salida_id')}
      />

      <h2 className="text-lg font-semibold">{t('titulo')}</h2>
      <Input
        label={t('nombre')}
        name="nombre"
        autoComplete="name"
        required
        minLength={2}
        error={err('nombre')}
      />
      <Input
        label={t('email')}
        name="email"
        type="email"
        autoComplete="email"
        required
        error={err('email')}
      />
      <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
        <Input
          label={t('telefono')}
          name="telefono"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          placeholder={t('telefonoEjemplo')}
          error={err('telefono')}
        />
        <Input
          label={t('personas')}
          name="personas"
          type="number"
          inputMode="numeric"
          required
          min={1}
          max={salida?.libres ?? 50}
          value={personas}
          onChange={(e) => setPersonas(e.target.value)}
          hint={salida ? t('personasAyuda', { max: salida.libres }) : undefined}
          error={err('personas')}
        />
      </div>

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

      <div className="hidden flex-col gap-3 lg:flex">
        {resumenErrores}
        <Button type="submit" disabled={pendiente} className="w-full">
          {pendiente
            ? t('procesando')
            : t('pagar', { monto: formatearUSD(deposito, locale) })}
        </Button>
      </div>

      {/* Móvil: barra fija abajo con el depósito y el botón. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-borde bg-superficie px-4 py-3 lg:hidden">
        {resumenErrores}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-sm text-texto-suave">
              {t('depositoCorto')}
            </span>
            <span className="text-lg font-semibold">
              {formatearUSD(deposito, locale)}
            </span>
          </div>
          <Button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={pendiente}
            className="min-w-36"
          >
            {pendiente ? t('procesando') : t('reservar')}
          </Button>
        </div>
      </div>
    </form>
  );
}
