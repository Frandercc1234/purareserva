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
const SALIDA = {
  id: 's1',
  tour_id: 't1',
  inicia_en: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  cupo: 10,
  ocupados: 0,
};

/** Constructor de consultas falso: registra los filtros y responde según la tabla. */
function dbFalsa() {
  const filtrosOr: string[] = [];
  const respuestas: Record<string, unknown[]> = {
    negocios: [NEGOCIO],
    salidas_ocupacion: [SALIDA],
  };
  const from = (tabla: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'gte', 'lte', 'order', 'limit'])
      q[m] = () => q;
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
              : [TOUR]
            : (respuestas[tabla] ?? []),
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
