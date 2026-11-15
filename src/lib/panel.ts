import type { SupabaseClient, User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

const CAMPOS = 'id, slug, nombre';

/**
 * Negocio del dueño. Si el registro quedó pendiente de confirmar el correo, el
 * negocio todavía no existe: se crea ahora con los datos guardados al registrarse.
 */
export async function negocioDelDueno(
  supabase: SupabaseClient<Database>,
  user: User,
) {
  const buscar = () =>
    supabase
      .from('negocios')
      .select(CAMPOS)
      .eq('owner_id', user.id)
      .maybeSingle();

  const { data: existente } = await buscar();
  if (existente) return existente;

  const meta = user.user_metadata as {
    nombre_negocio?: string;
    slug?: string;
  };
  if (!meta.nombre_negocio || !meta.slug || !user.email) return null;

  await supabase.rpc('crear_negocio', {
    p_slug: meta.slug,
    p_nombre: meta.nombre_negocio,
    p_email: user.email,
  });
  // Si dos pedidos llegan a la vez, uno falla por la restricción única y este lee
  // el que ganó. Se reintenta un instante por si el otro todavía está guardando.
  for (let intento = 0; intento < 4; intento++) {
    const { data } = await buscar();
    if (data) return data;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

/** Sesión y negocio del dueño actual. Redirige si falta alguno. */
export async function contextoPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const negocio = await negocioDelDueno(supabase, user);
  if (!negocio) redirect('/registro');

  return { supabase, user, negocio };
}
