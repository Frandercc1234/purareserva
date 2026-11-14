'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  loginSchema,
  registroSchema,
  type Resultado,
} from '@/lib/validaciones';

export type EstadoForm = Resultado | null;

function camposDeZod(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  const campos: Record<string, string> = {};
  for (const i of error.issues) campos[String(i.path[0])] ??= i.message;
  return campos;
}

export async function iniciarSesion(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: 'VALIDACION' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: 'NO_AUTORIZADO' };

  redirect('/panel');
}

export async function registrar(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const parsed = registroSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'VALIDACION',
      campos: camposDeZod(parsed.error),
    };
  }
  const { email, password, nombreNegocio, slug } = parsed.data;
  const supabase = await createClient();

  // Si ya hay sesión (alta previa sin negocio), solo se crea el negocio.
  const {
    data: { user: actual },
  } = await supabase.auth.getUser();

  if (!actual) {
    const { data: libre } = await supabase
      .from('negocios')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (libre) {
      return {
        ok: false,
        error: 'SLUG_EN_USO',
        campos: { slug: 'SLUG_EN_USO' },
      };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.session) {
      return { ok: false, error: error ? 'VALIDACION' : 'DESCONOCIDO' };
    }
  }

  const { error } = await supabase.rpc('crear_negocio', {
    p_slug: slug,
    p_nombre: nombreNegocio,
    p_email: email,
  });
  if (error) {
    if (error.code === '23505') {
      return {
        ok: false,
        error: 'SLUG_EN_USO',
        campos: { slug: 'SLUG_EN_USO' },
      };
    }
    return { ok: false, error: 'DESCONOCIDO' };
  }

  redirect('/panel');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
