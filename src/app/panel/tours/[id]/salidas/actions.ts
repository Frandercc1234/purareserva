'use server';

import { revalidatePath } from 'next/cache';
import { contextoPanel } from '@/lib/panel';
import { aFechaCR, generarFechas, SalidasError } from '@/lib/salidas';
import {
  camposDeZod,
  salidaSchema,
  salidasLoteSchema,
} from '@/lib/validaciones';

export type EstadoSalidas = {
  ok: boolean;
  error?: 'VALIDACION' | 'DESCONOCIDO';
  campos?: Record<string, string>;
  creadas?: number;
  omitidas?: number;
} | null;

const MENSAJES: Record<string, string> = {
  RANGO_INVALIDO: 'La fecha final debe ser igual o posterior a la inicial',
  RANGO_MUY_LARGO: 'El rango no puede pasar de 90 días',
  MUCHAS_SALIDAS: 'El lote no puede crear más de 200 salidas',
};

async function tourDelNegocio(tourId: string) {
  const { supabase, negocio } = await contextoPanel();
  const { data: tour } = await supabase
    .from('tours')
    .select('id, cupo_default')
    .eq('id', tourId)
    .eq('negocio_id', negocio.id)
    .maybeSingle();
  return { supabase, negocio, tour };
}

async function insertar(
  supabase: Awaited<ReturnType<typeof contextoPanel>>['supabase'],
  filas: {
    tour_id: string;
    negocio_id: string;
    inicia_en: string;
    cupo: number;
  }[],
) {
  // Los duplicados (mismo tour y mismo instante) se ignoran.
  const { data, error } = await supabase
    .from('salidas')
    .upsert(filas, { onConflict: 'tour_id,inicia_en', ignoreDuplicates: true })
    .select('id');
  if (error) return null;
  return data?.length ?? 0;
}

export async function crearSalida(
  _prev: EstadoSalidas,
  formData: FormData,
): Promise<EstadoSalidas> {
  const parsed = salidaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'VALIDACION',
      campos: camposDeZod(parsed.error),
    };
  }
  const { tour_id, fecha, hora, cupo } = parsed.data;

  const { supabase, negocio, tour } = await tourDelNegocio(tour_id);
  if (!tour) return { ok: false, error: 'DESCONOCIDO' };

  const inicia = aFechaCR(fecha, hora);
  if (inicia.getTime() <= Date.now()) {
    return {
      ok: false,
      error: 'VALIDACION',
      campos: { fecha: 'La salida debe ser en el futuro' },
    };
  }

  const creadas = await insertar(supabase, [
    {
      tour_id,
      negocio_id: negocio.id,
      inicia_en: inicia.toISOString(),
      cupo: cupo ?? tour.cupo_default,
    },
  ]);
  if (creadas === null) return { ok: false, error: 'DESCONOCIDO' };

  revalidatePath(`/panel/tours/${tour_id}/salidas`);
  return { ok: true, creadas, omitidas: 1 - creadas };
}

export async function crearSalidasLote(
  _prev: EstadoSalidas,
  formData: FormData,
): Promise<EstadoSalidas> {
  const parsed = salidasLoteSchema.safeParse({
    ...Object.fromEntries(formData),
    dias: formData.getAll('dias'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'VALIDACION',
      campos: camposDeZod(parsed.error),
    };
  }
  const { tour_id, desde, hasta, dias, hora, cupo } = parsed.data;

  let fechas: Date[];
  try {
    fechas = generarFechas({ desde, hasta, dias, hora });
  } catch (e) {
    if (e instanceof SalidasError) {
      return {
        ok: false,
        error: 'VALIDACION',
        campos: { hasta: MENSAJES[e.codigo] },
      };
    }
    throw e;
  }
  // Se omiten las que ya pasaron.
  const futuras = fechas.filter((f) => f.getTime() > Date.now());
  if (!futuras.length) {
    return {
      ok: false,
      error: 'VALIDACION',
      campos: { hasta: 'Ese rango no tiene salidas en el futuro' },
    };
  }

  const { supabase, negocio, tour } = await tourDelNegocio(tour_id);
  if (!tour) return { ok: false, error: 'DESCONOCIDO' };

  const creadas = await insertar(
    supabase,
    futuras.map((f) => ({
      tour_id,
      negocio_id: negocio.id,
      inicia_en: f.toISOString(),
      cupo: cupo ?? tour.cupo_default,
    })),
  );
  if (creadas === null) return { ok: false, error: 'DESCONOCIDO' };

  revalidatePath(`/panel/tours/${tour_id}/salidas`);
  return { ok: true, creadas, omitidas: futuras.length - creadas };
}

/** Elimina una salida solo si no tiene reservas confirmadas ni pendientes vigentes. */
export async function eliminarSalida(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const tourId = String(formData.get('tour_id') ?? '');
  if (!id) return;
  const { supabase, negocio } = await contextoPanel();

  const { data: salida } = await supabase
    .from('salidas_ocupacion')
    .select('id, ocupados')
    .eq('id', id)
    .eq('negocio_id', negocio.id)
    .maybeSingle();
  if (!salida || (salida.ocupados ?? 0) > 0) return; // NO_CANCELABLE

  // Reservas vencidas o canceladas también bloquean el borrado (clave foránea).
  await supabase
    .from('salidas')
    .delete()
    .eq('id', id)
    .eq('negocio_id', negocio.id);
  revalidatePath(`/panel/tours/${tourId}/salidas`);
}
