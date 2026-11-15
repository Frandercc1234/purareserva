import type Stripe from 'stripe';
import { notificarConfirmacion, notificarSinCupo } from '@/lib/email';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type Admin = ReturnType<typeof createAdminClient>;

/** Reserva a la que se refiere la sesión: por metadata o, si falta, por session id. */
async function reservaDeSesion(admin: Admin, sesion: Stripe.Checkout.Session) {
  const id = sesion.metadata?.reserva_id;
  const consulta = admin.from('reservas').select('id, estado');
  const { data } = id
    ? await consulta.eq('id', id).maybeSingle()
    : await consulta.eq('stripe_session_id', sesion.id).maybeSingle();
  return data;
}

/** El token de la reserva viaja en la success_url de la sesión (?t=...). */
function tokenDeSesion(sesion: Stripe.Checkout.Session) {
  try {
    return new URL(sesion.success_url ?? '').searchParams.get('t');
  } catch {
    return null;
  }
}

/** Un problema al enviar correos nunca debe hacer fallar el webhook. */
async function avisar(accion: () => Promise<void>) {
  try {
    await accion();
  } catch (e) {
    console.error('Webhook de Stripe: error al enviar correos', e);
  }
}

async function completada(admin: Admin, sesion: Stripe.Checkout.Session) {
  const reserva = await reservaDeSesion(admin, sesion);
  if (!reserva) return; // sin reserva asociada (p. ej. eventos de prueba)

  const paymentIntent =
    typeof sesion.payment_intent === 'string'
      ? sesion.payment_intent
      : (sesion.payment_intent?.id ?? null);

  const { data: resultado, error } = await admin.rpc('confirmar_reserva_pago', {
    p_reserva_id: reserva.id,
    p_payment_intent: paymentIntent ?? '',
  });
  if (error) throw error;

  const token = tokenDeSesion(sesion);

  if (resultado === 'confirmada' && token) {
    await avisar(() => notificarConfirmacion(admin, reserva.id, token));
  }

  if (resultado === 'sin_cupo') {
    // Pagó después de vencer la retención y el cupo ya se ocupó: se reembolsa.
    if (!paymentIntent)
      throw new Error('Pago sin payment_intent: no se puede reembolsar');
    await getStripe().refunds.create({ payment_intent: paymentIntent });
    const { error: e } = await admin
      .from('reservas')
      .update({
        estado: 'reembolsada',
        cancelada_en: new Date().toISOString(),
        stripe_payment_intent: paymentIntent,
      })
      .eq('id', reserva.id);
    if (e) throw e;
    if (token) await avisar(() => notificarSinCupo(admin, reserva.id, token));
  }
}

async function expirada(admin: Admin, sesion: Stripe.Checkout.Session) {
  const reserva = await reservaDeSesion(admin, sesion);
  if (!reserva) return;
  const { error } = await admin
    .from('reservas')
    .update({ estado: 'expirada' })
    .eq('id', reserva.id)
    .eq('estado', 'pendiente_pago');
  if (error) throw error;
}

export async function POST(request: Request) {
  const firma = request.headers.get('stripe-signature');
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!firma || !secreto)
    return new Response('Falta la firma', { status: 400 });

  const cuerpo = await request.text();
  let evento: Stripe.Event;
  try {
    evento = getStripe().webhooks.constructEvent(cuerpo, firma, secreto);
  } catch {
    return new Response('Firma inválida', { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotencia: cada evento se procesa una sola vez.
  const { error: eInsert } = await admin
    .from('eventos_stripe')
    .insert({ id: evento.id, tipo: evento.type });
  if (eInsert) {
    if (eInsert.code === '23505')
      return new Response('Evento repetido', { status: 200 });
    return new Response('Error interno', { status: 500 });
  }

  try {
    if (evento.type === 'checkout.session.completed') {
      await completada(admin, evento.data.object as Stripe.Checkout.Session);
    } else if (evento.type === 'checkout.session.expired') {
      await expirada(admin, evento.data.object as Stripe.Checkout.Session);
    }
    return new Response('ok', { status: 200 });
  } catch (e) {
    console.error(
      'Webhook de Stripe: error procesando el evento',
      evento.id,
      e,
    );
    // Se libera el id para que el reintento de Stripe sí se procese.
    await admin.from('eventos_stripe').delete().eq('id', evento.id);
    return new Response('Error interno', { status: 500 });
  }
}
