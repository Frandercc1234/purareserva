'use client';

import { startTransition, useActionState, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Input } from '@/components/ui/Input';
import { generarFechas, SalidasError } from '@/lib/salidas';
import {
  crearSalida,
  crearSalidasLote,
  type EstadoSalidas,
} from '@/app/panel/tours/[id]/salidas/actions';

const DIAS = [
  { v: 1, t: 'Lun' },
  { v: 2, t: 'Mar' },
  { v: 3, t: 'Mié' },
  { v: 4, t: 'Jue' },
  { v: 5, t: 'Vie' },
  { v: 6, t: 'Sáb' },
  { v: 0, t: 'Dom' },
];

const ERRORES: Record<string, string> = {
  RANGO_INVALIDO: 'La fecha final debe ser igual o posterior a la inicial',
  RANGO_MUY_LARGO: 'El rango no puede pasar de 90 días',
  MUCHAS_SALIDAS: 'El lote no puede crear más de 200 salidas',
};

function Resultado({ estado }: { estado: EstadoSalidas }) {
  if (!estado) return null;
  if (estado.ok) {
    const omitidas = estado.omitidas
      ? ` (${estado.omitidas} ya existían y se omitieron)`
      : '';
    return (
      <p role="status" className="text-exito">
        {estado.creadas === 1
          ? 'Se creó 1 salida'
          : `Se crearon ${estado.creadas} salidas`}
        {omitidas}
      </p>
    );
  }
  if (estado.error === 'DESCONOCIDO' || estado.campos?.tour_id) {
    return (
      <p role="alert" className="text-error">
        No pudimos crear las salidas. Intentá de nuevo.
      </p>
    );
  }
  return null;
}

export function SalidaUnicaForm({
  tourId,
  cupoDefault,
}: {
  tourId: string;
  cupoDefault: number;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoSalidas, FormData>(
    crearSalida,
    null,
  );
  const campos = estado?.campos ?? {};
  return (
    <Card>
      <form
        onSubmit={(e) => {
          // Sin reinicio automático: se conservan los valores si hay error.
          e.preventDefault();
          const datos = new FormData(e.currentTarget);
          startTransition(() => accion(datos));
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        <h2 className="text-lg font-semibold">Una salida</h2>
        <input type="hidden" name="tour_id" value={tourId} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Fecha" name="fecha" type="date" error={campos.fecha} />
          <Input label="Hora" name="hora" type="time" error={campos.hora} />
          <Input
            label="Cupo"
            name="cupo"
            type="number"
            inputMode="numeric"
            placeholder={String(cupoDefault)}
            error={campos.cupo}
          />
        </div>
        <Resultado estado={estado} />
        <div>
          <Button type="submit" disabled={pendiente}>
            {pendiente ? 'Creando…' : 'Crear salida'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function SalidasLoteForm({
  tourId,
  cupoDefault,
}: {
  tourId: string;
  cupoDefault: number;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoSalidas, FormData>(
    crearSalidasLote,
    null,
  );
  const campos = estado?.campos ?? {};
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [hora, setHora] = useState('08:00');
  const [cupo, setCupo] = useState('');
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const vista = useMemo(() => {
    if (!desde || !hasta || !dias.length) return null;
    try {
      const f = generarFechas({ desde, hasta, dias, hora });
      const futuras = f.filter((d) => d.getTime() > Date.now()).length;
      return { n: futuras, error: null as string | null };
    } catch (e) {
      if (e instanceof SalidasError) return { n: 0, error: ERRORES[e.codigo] };
      return null;
    }
  }, [desde, hasta, dias, hora]);

  return (
    <Card>
      <form
        onSubmit={(e) => {
          // Se envía sin que React reinicie el formulario: así se conservan los valores.
          e.preventDefault();
          const datos = new FormData(e.currentTarget);
          startTransition(() => accion(datos));
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        <h2 className="text-lg font-semibold">Varias salidas (lote)</h2>
        <input type="hidden" name="tour_id" value={tourId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Desde"
            name="desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            error={campos.desde}
          />
          <Input
            label="Hasta"
            name="hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            error={campos.hasta ?? vista?.error ?? undefined}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm">Días de la semana</legend>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => {
              const on = dias.includes(d.v);
              return (
                <label
                  key={d.v}
                  className={cn(
                    'inline-flex h-11 min-w-14 cursor-pointer items-center justify-center rounded-control border px-3 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primario',
                    on
                      ? 'border-primario bg-primario text-superficie'
                      : 'border-borde bg-superficie text-texto',
                  )}
                >
                  <input
                    type="checkbox"
                    name="dias"
                    value={d.v}
                    checked={on}
                    onChange={() =>
                      setDias((prev) =>
                        on ? prev.filter((x) => x !== d.v) : [...prev, d.v],
                      )
                    }
                    className="sr-only"
                  />
                  {d.t}
                </label>
              );
            })}
          </div>
          {campos.dias && <p className="text-sm text-error">{campos.dias}</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Hora"
            name="hora"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            error={campos.hora}
          />
          <Input
            label="Cupo"
            name="cupo"
            type="number"
            inputMode="numeric"
            value={cupo}
            onChange={(e) => setCupo(e.target.value)}
            placeholder={String(cupoDefault)}
            hint="Si lo dejás vacío se usa el cupo por defecto del tour"
            error={campos.cupo}
          />
        </div>

        <p aria-live="polite" className="font-semibold">
          {vista && !vista.error
            ? vista.n === 0
              ? 'No hay salidas futuras en ese rango'
              : vista.n === 1
                ? 'Se creará 1 salida'
                : `Se crearán ${vista.n} salidas`
            : 'Elegí fechas y días para ver cuántas salidas se crearán'}
        </p>
        <Resultado estado={estado} />
        <div>
          <Button type="submit" disabled={pendiente}>
            {pendiente ? 'Creando…' : 'Crear salidas'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
