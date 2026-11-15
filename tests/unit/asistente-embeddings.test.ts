import { describe, expect, it } from 'vitest';
import { DIMENSIONES, generarEmbedding } from '@/lib/asistente/embeddings';
import { hayBase } from './helpers-db';

/** Con `supabase functions serve embed` en marcha (o la función desplegada). */
async function hayFuncion() {
  if (!hayBase) return false;
  try {
    await generarEmbedding('ping');
    return true;
  } catch {
    return false;
  }
}
const hayEmbed = await hayFuncion();

// Los vectores salen normalizados: el producto punto es la similitud coseno.
const similitud = (a: number[], b: number[]) =>
  a.reduce((suma, x, i) => suma + x * b[i], 0);

describe.skipIf(!hayEmbed)('asistente: embeddings (función embed)', () => {
  it('devuelve 384 números', async () => {
    const v = await generarEmbedding('beach in Tamarindo');
    expect(v).toHaveLength(DIMENSIONES);
    expect(v.every((x) => Number.isFinite(x))).toBe(true);
  });

  it('"beach in Tamarindo" se parece más a "Tamarindo surf beach" que a "volcano hiking"', async () => {
    const [consulta, playa, volcan] = await Promise.all([
      generarEmbedding('beach in Tamarindo'),
      generarEmbedding('Tamarindo surf beach'),
      generarEmbedding('volcano hiking'),
    ]);
    expect(similitud(consulta, playa)).toBeGreaterThan(
      similitud(consulta, volcan),
    );
  });

  it('rechaza llamadas sin la service role key y textos demasiado largos', async () => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embed`;
    const sinClave = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer falsa' },
      body: JSON.stringify({ texto: 'hola' }),
    });
    expect(sinClave.status).toBe(401);

    const largo = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ texto: 'x'.repeat(2001) }),
    });
    expect(largo.status).toBe(400);
  });
});
