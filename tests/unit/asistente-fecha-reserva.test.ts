import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buscarTours,
  crearHerramientas,
  prepararReserva,
  prepararReservaBaseSchema,
  prepararReservaSchema,
} from '@/lib/asistente/herramientas';
import { diaCR } from '@/lib/fechas';

const UUID = '3f2b8a3e-9c1d-4c52-8f0e-5a6b7c8d9e01';
const MS_DIA = 86_400_000;
const INICIA = new Date(Date.now() + 3 * MS_DIA).toISOString();
const DIA_SALIDA = diaCR(INICIA);
const OTRO_DIA = diaCR(new Date(Date.now() + 4 * MS_DIA));

/** Base falsa para preparar_reserva: una salida con cupo. */
function dbReserva() {
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) q[m] = () => q;
  q.maybeSingle = async () => ({
    data: {
      id: UUID,
      inicia_en: INICIA,
      estado: 'programada',
      tours: {
        slug: 'canopy',
        nombre_es: 'Canopy',
        nombre_en: 'Canopy',
        precio_cents: 5000,
        activo: true,
        negocios: { slug: 'rincon', activo: true, deposito_pct: 30 },
      },
    },
  });
  return {
    from: () => q,
    rpc: async () => ({ data: 10 }),
  } as never;
}

