'use server';

import { revalidatePath } from 'next/cache';
import { evaluarCancelacion } from '@/lib/cancelacion';
import { notificarCancelacion } from '@/lib/email';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/tokens';
import type { CodigoError } from '@/lib/validaciones';

export type EstadoCancelacion =
  { ok: true; reembolso: boolean } | { ok: false; error: CodigoError } | null;

export async function cancelarReserva(
  _prev: EstadoCancelacion,
  formData: FormData,
): Promise<EstadoCancelacion> {
  const token = String(formData.get('token') ?? '');
  if (!token) return { ok: false, error: 'RESERVA_NO_EXISTE' };
  const admin = createAdminClient();

  const { data: reserva } = await admin
    .from('reservas')
    .select(
      'id, estado, stripe_payment_intent, salidas(inicia_en, tours(negocios(horas_cancelacion)))',
    )
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (!reserva?.salidas) return { ok: false, error: 'RESERVA_NO_EXISTE' };

  const iniciaEn = new Date(reserva.salidas.inicia_en);
  const horas = reserva.salidas.tours?.negocios?.horas_cancelacion;
  const ahora = new Date();
  if (
    reserva.estado !== 'confirmada' ||
    horas === undefined ||
    iniciaEn.getTime() <= ahora.getTime()
  ) {
    return { ok: false, error: 'NO_CANCELABLE' };
  }

  const { reembolso } = evaluarCancelacion(iniciaEn, horas, ahora);
  const nuevoEstado = reembolso ? 'reembolsada' : 'cancelada';

  // Se "reclama" la reserva con una actualización condicional: si dos clics
  // llegan juntos, solo uno pasa de 'confirmada' al nuevo estado.
  const { data: reclamada } = await admin
    .from('reservas')
    .update({ estado: nuevoEstado, cancelada_en: ahora.toISOString() })
    .eq('id', reserva.id)
    .eq('estado', 'confirmada')
    .select('id')
    .maybeSingle();
  if (!reclamada) return { ok: false, error: 'NO_CANCELABLE' };

  if (reembolso) {
    try {
      if (!reserva.stripe_payment_intent) {
        throw new Error('La reserva no tiene payment_intent para reembolsar');
      }
      await getStripe().refunds.create(
        { payment_intent: reserva.stripe_payment_intent },
        { idempotencyKey: `reembolso-${reserva.id}` },
      );
    } catch (e) {
      console.error('Stripe: no se pudo reembolsar', reserva.id, e);
      // Se devuelve la reserva a confirmada: el turista puede reintentar.
      await admin
        .from('reservas')
        .update({ estado: 'confirmada', cancelada_en: null })
        .eq('id', reserva.id);
      return { ok: false, error: 'STRIPE_ERROR' };
    }
  }

  try {
    await notificarCancelacion(admin, reserva.id, token, reembolso);
  } catch (e) {
    console.error('No se pudieron enviar los correos de cancelación', e);
  }

  revalidatePath('/[locale]/reserva/[token]', 'page');
  return { ok: true, reembolso };
}
