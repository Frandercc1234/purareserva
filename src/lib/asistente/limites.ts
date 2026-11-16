import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/** Primera IP de `x-forwarded-for` (la del visitante); sin ella, un valor fijo. */
export function ipDe(request: Request) {
  const reenviada = request.headers.get('x-forwarded-for');
  return reenviada?.split(',')[0]?.trim() || 'desconocida';
}

/** Clave anónima del visitante: sha256(ip + sal). No se guarda la IP. */
export function claveVisitante(ip: string) {
  const sal = process.env.ASISTENTE_SALT;
  if (!sal) throw new Error('Falta ASISTENTE_SALT');
  return createHash('sha256').update(`${ip}${sal}`).digest('hex');
}

function entero(valor: string | undefined, porDefecto: number) {
  const n = Number.parseInt(valor ?? '', 10);
  return Number.isInteger(n) && n > 0 ? n : porDefecto;
}

export const limiteVisitante = () =>
  entero(process.env.ASISTENTE_LIMITE_VISITANTE, 20);
/**
 * Tope del día para todos los visitantes. El plan gratuito de Groq permite 200.000 tokens
 * por día y cada mensaje gasta unos 2.400 (1 turno) a 3.000 (con historial):
 * floor(200.000 × 0,8 / 3.200) = 50. Las solicitudes (1.000 por día) no limitan antes.
 */
export const limiteGlobal = () =>
  entero(process.env.ASISTENTE_LIMITE_GLOBAL, 50);

/**
 * Suma un mensaje al visitante y al total del día. Devuelve false si alguno ya llegó
 * a su límite (y entonces no suma).
 */
export async function registrarMensaje(
  clave: string,
  db = createAdminClient(),
): Promise<boolean> {
  const { data, error } = await db.rpc('registrar_mensaje_asistente', {
    p_clave: clave,
    p_limite_visitante: limiteVisitante(),
    p_limite_global: limiteGlobal(),
  });
  if (error) throw new Error(`registrar_mensaje_asistente: ${error.message}`);
  return data === true;
}
