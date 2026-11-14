/**
 * Prueba la ruta del webhook sin pasar por Stripe: firma eventos con el secreto local.
 * Verifica firma inválida (400), evento repetido (200 sin reprocesar) y eventos ajenos.
 *
 * Uso (con la app corriendo en localhost:3000):
 *   npx tsx --env-file=.env.local scripts/probar-webhook.ts
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const URL_WEBHOOK = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/stripe/webhook`;
const secreto = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const id = `evt_prueba_${Date.now()}`;
const payload = JSON.stringify({
  id,
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_sin_reserva',
      object: 'checkout.session',
      metadata: {},
    },
  },
});

async function enviar(cuerpo: string, firma: string | null) {
  const res = await fetch(URL_WEBHOOK, {
    method: 'POST',
    headers: firma ? { 'stripe-signature': firma } : {},
    body: cuerpo,
  });
  return { estado: res.status, texto: await res.text() };
}

let fallos = 0;
function comprobar(nombre: string, ok: boolean, detalle: unknown) {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${nombre}`, ok ? '' : detalle);
  if (!ok) fallos++;
}

async function main() {
  const firma = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: secreto,
  });

  const sinFirma = await enviar(payload, null);
  comprobar('sin firma responde 400', sinFirma.estado === 400, sinFirma);

  const mala = await enviar(
    payload,
    stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_incorrecto',
    }),
  );
  comprobar('firma inválida responde 400', mala.estado === 400, mala);

  const alterado = await enviar(payload.replace('cs_test', 'cs_hack'), firma);
  comprobar('cuerpo alterado responde 400', alterado.estado === 400, alterado);

  const primera = await enviar(payload, firma);
  comprobar(
    'evento válido responde 200',
    primera.estado === 200 && primera.texto === 'ok',
    primera,
  );

  const segunda = await enviar(payload, firma);
  comprobar(
    'el mismo evento no se reprocesa (200)',
    segunda.estado === 200 && segunda.texto === 'Evento repetido',
    segunda,
  );

  const { count } = await db
    .from('eventos_stripe')
    .select('*', { count: 'exact', head: true })
    .eq('id', id);
  comprobar('el evento quedó registrado una sola vez', count === 1, { count });

  await db.from('eventos_stripe').delete().eq('id', id);
  if (fallos) {
    console.error(`${fallos} comprobaciones fallaron`);
    process.exit(1);
  }
  console.log('Todas las comprobaciones pasaron.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
