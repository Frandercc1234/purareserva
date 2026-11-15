// Edge Function: texto -> vector de 384 dimensiones con el modelo gte-small de Supabase.
// Solo acepta llamadas con la service role key (la usa el servidor de la app).

// deno-lint-ignore no-explicit-any
const Supabase = (globalThis as any).Supabase;
const MAX_CARACTERES = 2000;

const session = new Supabase.ai.Session('gte-small');

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'METODO' }, 405);

  const clave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const recibida = (req.headers.get('Authorization') ?? '').replace(
    /^Bearer /,
    '',
  );
  if (!clave || recibida !== clave)
    return json({ error: 'NO_AUTORIZADO' }, 401);

  let texto: unknown;
  try {
    ({ texto } = await req.json());
  } catch {
    return json({ error: 'VALIDACION' }, 400);
  }
  if (
    typeof texto !== 'string' ||
    texto.trim().length === 0 ||
    texto.length > MAX_CARACTERES
  ) {
    return json({ error: 'VALIDACION' }, 400);
  }

  const embedding = await session.run(texto, {
    mean_pool: true,
    normalize: true,
  });
  return json({ embedding: Array.from(embedding as Iterable<number>) });
});
