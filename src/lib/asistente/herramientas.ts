import 'server-only';
import { tool, type JSONValue } from 'ai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { formatearUSD } from '@/lib/dinero';
import {
  diaCR,
  formatearCorto,
  formatearDuracion,
  formatearFechaHora,
} from '@/lib/fechas';
import { IMAGEN_RESPALDO } from '@/lib/imagenes';
import { recortar } from '@/lib/texto';
import { createAdminClient } from '@/lib/supabase/admin';
import { uuid } from '@/lib/validaciones';
import type { Database } from '@/types/database';
import { generarEmbedding } from './embeddings';

type Db = SupabaseClient<Database>;

export type ContextoHerramientas = {
  locale: 'es' | 'en';
  /** Negocio que el turista está viendo: se prioriza si el modelo no pide otro. */
  negocioSlug?: string;
};

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
const MAX_TOURS = 3;
const MAX_CARACTERES_FICHA = 600;
const MAX_SALIDAS = 3;
const DIAS_POR_DEFECTO = 14;
const DIAS_MAXIMOS = 60;

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const buscarToursSchema = z.object({
  texto: z.string().trim().max(100).optional(),
  fecha_desde: fecha.optional(),
  fecha_hasta: fecha.optional(),
  personas: z.number().int().min(1).max(50).optional(),
  negocio_slug: z.string().trim().max(60).optional(),
});

export const buscarGuiaSchema = z.object({
  consulta_en: z.string().trim().min(2).max(300),
});

export const prepararReservaSchema = z.object({
  salida_id: uuid,
  personas: z.number().int().min(1).max(50),
});

export type TourParaChat = {
  tour: string;
  negocio: string;
  precio_texto: string;
  duracion_texto: string;
  url: string;
  imagen_url: string;
  salidas: { id: string; fecha_hora_texto: string; cupos: number }[];
};

