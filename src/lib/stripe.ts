import 'server-only';
import Stripe from 'stripe';

let instancia: Stripe | null = null;

export function getStripe() {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave || !clave.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
  }
  instancia ??= new Stripe(clave);
  return instancia;
}

export async function crearCheckoutDeposito(datos: {
  reservaId: string;
  negocioId: string;
  token: string;
  locale: 'es' | 'en';
  email: string;
  descripcion: string;
  depositoCents: number;
}) {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  // Stripe exige que la sesión dure al menos 30 minutos desde su creación.
  const expiraEn = Math.floor(Date.now() / 1000) + 31 * 60;

  return getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: datos.email,
    locale: datos.locale,
    expires_at: expiraEn,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: datos.depositoCents,
          product_data: { name: datos.descripcion },
        },
      },
    ],
    metadata: { reserva_id: datos.reservaId, negocio_id: datos.negocioId },
    success_url: `${sitio}/${datos.locale}/reserva/gracias?t=${datos.token}`,
    cancel_url: `${sitio}/${datos.locale}/reserva/cancelado?t=${datos.token}`,
  });
}
