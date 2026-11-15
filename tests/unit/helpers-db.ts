import { createClient } from '@supabase/supabase-js';

// Las pruebas que usan la base local cargan .env.local y se saltan solas si no hay base
// (por ejemplo, en el job `calidad` del CI, que no levanta Supabase).
try {
  process.loadEnvFile('.env.local');
} catch {
  // Sin .env.local: se usa el entorno tal cual.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const claveAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

async function alcanzable() {
  if (!url || !claveServicio || claveServicio.includes('placeholder'))
    return false;
  try {
    const r = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: claveServicio },
      signal: AbortSignal.timeout(1500),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** true si hay una base local de Supabase lista para las pruebas. */
export const hayBase = await alcanzable();

export const admin = createClient(
  url || 'http://127.0.0.1:54321',
  claveServicio || 'x',
  {
    auth: { persistSession: false },
  },
);

export const anon = createClient(
  url || 'http://127.0.0.1:54321',
  claveAnon || 'x',
  {
    auth: { persistSession: false },
  },
);
