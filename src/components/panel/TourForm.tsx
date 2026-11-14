'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button, botonClases } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { guardarTour, type EstadoTour } from '@/app/panel/tours/actions';

export type TourEditable = {
  id: string;
  nombre_es: string;
  nombre_en: string;
  descripcion_es: string;
  descripcion_en: string;
  precio: string;
  duracion_min: number;
  cupo_default: number;
  punto_encuentro: string;
  imagen_url: string | null;
  activo: boolean;
};

type Idioma = 'es' | 'en';

export function TourForm({ tour }: { tour?: TourEditable }) {
  const [estado, accion, pendiente] = useActionState<EstadoTour, FormData>(
    guardarTour,
    null,
  );
  const v = estado?.valores;
  const campos = estado?.campos ?? {};
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [vista, setVista] = useState<string | null>(null);

  const errorEn = !!(campos.nombre_en || campos.descripcion_en);
  const errorEs = !!(campos.nombre_es || campos.descripcion_es);
  // Si el idioma visible no tiene errores pero el otro sí, avisar en la pestaña.
  const tabs: { id: Idioma; texto: string; error: boolean }[] = [
    { id: 'es', texto: 'Español', error: errorEs },
    { id: 'en', texto: 'English', error: errorEn },
  ];

  const imagenActual = vista ?? tour?.imagen_url ?? null;

  return (
    <form action={accion} className="flex max-w-2xl flex-col gap-6" noValidate>
      {tour && <input type="hidden" name="id" value={tour.id} />}

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Textos</h2>
        <div
          role="tablist"
          aria-label="Idioma de los textos"
          className="flex gap-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={idioma === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setIdioma(t.id)}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-control px-4',
                idioma === t.id
                  ? 'bg-primario text-superficie'
                  : 'border border-borde bg-superficie text-texto',
              )}
            >
              {t.texto}
              {t.error && (
                <span
                  aria-label="Tiene errores"
                  className="size-2 rounded-full bg-error ring-2 ring-superficie"
                />
              )}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="panel-es"
          aria-labelledby="tab-es"
          hidden={idioma !== 'es'}
          className="flex flex-col gap-4"
        >
          <Input
            label="Nombre (español)"
            name="nombre_es"
            defaultValue={v?.nombre_es ?? tour?.nombre_es ?? ''}
            error={campos.nombre_es}
            required
          />
          <Textarea
            label="Descripción (español)"
            name="descripcion_es"
            defaultValue={v?.descripcion_es ?? tour?.descripcion_es ?? ''}
            error={campos.descripcion_es}
          />
        </div>
        <div
          role="tabpanel"
          id="panel-en"
          aria-labelledby="tab-en"
          hidden={idioma !== 'en'}
          className="flex flex-col gap-4"
        >
          <Input
            label="Name (English)"
            name="nombre_en"
            defaultValue={v?.nombre_en ?? tour?.nombre_en ?? ''}
            error={campos.nombre_en}
            required
          />
          <Textarea
            label="Description (English)"
            name="descripcion_en"
            defaultValue={v?.descripcion_en ?? tour?.descripcion_en ?? ''}
            error={campos.descripcion_en}
          />
        </div>
        {(errorEs || errorEn) && (
          <p role="alert" className="text-sm text-error">
            Revisá los textos
            {errorEs && ' en español'}
            {errorEs && errorEn && ' y'}
            {errorEn && ' en inglés'}.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Detalles</h2>
        <Input
          label="Precio por persona (USD)"
          name="precio"
          inputMode="decimal"
          defaultValue={v?.precio ?? tour?.precio ?? ''}
          error={campos.precio}
          placeholder="45.00"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Duración (minutos)"
            name="duracion_min"
            type="number"
            inputMode="numeric"
            defaultValue={v?.duracion_min ?? tour?.duracion_min ?? 120}
            error={campos.duracion_min}
          />
          <Input
            label="Cupo por defecto"
            name="cupo_default"
            type="number"
            inputMode="numeric"
            defaultValue={v?.cupo_default ?? tour?.cupo_default ?? 10}
            error={campos.cupo_default}
          />
        </div>
        <Input
          label="Punto de encuentro"
          name="punto_encuentro"
          defaultValue={v?.punto_encuentro ?? tour?.punto_encuentro ?? ''}
          error={campos.punto_encuentro}
        />
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={v ? v.activo === 'on' : (tour?.activo ?? true)}
            className="size-5 accent-primario"
          />
          <span>Tour activo (visible para los turistas)</span>
        </label>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Imagen</h2>
        {imagenActual && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagenActual}
            alt="Vista previa de la imagen del tour"
            className="aspect-video w-full max-w-md rounded-control object-cover"
          />
        )}
        <Input
          label="Subir imagen (JPG, PNG o WebP, máximo 2 MB)"
          name="imagen"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="h-auto py-2"
          error={campos.imagen}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setVista(f ? URL.createObjectURL(f) : null);
          }}
        />
      </Card>

      {estado?.ok && (
        <p role="status" className="text-exito">
          Cambios guardados
        </p>
      )}
      {estado && !estado.ok && estado.error === 'DESCONOCIDO' && (
        <p role="alert" className="text-error">
          No pudimos guardar el tour. Intentá de nuevo.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar tour'}
        </Button>
        <Link href="/panel/tours" className={botonClases('secundario')}>
          Volver a tours
        </Link>
      </div>
    </form>
  );
}
