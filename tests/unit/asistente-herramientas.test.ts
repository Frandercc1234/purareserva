import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generarEmbedding } from '@/lib/asistente/embeddings';
import {
  buscarGuia,
  buscarGuiaSchema,
  buscarTours,
  buscarToursSchema,
  prepararReserva,
  vistaModelo,
  prepararReservaSchema,
} from '@/lib/asistente/herramientas';
import { diaCR } from '@/lib/fechas';
import { generarToken, hashToken } from '@/lib/tokens';
import { admin, hayBase } from './helpers-db';

// Ids fijos del seed (supabase/seed.sql).
const NEGOCIO1 = 'aaaaaaaa-0000-0000-0000-000000000001';
const NEGOCIO2 = 'aaaaaaaa-0000-0000-0000-000000000002';
const ES = { locale: 'es' as const };
const EN = { locale: 'en' as const };

const ID = Date.now().toString(36);
const PREFIJO = 'ZZ Prueba Asistente';
const SLUG_A = `zz-alfa-${ID}`;
const SLUG_B = `zz-beta-${ID}`;
const SLUG_C = `zz-gamma-${ID}`;
const SLUG_GUIA = `zz-prueba-${ID}`;

const DIA_MS = 86_400_000;
/** "YYYY-MM-DD" de hoy + n días en Costa Rica. */
const dia = (n: number) => diaCR(new Date(Date.now() + n * DIA_MS));
/** Las 9:00 (hora de Costa Rica) de hoy + n días. */
const nueve = (n: number) => new Date(`${dia(n)}T09:00:00-06:00`).toISOString();

const hayEmbed = hayBase
  ? await generarEmbedding('ping').then(
      () => true,
      () => false,
    )
  : false;

const salidasCreadas: string[] = [];
const toursCreados: string[] = [];
const reservasCreadas: string[] = [];
const id: Record<string, string> = {};