describe('preparar_reserva: la fecha pedida debe ser la de la salida', () => {
  const ES = { locale: 'es' as const };

  it('con una fecha que no coincide devuelve FECHA_DISTINTA y no hay botón', async () => {
    const r = await prepararReserva(
      dbReserva(),
      { salida_id: UUID, personas: 2, fecha: OTRO_DIA },
      ES,
    );
    expect(r).toEqual({ ok: false, motivo: 'FECHA_DISTINTA' });
  });

  it('con la fecha correcta prepara la reserva', async () => {
    const r = await prepararReserva(
      dbReserva(),
      { salida_id: UUID, personas: 2, fecha: DIA_SALIDA },
      ES,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toContain(`?salida=${UUID}&personas=2`);
  });

  it('el botón de la tarjeta no manda fecha y sigue funcionando', async () => {
    const r = await prepararReserva(
      dbReserva(),
      { salida_id: UUID, personas: 1 },
      ES,
    );
    expect(r.ok).toBe(true);
  });

  it('el modelo debe mandar la fecha; el botón de la tarjeta no', () => {
    const sinFecha = { salida_id: UUID, personas: 2 };
    expect(prepararReservaSchema.safeParse(sinFecha).success).toBe(false);
    expect(
      prepararReservaSchema.safeParse({ ...sinFecha, fecha: DIA_SALIDA })
        .success,
    ).toBe(true);
    expect(
      prepararReservaSchema.safeParse({ ...sinFecha, fecha: '21/11/2026' })
        .success,
    ).toBe(false);
    expect(prepararReservaBaseSchema.safeParse(sinFecha).success).toBe(true);
  });
});

const NEGOCIO = { id: 'n1', slug: 'rincon', nombre: 'Rincón' };
const tour = (id: string, slug: string) => ({
  id,
  negocio_id: 'n1',
  slug,
  nombre_es: slug,
  nombre_en: slug,
  precio_cents: 5000,
  duracion_min: 120,
  imagen_url: null,
});
const TOURS = [tour('t1', 'canopy'), tour('t2', 'aguas-termales')];
const salida = (id: string, tourId: string) => ({
  id,
  tour_id: tourId,
  inicia_en: INICIA,
  cupo: 10,
  ocupados: 0,
});

/** Base falsa para buscar_tours: registra los `eq('slug', …)` sobre tours. */
function dbBusqueda() {
  const slugs: string[] = [];
  const from = (tabla: string) => {
    let slug: string | undefined;
    const q: Record<string, unknown> = {};
    let ids: string[] | undefined;
    for (const m of ['select', 'gte', 'lte', 'order', 'limit', 'or'])
      q[m] = () => q;
    q.in = (col: string, valores: string[]) => {
      if (col === 'tour_id') ids = valores;
      return q;
    };
    q.eq = (col: string, valor: string) => {
      if (tabla === 'tours' && col === 'slug') {
        slug = valor;
        slugs.push(valor);
      }
      return q;
    };
    q.then = (resolver: (r: { data: unknown[] }) => unknown) =>
      resolver({
        data:
          tabla === 'negocios'
            ? [NEGOCIO]
            : tabla === 'tours'
              ? TOURS.filter((t) => !slug || t.slug === slug)
              : [salida('s1', 't1'), salida('s2', 't2')].filter(
                  (s) => !ids || ids.includes(s.tour_id),
                ),
      });
    return q;
  };
  return { db: { from } as never, slugs };
}

describe('buscar_tours con un tour en el contexto', () => {
  const ctx = {
    locale: 'es' as const,
    negocioSlug: 'rincon',
    tourSlug: 'canopy',
  };

  it('sin texto devuelve solo ese tour, no todo el negocio', async () => {
    const { db, slugs } = dbBusqueda();
    const { tours } = await buscarTours(db, { personas: 2 }, ctx);
    expect(slugs).toEqual(['canopy']);
    expect(tours.map((t) => t.tour)).toEqual(['canopy']);
  });

  it('con texto sigue buscando en el negocio', async () => {
    const { db, slugs } = dbBusqueda();
    const { tours } = await buscarTours(
      db,
      { texto: 'termales', personas: 2 },
      ctx,
    );
    expect(slugs).toEqual([]);
    expect(tours).toHaveLength(2);
  });

  it('sin tour en el contexto busca en todo el negocio', async () => {
    const { db, slugs } = dbBusqueda();
    const { tours } = await buscarTours(
      db,
      { personas: 2 },
      { locale: 'es', negocioSlug: 'rincon' },
    );
    expect(slugs).toEqual([]);
    expect(tours).toHaveLength(2);
  });

  it('cada salida trae su día (YYYY-MM-DD) para copiarlo en fecha', async () => {
    const { db } = dbBusqueda();
    const { tours } = await buscarTours(db, { personas: 1 }, ctx);
    expect(tours[0].salidas[0].fecha).toBe(DIA_SALIDA);
  });
});

describe('buscar_tours una sola vez por petición', () => {
  const ctx = { locale: 'es' as const, negocioSlug: 'rincon' };
  const opciones = { toolCallId: 'x', messages: [] };

  it('la segunda llamada devuelve lo mismo sin consultar otra vez', async () => {
    const { db } = dbBusqueda();
    let consultas = 0;
    const contada = {
      from: (t: string) => {
        consultas++;
        return (db as unknown as { from: (t: string) => unknown }).from(t);
      },
    } as never;
    const { buscar_tours } = crearHerramientas(ctx, contada);
    const primera = await buscar_tours.execute!({ personas: 2 }, opciones);
    const tras = consultas;
    const segunda = await buscar_tours.execute!(
      { texto: 'termales', personas: 3 },
      opciones,
    );
    expect(tras).toBeGreaterThan(0);
    expect(consultas).toBe(tras);
    expect(segunda).toBe(primera);
  });

  it('dos llamadas en paralelo comparten la misma consulta', async () => {
    const { db } = dbBusqueda();
    let consultas = 0;
    const contada = {
      from: (t: string) => {
        consultas++;
        return (db as unknown as { from: (t: string) => unknown }).from(t);
      },
    } as never;
    const { buscar_tours } = crearHerramientas(ctx, contada);
    const [a, b] = await Promise.all([
      buscar_tours.execute!({ personas: 1 }, opciones),
      buscar_tours.execute!({ personas: 1 }, opciones),
    ]);
    expect(b).toBe(a);
    const unaSola = consultas;
    const { buscar_tours: otra } = crearHerramientas(ctx, contada);
    consultas = 0;
    await otra.execute!({ personas: 1 }, opciones);
    expect(unaSola).toBe(consultas);
  });
});
