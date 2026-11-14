'use server';

import { redirect } from 'next/navigation';
import { formatearFechaHora } from '@/lib/fechas';
import { crearCheckoutDeposito } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { generarToken, hashToken } from '@/lib/tokens';
import {
  camposDeZod,
  reservaSchema,
  type CodigoError,
} from '@/lib/validaciones';

export type EstadoReserva = {
  ok: false;
  error: CodigoError;
  campos?: Record<string, string>;
} | null;

const ERRORES_RPC: CodigoError[] = [
  'SIN_CUPO',
  'SALIDA_NO_DISPONIBLE',
  'SALIDA_NO_EXISTE',
];

export async function crearReserva(
  _prev: EstadoReserva,
  formData: FormData,
): Promise<EstadoReserva> {
  const parsed = reservaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'VALIDACION',
      campos: camposDeZod(parsed.error),
    };
  }
  const { salida_id, nombre, email, telefono, personas, idioma } = parsed.data;

  const token = generarToken();
  const admin = createAdminClient();

  // El precio, el depósito y el negocio se calculan en la base, nunca aquí.
  const { data: reserva, error } = await admin.rpc('crear_reserva', {
    p_salida_id: salida_id,
    p_nombre: nombre,
    p_email: email,
    p_telefono: telefono,
    p_personas: personas,
    p_idioma: idioma,
    p_token_hash: hashToken(token),
  });
  if (error || !reserva) {
    const codigo = ERRORES_RPC.find((c) => error?.message.includes(c));
    return { ok: false, error: codigo ?? 'DESCONOCIDO' };
  }

  const { data: salida } = await admin
    .from('salidas')
    .select('inicia_en, tours(nombre_es, nombre_en)')
    .eq('id', salida_id)
    .single();
  const tour = salida?.tours;
  const nombreTour = idioma === 'en' ? tour?.nombre_en : tour?.nombre_es;
  const descripcion = `${idioma === 'en' ? 'Deposit' : 'Depósito'} – ${
    nombreTour ?? 'Tour'
  } – ${salida ? formatearFechaHora(salida.inicia_en, idioma) : ''}`;

  let urlPago: string | null = null;
  try {
    const sesion = await crearCheckoutDeposito({
      reservaId: reserva.id,
      negocioId: reserva.negocio_id,
      token,
      locale: idioma,
      email: reserva.email,
      descripcion,
      depositoCents: reserva.deposito_cents,
    });
    urlPago = sesion.url;
    await admin
      .from('reservas')
      .update({ stripe_session_id: sesion.id })
      .eq('id', reserva.id);
  } catch (e) {
    console.error('Stripe: no se pudo crear la sesión de pago', e);
  }

  if (!urlPago) {
    // Se libera el cupo: la reserva queda expirada.
    await admin
      .from('reservas')
      .update({ estado: 'expirada' })
      .eq('id', reserva.id);
    return { ok: false, error: 'STRIPE_ERROR' };
  }

  redirect(urlPago);
}
