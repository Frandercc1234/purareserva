import { NextResponse } from 'next/server';
import { negocioDelDueno } from '@/lib/panel';
import { createClient } from '@/lib/supabase/server';

/** Destino del enlace del correo de confirmación: canjea el código por una sesión. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // El negocio se crea aquí, una sola vez, antes de entrar al panel.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await negocioDelDueno(supabase, user);
      return NextResponse.redirect(`${origin}/panel`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=confirmacion`);
}
