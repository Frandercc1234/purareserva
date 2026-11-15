import { afterAll, describe, expect, it } from 'vitest';
import { admin, anon, hayBase } from './helpers-db';

const CLAVE = `prueba-${Date.now()}`;
const SLUG = `prueba-${Date.now()}`;

describe.skipIf(!hayBase)('asistente: base de datos', () => {
  afterAll(async () => {
    await admin.from('uso_asistente').delete().eq('clave', CLAVE);
    await admin.from('guia').delete().eq('slug', SLUG);
  });

  it('registrar_mensaje_asistente respeta el límite del visitante', async () => {
    const llamar = () =>
      admin.rpc('registrar_mensaje_asistente', {
        p_clave: CLAVE,
        p_limite_visitante: 2,
        p_limite_global: 1_000_000,
      });
    expect((await llamar()).data).toBe(true);
    expect((await llamar()).data).toBe(true);
    expect((await llamar()).data).toBe(false);

    // El tercero no suma: el visitante queda en 2.
    const { data } = await admin
      .from('uso_asistente')
      .select('mensajes')
      .eq('clave', CLAVE)
      .single();
    expect(data?.mensajes).toBe(2);
  });

  it('con la clave anon no se puede leer la guía ni llamar a las funciones', async () => {
    const texto = 'x'.repeat(120);
    await admin.from('guia').insert({
      slug: SLUG,
      tipo: 'playa',
      titulo_es: 'Prueba',
      titulo_en: 'Test',
      contenido_es: texto,
      contenido_en: texto,
      fuente_nombre: 'Prueba',
      fuente_url: 'https://example.com',
      revisado: true,
    });

    // RLS sin políticas: el público no ve ninguna fila.
    const lectura = await anon.from('guia').select('slug');
    expect(lectura.data ?? []).toEqual([]);
    const uso = await anon.from('uso_asistente').select('clave');
    expect(uso.data ?? []).toEqual([]);

    // Las funciones solo las puede ejecutar la service role.
    const registro = await anon.rpc('registrar_mensaje_asistente', {
      p_clave: CLAVE,
      p_limite_visitante: 2,
      p_limite_global: 1_000_000,
    });
    expect(registro.error).not.toBeNull();
    const busqueda = await anon.rpc('buscar_guia', {
      p_embedding: JSON.stringify(Array(384).fill(0)),
    });
    expect(busqueda.error).not.toBeNull();
  });
});