/** Quita los caracteres con significado especial en los filtros de PostgREST. */
function limpiarTexto(texto: string | undefined) {
  return texto
    ?.replace(/[%,()*\\_"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Instante de inicio (00:00) o fin (23:59:59.999) de un día de Costa Rica (UTC-6). */
const inicioDia = (dia: string) => new Date(`${dia}T00:00:00-06:00`);
const finDia = (dia: string) => new Date(`${dia}T23:59:59.999-06:00`);

export async function buscarTours(
  db: Db,
  entrada: z.infer<typeof buscarToursSchema>,
  ctx: ContextoHerramientas,
): Promise<{ tours: TourParaChat[] }> {
  const { locale } = ctx;
  const ahora = Date.now();
  const personas = entrada.personas ?? 1;
  const desde = entrada.fecha_desde ?? diaCR(new Date(ahora));
  const hasta =
    entrada.fecha_hasta ??
    diaCR(new Date(inicioDia(desde).getTime() + DIAS_POR_DEFECTO * DIA_MS));
  const slug = entrada.negocio_slug || ctx.negocioSlug;

  // Igual que crear_reserva: solo salidas con más de una hora de anticipación.
  const minimo = Math.max(ahora + HORA_MS, inicioDia(desde).getTime());
  const maximo = Math.min(
    finDia(hasta).getTime(),
    minimo + DIAS_MAXIMOS * DIA_MS,
  );
  if (maximo < minimo) return { tours: [] };

  let negociosQ = db
    .from('negocios')
    .select('id, slug, nombre')
    .eq('activo', true);
  if (slug) negociosQ = negociosQ.eq('slug', slug);
  const { data: negocios } = await negociosQ;
  if (!negocios?.length) return { tours: [] };

  let toursQ = db
    .from('tours')
    .select(
      'id, negocio_id, slug, nombre_es, nombre_en, precio_cents, duracion_min, imagen_url',
    )
    .eq('activo', true)
    .in(
      'negocio_id',
      negocios.map((n) => n.id),
    );
  const texto = limpiarTexto(entrada.texto);
  if (texto)
    toursQ = toursQ.or(
      `nombre_${locale}.ilike.%${texto}%,descripcion_${locale}.ilike.%${texto}%`,
    );
  const { data: tours } = await toursQ;
  if (!tours?.length) return { tours: [] };

  const { data: salidas } = await db
    .from('salidas_ocupacion')
    .select('id, tour_id, inicia_en, cupo, ocupados')
    .in(
      'tour_id',
      tours.map((t) => t.id),
    )
    .eq('estado', 'programada')
    .gte('inicia_en', new Date(minimo).toISOString())
    .lte('inicia_en', new Date(maximo).toISOString())
    .order('inicia_en', { ascending: true })
    .limit(500);

  // Salidas con cupo suficiente, agrupadas por tour en orden de fecha.
  const porTour = new Map<string, NonNullable<typeof salidas>>();
  for (const s of salidas ?? []) {
    if (s.cupo - (s.ocupados ?? 0) < personas) continue;
    porTour.set(s.tour_id, [...(porTour.get(s.tour_id) ?? []), s]);
  }

  const resultados: TourParaChat[] = [];
  for (const [tourId, lista] of porTour) {
    const tour = tours.find((t) => t.id === tourId)!;
    const negocio = negocios.find((n) => n.id === tour.negocio_id)!;
    resultados.push({
      tour: locale === 'en' ? tour.nombre_en : tour.nombre_es,
      negocio: negocio.nombre,
      precio_texto: formatearUSD(tour.precio_cents, locale),
      duracion_texto: formatearDuracion(tour.duracion_min),
      url: `/${locale}/${negocio.slug}/${tour.slug}`,
      imagen_url: tour.imagen_url ?? IMAGEN_RESPALDO,
      salidas: lista.slice(0, MAX_SALIDAS).map((s) => ({
        id: s.id,
        fecha_hora_texto: formatearCorto(s.inicia_en, locale),
        cupos: s.cupo - (s.ocupados ?? 0),
      })),
    });
    if (resultados.length === MAX_TOURS) break;
  }
  return { tours: resultados };
}

export type FichaParaChat = {
  titulo: string;
  contenido: string;
  fuente_nombre: string;
  fuente_url: string;
};

export async function buscarGuia(
  db: Db,
  entrada: z.infer<typeof buscarGuiaSchema>,
  ctx: ContextoHerramientas,
): Promise<{ fichas: FichaParaChat[] }> {
  const embedding = await generarEmbedding(entrada.consulta_en);
  const { data, error } = await db.rpc('buscar_guia', {
    p_embedding: JSON.stringify(embedding),
  });
  if (error) throw new Error(`buscar_guia: ${error.message}`);
  return {
    fichas: (data ?? []).slice(0, 4).map((f) => ({
      titulo: ctx.locale === 'en' ? f.titulo_en : f.titulo_es,
      contenido: recortar(
        ctx.locale === 'en' ? f.contenido_en : f.contenido_es,
        MAX_CARACTERES_FICHA,
      ),
      fuente_nombre: f.fuente_nombre,
      fuente_url: f.fuente_url,
    })),
  };
}

export type ResultadoReserva =
  | { ok: true; url: string; resumen: string }
  | { ok: false; motivo: 'SIN_CUPO' | 'SALIDA_NO_DISPONIBLE' };

export async function prepararReserva(
  db: Db,
  entrada: z.infer<typeof prepararReservaSchema>,
  ctx: ContextoHerramientas,
): Promise<ResultadoReserva> {
  const { locale } = ctx;
  const { data: salida } = await db
    .from('salidas')
    .select(
      'id, inicia_en, estado, tours(slug, nombre_es, nombre_en, precio_cents, activo, negocios(slug, activo, deposito_pct))',
    )
    .eq('id', entrada.salida_id)
    .maybeSingle();
  const tour = salida?.tours;
  const negocio = tour?.negocios;
  if (
    !salida ||
    !tour ||
    !negocio ||
    salida.estado !== 'programada' ||
    !tour.activo ||
    !negocio.activo ||
    new Date(salida.inicia_en).getTime() <= Date.now() + HORA_MS
  ) {
    return { ok: false, motivo: 'SALIDA_NO_DISPONIBLE' };
  }

  const { data: libres } = await db.rpc('cupos_disponibles', {
    p_salida_id: salida.id,
  });
  if ((libres ?? 0) < entrada.personas) {
    return { ok: false, motivo: 'SIN_CUPO' };
  }

  // Solo para mostrar: al reservar, el depósito lo recalcula la base.
  const total = tour.precio_cents * entrada.personas;
  const deposito = Math.round((total * negocio.deposito_pct) / 100);
  const nombre = locale === 'en' ? tour.nombre_en : tour.nombre_es;
  const personasTexto =
    locale === 'en'
      ? `${entrada.personas} ${entrada.personas === 1 ? 'person' : 'people'}`
      : `${entrada.personas} ${entrada.personas === 1 ? 'persona' : 'personas'}`;
  const depositoEtiqueta = locale === 'en' ? 'deposit' : 'depósito';
  return {
    ok: true,
    url: `/${locale}/${negocio.slug}/${tour.slug}?salida=${salida.id}&personas=${entrada.personas}`,
    resumen: `${nombre} · ${formatearFechaHora(salida.inicia_en, locale)} · ${personasTexto} · ${depositoEtiqueta} ${formatearUSD(deposito, locale)}`,
  };
}

/**
 * Lo que el modelo necesita de cada resultado. La pantalla recibe el resultado completo
 * (imagen y enlaces para la tarjeta); al modelo se le quita lo que no usa, para gastar
 * menos tokens.
 */
export function vistaModelo(salida: unknown): {
  type: 'json';
  value: JSONValue;
} {
  const s = salida as {
    tours?: TourParaChat[];
    fichas?: FichaParaChat[];
  } | null;
  if (s?.tours) {
    return {
      type: 'json' as const,
      value: {
        tours: s.tours.map((t) => ({
          tour: t.tour,
          negocio: t.negocio,
          precio: t.precio_texto,
          duracion: t.duracion_texto,
          salidas: t.salidas,
        })),
      },
    };
  }
  if (s?.fichas) {
    return {
      type: 'json' as const,
      value: {
        fichas: s.fichas.map((f) => ({
          titulo: f.titulo,
          contenido: f.contenido,
          fuente_nombre: f.fuente_nombre,
        })),
      },
    };
  }
  return { type: 'json' as const, value: s ?? null };
}

/** Ejecuta una herramienta sin romper la conversación si algo falla (sin registrar el texto del usuario). */
async function seguro<T>(nombre: string, accion: () => Promise<T>) {
  try {
    return await accion();
  } catch (error) {
    console.error(
      `asistente: falló ${nombre}`,
      error instanceof Error ? error.message : 'error',
    );
    return { error: 'NO_DISPONIBLE' as const };
  }
}

/** Las tres herramientas del asistente, ya ligadas al idioma y al contexto de la página. */
export function crearHerramientas(
  ctx: ContextoHerramientas,
  db: Db = createAdminClient(),
) {
  return {
    buscar_tours: tool({
      description:
        'Tours activos con salidas y cupos. Úsala siempre para tours, precios, horarios o cupos. Por defecto: hoy a 14 días, 1 persona.',
      inputSchema: buscarToursSchema,
      toModelOutput: vistaModelo,
      execute: (entrada) =>
        seguro('buscar_tours', () => buscarTours(db, entrada, ctx)),
    }),
    buscar_guia: tool({
      description:
        'Guía de Guanacaste (playas, parques, pueblos, clima, transporte, consejos). Consulta en inglés.',
      inputSchema: buscarGuiaSchema,
      toModelOutput: vistaModelo,
      execute: (entrada) =>
        seguro('buscar_guia', () => buscarGuia(db, entrada, ctx)),
    }),
    preparar_reserva: tool({
      description:
        'Enlace para reservar una salida. No crea la reserva ni cobra.',
      inputSchema: prepararReservaSchema,
      toModelOutput: vistaModelo,
      execute: (entrada) =>
        seguro('preparar_reserva', () => prepararReserva(db, entrada, ctx)),
    }),
  };
}
