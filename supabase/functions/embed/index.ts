// Edge Function: texto -> vector de 384 dimensiones con el modelo gte-small de Supabase.
// Solo acepta llamadas con un token de rol service_role (la usa el servidor de la app).

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

/** Rol del token (el payload del JWT, ya validado por la plataforma). */
function rolDe(jwt: string) {
  try {
    const carga = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(carga)).role as string | undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'METODO' }, 405);

  // La plataforma ya verificó la firma del token (verify_jwt = true); aquí solo se acepta
  // el rol service_role (la anon key y los tokens de usuarios quedan fuera).
  const recibida = (req.headers.get('Authorization') ?? '').replace(
    /^Bearer /,
    '',
  );
  if (rolDe(recibida) !== 'service_role') {
    return json({ error: 'NO_AUTORIZADO' }, 401);
  }

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
