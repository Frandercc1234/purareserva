import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Sesión y negocio del dueño actual. Redirige si falta alguno. */
export async function contextoPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: negocio } = await supabase
    .from('negocios')
    .select('id, slug, nombre')
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!negocio) redirect('/registro');

  return { supabase, user, negocio };
}
