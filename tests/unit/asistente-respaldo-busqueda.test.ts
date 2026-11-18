import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buscarTours } from '@/lib/asistente/herramientas';

const NEGOCIO = { id: 'n1', slug: 'mar-y-sol-tamarindo', nombre: 'Mar y Sol' };
const TOUR = {
  id: 't1',
  negocio_id: 'n1',
  slug: 'catamaran-atardecer',
  nombre_es: 'Catamarán al atardecer',
  nombre_en: 'Sunset catamaran',
  precio_cents: 6000,
  duracion_min: 120,
  imagen_url: null,
};
const SNORKEL = { ...TOUR, id: 't2', slug: 'snorkel', nombre_en: 'Snorkel' };
const SALIDA = {
  id: 's1',
  tour_id: 't1',
  inicia_en: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  cupo: 10,
  ocupados: 0,
};

/** Constructor de consultas falso: registra los filtros y responde según la tabla. */
function dbFalsa(tours = [TOUR]) {
  const filtrosOr: string[] = [];
  const respuestas: Record<string, unknown[]> = {
    negocios: [NEGOCIO],
    salidas_ocupacion: [SALIDA, { ...SALIDA, id: 's2', tour_id: 't2' }],
  };
  const from = (tabla: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'gte', 'lte', 'order', 'limit']) q[m] = () => q;
    let soloSlug: string | undefined;
    let ids: string[] | undefined;
    q.in = (col: string, valores: string[]) => {
      if (col === 'tour_id') ids = valores;
      return q;
    };
    q.eq = (col: string, valor: string) => {
      if (tabla === 'tours' && col === 'slug') soloSlug = valor;
      return q;
    };
    let conTexto = false;
    q.or = (filtro: string) => {
      filtrosOr.push(filtro);
      // El ilike de la base no calza "catamaran sunset" con "Sunset catamaran".
      conTexto = true;
      return q;
    };
    q.then = (resolver: (r: { data: unknown[] }) => unknown) =>
      resolver({
        data:
          tabla === 'tours'
            ? conTexto
              ? []
              : tours.filter((t) => !soloSlug || t.slug === soloSlug)
            : ((respuestas[tabla] ?? []) as { tour_id?: string }[]).filter(
                (r) => !ids || !r.tour_id || ids.includes(r.tour_id),
              ),
      });
    return q;
  };
  return { db: { from } as never, filtrosOr };
}

describe('buscarTours: respaldo sin texto', () => {
  it('con negocio y sin coincidencias, repite sin texto y devuelve el catamarán', async () => {
    const { db, filtrosOr } = dbFalsa();
    const { tours } = await buscarTours(
      db,
      { texto: 'catamaran sunset', personas: 2 },
      { locale: 'en', negocioSlug: 'mar-y-sol-tamarindo' },
    );
    expect(filtrosOr).toHaveLength(1);
    expect(tours).toHaveLength(1);
    expect(tours[0].tour).toBe('Sunset catamaran');
  });

  it('también con el negocio en los argumentos de la herramienta', async () => {
    const { db } = dbFalsa();
    const { tours } = await buscarTours(
      db,
      {
        texto: 'catamaran sunset',
        negocio_slug: 'mar-y-sol-tamarindo',
        personas: 2,
      },
      { locale: 'en' },
    );
    expect(tours).toHaveLength(1);
  });

  it('con un tour en contexto el respaldo devuelve solo ese tour', async () => {
    const { db } = dbFalsa([SNORKEL, TOUR]);
    const { tours } = await buscarTours(
      db,
      { texto: 'sunset catamaran', personas: 2 },
      {
        locale: 'en',
        negocioSlug: 'mar-y-sol-tamarindo',
        tourSlug: 'catamaran-atardecer',
      },
    );
    expect(tours.map((t) => t.tour)).toEqual(['Sunset catamaran']);
  });

  it('sin tour en contexto el respaldo devuelve todo el negocio', async () => {
    const { db } = dbFalsa([SNORKEL, TOUR]);
    const { tours } = await buscarTours(
      db,
      { texto: 'sunset catamaran', personas: 2 },
      { locale: 'en', negocioSlug: 'mar-y-sol-tamarindo' },
    );
    expect(tours).toHaveLength(2);
  });

  it('sin negocio no hay respaldo', async () => {
    const { db } = dbFalsa();
    const { tours } = await buscarTours(
      db,
      { texto: 'catamaran sunset', personas: 2 },
      { locale: 'en' },
    );
    expect(tours).toEqual([]);
  });
});
