/**
 * Prueba de punta a punta los correos de confirmación sin pagar en Stripe:
 * crea reservas pendientes, envía al webhook un evento `checkout.session.completed`
 * firmado con el secreto local y deja que la app envíe los correos por Resend.
 *
 * Usa las direcciones de prueba de Resend (delivered+etiqueta@resend.dev), que
 * aceptan el correo sin entregarlo a nadie. Con el remitente onboarding@resend.dev,
 * cualquier otra dirección es rechazada: eso sirve para probar el fallo de Resend.
 *
 * Uso (app corriendo en localhost:3000, supabase start):
 *   npx tsx --env-file=.env.local scripts/probar-correos.ts
 * Luego mirá en los logs de la app las líneas "Correo enviado: <id>".
 */
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { generarToken, hashToken } from '../src/lib/tokens';

const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const NEGOCIO = 'aaaaaaaa-0000-0000-0000-000000000001';

async function casos() {
  const { data: salidas } = await db
    .from('salidas')
    .select('id')
    .eq('tour_id', 'bbbbbbbb-0000-0000-0000-000000000001')
    .order('inicia_en')
    .limit(4);
  if (!salidas || salidas.length < 4)
    throw new Error('Faltan salidas: corré supabase db reset');
  const original = (
    await db
      .from('negocios')
      .select('email_contacto')
      .eq('id', NEGOCIO)
      .single()
  ).data!.email_contacto;

  return {
    original,
    lista: [
      // Turista en inglés, correo del negocio válido para Resend.
      {
        etiqueta: 'en + negocio ok',
        idioma: 'en',
        turista: 'delivered+turista-en@resend.dev',
        negocio: 'delivered+negocio@resend.dev',
        salida: salidas[0].id,
      },
      // Turista en español, correo del negocio que Resend rechaza: el webhook debe responder 200 igual.
      {
        etiqueta: 'es + negocio rechazado',
        idioma: 'es',
        turista: 'delivered+turista-es@resend.dev',
        negocio: 'dueno1@test.com',
        salida: salidas[1].id,
      },
    ] as const,
  };
}

async function main() {
  const { original, lista } = await casos();
  try {
    for (const c of lista) {
      await db
        .from('negocios')
        .update({ email_contacto: c.negocio })
        .eq('id', NEGOCIO);
      const token = generarToken();
      const { data: reserva, error } = await db.rpc('crear_reserva', {
        p_salida_id: c.salida,
        p_nombre: 'Ana <Mora>',
        p_email: c.turista,
        p_telefono: '+50688887777',
        p_personas: 2,
        p_idioma: c.idioma,
        p_token_hash: hashToken(token),
      });
      if (error || !reserva)
        throw new Error(`crear_reserva: ${error?.message}`);

      const payload = JSON.stringify({
        id: `evt_correo_${Date.now()}_${c.idioma}`,
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_test_correo_${c.idioma}`,
            object: 'checkout.session',
            payment_intent: `pi_test_correo_${c.idioma}`,
            success_url: `${sitio}/${c.idioma}/reserva/gracias?t=${token}`,
            metadata: { reserva_id: reserva.id },
          },
        },
      });
      const firma = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET!,
      });
      const res = await fetch(`${sitio}/api/stripe/webhook`, {
        method: 'POST',
        headers: { 'stripe-signature': firma },
        body: payload,
      });
      const { data: estado } = await db
        .from('reservas')
        .select('estado')
        .eq('id', reserva.id)
        .single();
      console.log(
        `${c.etiqueta}: webhook ${res.status}, reserva ${estado?.estado}`,
      );
    }
  } finally {
    await db
      .from('negocios')
      .update({ email_contacto: original })
      .eq('id', NEGOCIO);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