async function crearTour(opciones: {
  negocio: string;
  slug: string;
  nombre: string;
  cupo: number;
  activo?: boolean;
}) {
  const { data, error } = await admin
    .from('tours')
    .insert({
      negocio_id: opciones.negocio,
      slug: opciones.slug,
      nombre_es: `${opciones.nombre} ES`,
      nombre_en: `${opciones.nombre} EN`,
      descripcion_es: 'Tour de prueba',
      descripcion_en: 'Test tour',
      precio_cents: 5000,
      duracion_min: 120,
      cupo_default: opciones.cupo,
      activo: opciones.activo ?? true,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  toursCreados.push(data.id);
  return data.id;
}

async function crearSalida(
  tourId: string,
  negocioId: string,
  iniciaEn: string,
  cupo: number,
) {
  const { data, error } = await admin
    .from('salidas')
    .insert({
      tour_id: tourId,
      negocio_id: negocioId,
      inicia_en: iniciaEn,
      cupo,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  salidasCreadas.push(data.id);
  return data.id;
}

describe.skipIf(!hayBase)('asistente: herramientas', () => {
  beforeAll(async () => {
    const a = await crearTour({
      negocio: NEGOCIO1,
      slug: SLUG_A,
      nombre: `${PREFIJO} Alfa`,
      cupo: 4,
    });
    const b = await crearTour({
      negocio: NEGOCIO2,
      slug: SLUG_B,
      nombre: `${PREFIJO} Beta`,
      cupo: 10,
    });
    const c = await crearTour({
      negocio: NEGOCIO1,
      slug: SLUG_C,
      nombre: `${PREFIJO} Gamma`,
      cupo: 4,
      activo: false,
    });
    // Alfa: 4 salidas (días 3, 5, 6 y 7). Beta y Gamma: una en el día 3.
    id.a3 = await crearSalida(a, NEGOCIO1, nueve(3), 4);
    id.a5 = await crearSalida(a, NEGOCIO1, nueve(5), 4);
    id.a6 = await crearSalida(a, NEGOCIO1, nueve(6), 4);
    id.a7 = await crearSalida(a, NEGOCIO1, nueve(7), 4);
    id.b3 = await crearSalida(b, NEGOCIO2, nueve(3), 10);
    id.c3 = await crearSalida(c, NEGOCIO1, nueve(3), 4);
    // Salidas que no se pueden reservar: una pasada y otra que empieza en 30 minutos.
    id.pasada = await crearSalida(
      a,
      NEGOCIO1,
      new Date(Date.now() - DIA_MS).toISOString(),
      4,
    );
    id.pronto = await crearSalida(
      a,
      NEGOCIO1,
      new Date(Date.now() + 30 * 60_000).toISOString(),
      4,
    );
  });

  afterAll(async () => {
    if (reservasCreadas.length)
      await admin.from('reservas').delete().in('id', reservasCreadas);
    await admin.from('salidas').delete().in('id', salidasCreadas);
    await admin.from('tours').delete().in('id', toursCreados);
    await admin.from('guia').delete().eq('slug', SLUG_GUIA);
  });

  describe('buscar_tours', () => {
    const buscar = (
      entrada: Parameters<typeof buscarTours>[1],
      ctx: Parameters<typeof buscarTours>[2] = ES,
    ) => buscarTours(admin, { texto: PREFIJO, ...entrada }, ctx);

    it('respeta el rango de fechas', async () => {
      const dia3 = await buscar({ fecha_desde: dia(3), fecha_hasta: dia(3) });
      expect(dia3.tours.map((t) => t.tour).sort()).toEqual([
        `${PREFIJO} Alfa ES`,
        `${PREFIJO} Beta ES`,
      ]);
      expect(dia3.tours.every((t) => t.salidas.length === 1)).toBe(true);

      const dia5 = await buscar({ fecha_desde: dia(5), fecha_hasta: dia(5) });
      expect(dia5.tours.map((t) => t.tour)).toEqual([`${PREFIJO} Alfa ES`]);

      const fuera = await buscar({
        fecha_desde: dia(20),
        fecha_hasta: dia(21),
      });
      expect(fuera.tours).toEqual([]);
    });

    it('por defecto busca de hoy a 14 días y muestra hasta 3 salidas por tour', async () => {
      const r = await buscar({});
      const alfa = r.tours.find((t) => t.tour === `${PREFIJO} Alfa ES`)!;
      expect(alfa.salidas).toHaveLength(3);
      expect(alfa.salidas.map((s) => s.id)).toEqual([id.a3, id.a5, id.a6]);
    });

    it('no ofrece salidas pasadas ni que empiezan en menos de una hora', async () => {
      const r = await buscar({ fecha_desde: dia(-1), fecha_hasta: dia(14) });
      const ids = r.tours.flatMap((t) => t.salidas.map((s) => s.id));
      expect(ids).not.toContain(id.pasada);
      expect(ids).not.toContain(id.pronto);
    });

    it('respeta las personas: pide más cupos de los que hay y no aparece el tour', async () => {
      const r = await buscar({
        fecha_desde: dia(3),
        fecha_hasta: dia(3),
        personas: 5,
      });
      expect(r.tours.map((t) => t.tour)).toEqual([`${PREFIJO} Beta ES`]);
    });

    it('descuenta los cupos que ya están reservados', async () => {
      const token = generarToken();
      const { data: reserva } = await admin.rpc('crear_reserva', {
        p_salida_id: id.a5,
        p_nombre: 'Prueba',
        p_email: 'prueba@example.com',
        p_telefono: '+50688887777',
        p_personas: 3,
        p_idioma: 'es',
        p_token_hash: hashToken(token),
      });
      reservasCreadas.push(reserva!.id);

      const una = await buscar({
        fecha_desde: dia(5),
        fecha_hasta: dia(5),
        personas: 1,
      });
      expect(una.tours[0].salidas[0].cupos).toBe(1);
      const dos = await buscar({
        fecha_desde: dia(5),
        fecha_hasta: dia(5),
        personas: 2,
      });
      expect(dos.tours).toEqual([]);
    });

    it('filtra por negocio, y el del contexto se usa si no se pide otro', async () => {
      const rango = { fecha_desde: dia(3), fecha_hasta: dia(3) };
      const n1 = await buscar({ ...rango, negocio_slug: 'aventuras-rincon' });
      expect(n1.tours.map((t) => t.negocio)).toEqual(['Aventuras Rincón']);

      const deContexto = await buscar(rango, {
        ...ES,
        negocioSlug: 'mar-y-sol-tamarindo',
      });
      expect(deContexto.tours.map((t) => t.negocio)).toEqual([
        'Mar y Sol Tamarindo',
      ]);

      const pedido = await buscar(
        { ...rango, negocio_slug: 'aventuras-rincon' },
        { ...ES, negocioSlug: 'mar-y-sol-tamarindo' },
      );
      expect(pedido.tours.map((t) => t.negocio)).toEqual(['Aventuras Rincón']);
    });

    it('no devuelve tours inactivos', async () => {
      const r = await buscar({ fecha_desde: dia(3), fecha_hasta: dia(3) });
      expect(r.tours.map((t) => t.tour).join()).not.toContain('Gamma');
    });

    it('da nombres, precios y enlaces en el idioma de la conversación', async () => {
      const es = await buscar({
        fecha_desde: dia(3),
        fecha_hasta: dia(3),
        negocio_slug: 'aventuras-rincon',
      });
      expect(es.tours[0]).toMatchObject({
        tour: `${PREFIJO} Alfa ES`,
        precio_texto: 'US$50',
        duracion_texto: '2 h',
        url: `/es/aventuras-rincon/${SLUG_A}`,
      });
      const en = await buscar(
        {
          fecha_desde: dia(3),
          fecha_hasta: dia(3),
          negocio_slug: 'aventuras-rincon',
        },
        EN,
      );
      expect(en.tours[0]).toMatchObject({
        tour: `${PREFIJO} Alfa EN`,
        precio_texto: '$50',
        url: `/en/aventuras-rincon/${SLUG_A}`,
      });
    });

    it('busca por texto en el idioma activo y devuelve un máximo de 3 tours', async () => {
      const r = await buscarTours(admin, { texto: 'snorkel' }, ES);
      expect(r.tours.length).toBeLessThanOrEqual(3);
      for (const t of r.tours)
        expect(t.tour.toLowerCase()).toContain('snorkel');
    });

    it('al modelo le llegan solo los campos que usa, sin imagen ni enlaces', async () => {
      const r = await buscar({ fecha_desde: dia(3), fecha_hasta: dia(3) });
      const vista = vistaModelo(r) as unknown as {
        value: { tours: Record<string, unknown>[] };
      };
      const t = vista.value.tours[0];
      expect(Object.keys(t).sort()).toEqual(
        ['duracion', 'negocio', 'precio', 'salidas', 'tour'].sort(),
      );
      expect(JSON.stringify(vista)).not.toContain('imagen');
      expect(JSON.stringify(vista)).not.toContain('/es/aventuras');
      // La pantalla sí recibe el resultado completo, con la imagen para la tarjeta.
      expect(r.tours[0].imagen_url).toBeTruthy();
    });

    it('valida la entrada con Zod', () => {
      expect(buscarToursSchema.safeParse({ personas: 0 }).success).toBe(false);
      expect(buscarToursSchema.safeParse({ personas: 51 }).success).toBe(false);
      expect(
        buscarToursSchema.safeParse({ fecha_desde: '15/11/2026' }).success,
      ).toBe(false);
      expect(buscarToursSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('preparar_reserva', () => {
    it('arma la URL y el resumen de una salida con cupo', async () => {
      const r = await prepararReserva(
        admin,
        { salida_id: id.a3, personas: 2 },
        ES,
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.url).toBe(
        `/es/aventuras-rincon/${SLUG_A}?salida=${id.a3}&personas=2`,
      );
      // 2 x US$50 al 30 % de depósito = US$30.
      expect(r.resumen).toContain(`${PREFIJO} Alfa ES`);
      expect(r.resumen).toContain('2 personas');
      expect(r.resumen).toContain('depósito US$30');

      const en = await prepararReserva(
        admin,
        { salida_id: id.a3, personas: 1 },
        EN,
      );
      expect(en.ok && en.url).toBe(
        `/en/aventuras-rincon/${SLUG_A}?salida=${id.a3}&personas=1`,
      );
      expect(en.ok && en.resumen).toContain('1 person');
    });

    it('rechaza una salida pasada, una que empieza en menos de una hora y una de un tour inactivo', async () => {
      for (const salida of [id.pasada, id.pronto, id.c3]) {
        const r = await prepararReserva(
          admin,
          { salida_id: salida, personas: 1 },
          ES,
        );
        expect(r).toEqual({ ok: false, motivo: 'SALIDA_NO_DISPONIBLE' });
      }
    });

    it('rechaza una salida que no existe', async () => {
      const r = await prepararReserva(
        admin,
        { salida_id: '00000000-0000-4000-8000-000000000000', personas: 1 },
        ES,
      );
      expect(r).toEqual({ ok: false, motivo: 'SALIDA_NO_DISPONIBLE' });
    });

    it('rechaza cuando no hay cupo suficiente', async () => {
      const r = await prepararReserva(
        admin,
        { salida_id: id.a3, personas: 5 },
        ES,
      );
      expect(r).toEqual({ ok: false, motivo: 'SIN_CUPO' });
    });

    it('valida la entrada con Zod', () => {
      expect(
        prepararReservaSchema.safeParse({
          salida_id: 'no-es-uuid',
          personas: 1,
        }).success,
      ).toBe(false);
      expect(
        prepararReservaSchema.safeParse({ salida_id: id.a3, personas: 0 })
          .success,
      ).toBe(false);
      expect(
        prepararReservaSchema.safeParse({ salida_id: id.a3, personas: 51 })
          .success,
      ).toBe(false);
    });
  });

  describe.skipIf(!hayEmbed)('buscar_guia', () => {
    it('devuelve solo fichas revisadas', async () => {
      const titulo = `Zzyzx ${ID} geyser`;
      const contenido =
        `${titulo}. A made-up place used only in tests, with fumaroles, steaming vents and a mud pool. `.repeat(
          2,
        );
      const embedding = await generarEmbedding(`${titulo}. ${contenido}`);
      const { error } = await admin.from('guia').insert({
        slug: SLUG_GUIA,
        tipo: 'parque',
        titulo_es: `Zzyzx ${ID}`,
        titulo_en: titulo,
        contenido_es: contenido,
        contenido_en: contenido,
        fuente_nombre: 'Prueba',
        fuente_url: 'https://example.com',
        revisado: false,
        embedding: JSON.stringify(embedding),
      });
      expect(error).toBeNull();

      const sinRevisar = await buscarGuia(
        admin,
        { consulta_en: `${titulo}. ${contenido}` },
        EN,
      );
      expect(sinRevisar.fichas.map((f) => f.titulo)).not.toContain(titulo);

      await admin.from('guia').update({ revisado: true }).eq('slug', SLUG_GUIA);
      const revisada = await buscarGuia(
        admin,
        { consulta_en: `${titulo}. ${contenido}` },
        EN,
      );
      expect(revisada.fichas.map((f) => f.titulo)).toContain(titulo);
    });

    it('responde en el idioma de la conversación y con fuente https', async () => {
      const es = await buscarGuia(
        admin,
        { consulta_en: 'Tamarindo beach surfing and blue flag' },
        ES,
      );
      expect(es.fichas.length).toBeGreaterThan(0);
      expect(es.fichas.map((f) => f.titulo)).toContain('Playa Tamarindo');
      for (const f of es.fichas) expect(f.fuente_url).toMatch(/^https:\/\//);

      const en = await buscarGuia(
        admin,
        { consulta_en: 'Tamarindo beach surfing and blue flag' },
        EN,
      );
      expect(en.fichas.map((f) => f.titulo)).toContain('Tamarindo Beach');
    });

    it('recorta cada ficha a unos 600 caracteres y al modelo no le manda la URL', async () => {
      const r = await buscarGuia(
        admin,
        { consulta_en: 'What to expect month by month in Guanacaste weather' },
        EN,
      );
      expect(r.fichas.length).toBeGreaterThan(0);
      for (const f of r.fichas)
        expect(f.contenido.length).toBeLessThanOrEqual(601);
      const vista = JSON.stringify(vistaModelo(r));
      expect(vista).not.toContain('https://');
      expect(vista).toContain('fuente_nombre');
    });

    it('no devuelve nada si la consulta no se parece a ninguna ficha', async () => {
      const r = await buscarGuia(
        admin,
        { consulta_en: 'quarterly corporate tax filing deadlines' },
        EN,
      );
      expect(r.fichas).toEqual([]);
    });

    it('valida la entrada con Zod', () => {
      expect(buscarGuiaSchema.safeParse({ consulta_en: '' }).success).toBe(
        false,
      );
      expect(
        buscarGuiaSchema.safeParse({ consulta_en: 'x'.repeat(301) }).success,
      ).toBe(false);
    });
  });
});
