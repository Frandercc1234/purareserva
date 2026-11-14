/**
 * Prueba de concurrencia: 10 llamadas en paralelo a crear_reserva sobre una
 * salida con cupo 3 deben crear exactamente 3 reservas de 1 persona.
 *
 * Uso (con `supabase start` corriendo):
 *   npx tsx --env-file=.env.local scripts/concurrencia.ts
 */
import { createClient } from '@supabase/supabase-js';
import { generarToken, hashToken } from '../src/lib/tokens';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key)
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY',
  );

const db = createClient(url, key, { auth: { persistSession: false } });
const CUPO = 3;
const INTENTOS = 10;

async function main() {
  const { data: tour } = await db
    .from('tours')
    .select('id, negocio_id')
    .eq('activo', true)
    .limit(1)
    .single();
  if (!tour) throw new Error('No hay tours activos; corré supabase db reset');

  // Salida propia de la prueba, lejos en el futuro para no chocar con el seed.
  const inicia = new Date(Date.now() + 400 * 86_400_000).toISOString();
  const { data: salida, error: eSalida } = await db
    .from('salidas')
    .insert({
      tour_id: tour.id,
      negocio_id: tour.negocio_id,
      inicia_en: inicia,
      cupo: CUPO,
    })
    .select('id')
    .single();
  if (eSalida || !salida)
    throw new Error(`No se pudo crear la salida: ${eSalida?.message}`);

  try {
    const resultados = await Promise.all(
      Array.from({ length: INTENTOS }, (_, i) =>
        db.rpc('crear_reserva', {
          p_salida_id: salida.id,
          p_nombre: `Prueba ${i}`,
          p_email: `prueba${i}@test.com`,
          p_telefono: '88887777',
          p_personas: 1,
          p_idioma: 'es',
          p_token_hash: hashToken(generarToken()),
        }),
      ),
    );
    const creadas = resultados.filter((r) => !r.error).length;
    const sinCupo = resultados.filter((r) =>
      r.error?.message.includes('SIN_CUPO'),
    ).length;
    const otros = resultados.filter(
      (r) => r.error && !r.error.message.includes('SIN_CUPO'),
    );
    console.log({
      creadas,
      sinCupo,
      otros: otros.map((o) => o.error?.message),
    });

    const { data: filas } = await db
      .from('reservas')
      .select('personas')
      .eq('salida_id', salida.id);
    const enBase = filas?.length ?? 0;
    const personas = (filas ?? []).reduce((s, f) => s + f.personas, 0);

    if (
      creadas !== CUPO ||
      enBase !== CUPO ||
      personas !== CUPO ||
      otros.length
    ) {
      console.error(
        `FALLÓ: se esperaban ${CUPO} reservas y hubo ${creadas} (en base: ${enBase}, personas: ${personas})`,
      );
      process.exitCode = 1;
    } else {
      console.log(
        `OK: ${INTENTOS} intentos simultáneos, ${CUPO} reservas creadas, sin sobreventa.`,
      );
    }
  } finally {
    await db.from('reservas').delete().eq('salida_id', salida.id);
    await db.from('salidas').delete().eq('id', salida.id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
