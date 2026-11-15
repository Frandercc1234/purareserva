'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  actualizarNegocio,
  type EstadoConfig,
} from '@/app/panel/configuracion/actions';

export type NegocioForm = {
  nombre: string;
  descripcion_es: string;
  descripcion_en: string;
  email_contacto: string;
  whatsapp: string | null;
  deposito_pct: number;
  horas_cancelacion: number;
  activo: boolean;
  slug: string;
  portada_url: string | null;
};

export function ConfiguracionForm({ negocio }: { negocio: NegocioForm }) {
  const [estado, accion, pendiente] = useActionState<EstadoConfig, FormData>(
    actualizarNegocio,
    null,
  );
  const v = estado?.valores;
  const campos = estado?.campos ?? {};
  const [pct, setPct] = useState(String(negocio.deposito_pct));
  const [vista, setVista] = useState<string | null>(null);
  const portadaActual = vista ?? negocio.portada_url;

  const pctNum = Number(pct);
  const ejemplo =
    Number.isFinite(pctNum) && pctNum >= 10 && pctNum <= 100
      ? `Con ${pctNum}%, un tour de $100.00 pide $${((100 * pctNum) / 100).toFixed(2)} de depósito y $${(100 - pctNum).toFixed(2)} se pagan en el lugar.`
      : 'Ingresá un porcentaje entre 10 y 100.';

  return (
    <form action={accion} className="flex max-w-2xl flex-col gap-6" noValidate>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Datos del negocio</h2>
        <Input
          label="Nombre del negocio"
          name="nombre"
          defaultValue={v?.nombre ?? negocio.nombre}
          error={campos.nombre}
          required
        />
        <Textarea
          label="Descripción en español"
          name="descripcion_es"
          defaultValue={v?.descripcion_es ?? negocio.descripcion_es}
          error={campos.descripcion_es}
        />
        <Textarea
          label="Descripción en inglés"
          name="descripcion_en"
          defaultValue={v?.descripcion_en ?? negocio.descripcion_en}
          error={campos.descripcion_en}
        />
        <Input
          label="Correo de contacto"
          name="email_contacto"
          type="email"
          defaultValue={v?.email_contacto ?? negocio.email_contacto}
          error={campos.email_contacto}
          hint="Acá te llegan los avisos de nuevas reservas"
          required
        />
        <Input
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          defaultValue={v?.whatsapp ?? negocio.whatsapp ?? ''}
          error={campos.whatsapp}
          hint="Con código de país, por ejemplo +50688887777"
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Portada</h2>
        <p className="text-sm text-texto-suave">
          Se muestra en la tarjeta de tu negocio en la página principal. Si no
          subís ninguna, se usa la imagen de tu primer tour activo.
        </p>
        {portadaActual && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portadaActual}
            alt="Vista previa de la portada del negocio"
            className="aspect-video w-full max-w-md rounded-control object-cover"
          />
        )}
        <Input
          label="Subir portada (JPG, PNG o WebP, máximo 2 MB)"
          name="portada"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="h-auto py-2"
          error={campos.portada}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setVista(f ? URL.createObjectURL(f) : null);
          }}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Políticas</h2>
        <Input
          label="Depósito (%)"
          name="deposito_pct"
          type="number"
          inputMode="numeric"
          min={10}
          max={100}
          defaultValue={v?.deposito_pct ?? negocio.deposito_pct}
          onChange={(e) => setPct(e.target.value)}
          error={campos.deposito_pct}
          hint={ejemplo}
        />
        <Input
          label="Horas límite para cancelar con reembolso"
          name="horas_cancelacion"
          type="number"
          inputMode="numeric"
          min={0}
          max={168}
          defaultValue={v?.horas_cancelacion ?? negocio.horas_cancelacion}
          error={campos.horas_cancelacion}
          hint="0 significa que se puede cancelar hasta el momento de la salida"
        />
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={
              estado?.valores ? v?.activo === 'on' : negocio.activo
            }
            className="size-5 accent-primario"
          />
          <span>
            Negocio activo (visible para los turistas)
            <span className="block text-sm text-texto-suave">
              Tu página pública: /es/{negocio.slug}
            </span>
          </span>
        </label>
      </Card>

      {estado?.ok && (
        <p role="status" className="text-exito">
          Cambios guardados
        </p>
      )}
      {estado && !estado.ok && estado.error !== 'VALIDACION' && (
        <p role="alert" className="text-error">
          No pudimos guardar los cambios. Intentá de nuevo.
        </p>
      )}
      <div>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
