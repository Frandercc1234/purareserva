import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Compara el token sin filtrar información por el tiempo de respuesta. */
function tokenValido(recibido: string | null) {
  const esperado = process.env.SALUD_TOKEN;
  if (!esperado || !recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Ping anti-pausa: una consulta mínima a la base para que Supabase (plan gratuito)
 * no pause el proyecto por inactividad, y borra el uso viejo del asistente.
 * Lo llama el workflow keepalive.yml.
 */
export async function GET(request: Request) {
  const autorizacion = request.headers.get('authorization') ?? '';
  const token = autorizacion.startsWith('Bearer ')
    ? autorizacion.slice('Bearer '.length)
    : null;
  if (!tokenValido(token)) {
    return NextResponse.json({ error: 'NO_AUTORIZADO' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('negocios').select('id').limit(1);
  if (error) {
    return NextResponse.json({ error: 'DESCONOCIDO' }, { status: 500 });
  }

  // Limpieza del uso del asistente: se conservan los últimos 30 días.
  const limite = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  await admin.from('uso_asistente').delete().lt('dia', limite);

  return NextResponse.json({ ok: true });
}
