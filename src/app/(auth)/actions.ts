'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  camposDeZod,
  loginSchema,
  registroSchema,
  type Resultado,
} from '@/lib/validaciones';

export type EstadoForm = Resultado | null;

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

    const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${sitio}/auth/callback`,
        // Con confirmación de correo el negocio se crea al primer ingreso, con estos datos.
        data: { nombre_negocio: nombreNegocio, slug },
      },
    });
    if (error) return { ok: false, error: 'VALIDACION' };
    // Sin sesión: Supabase envió un correo de confirmación.
    if (!data.session) return { ok: true };
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
