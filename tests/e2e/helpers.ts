import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';
import Stripe from 'stripe';
import { generarToken, hashToken } from '../../src/lib/tokens';

// Ids fijos del seed (supabase/seed.sql).
export const NEGOCIO1 = 'aaaaaaaa-0000-0000-0000-000000000001';
export const TOUR_CANOPY = 'bbbbbbbb-0000-0000-0000-000000000001';
export const DUENO1 = 'dueno1@test.com';
export const DUENO2 = 'dueno2@test.com';
export const CLAVE = 'Prueba123!';

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Ir a una ruta y esperar a que React termine de hidratar los formularios. */
export async function irA(page: Page, ruta: string) {
  await page.goto(ruta);
  await page.waitForLoadState('networkidle');
}

export async function iniciarSesion(page: Page, email: string) {
  await irA(page, '/login');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/panel');
}

let contador = 0;
/** Texto único por prueba, para no chocar con otros datos. */
export function unico(prefijo: string) {
  return `${prefijo}-${Date.now().toString(36)}${(contador++).toString(36)}`;
}

/** Crea una salida futura del tour (en días u horas) y devuelve su id. */
export async function crearSalida(opciones: {
  tourId?: string;
  enMs: number;
  cupo?: number;
}) {
  const { data, error } = await db
    .from('salidas')
    .insert({
      tour_id: opciones.tourId ?? TOUR_CANOPY,
      negocio_id: NEGOCIO1,
      // Los milisegundos aleatorios evitan chocar con otras salidas del mismo tour.
      inicia_en: new Date(
        Date.now() + opciones.enMs + Math.floor(Math.random() * 59_000),
      ).toISOString(),
      cupo: opciones.cupo ?? 5,
    })
    .select('id')
    .single();
  if (error || !data)
    throw new Error(`No se pudo crear la salida: ${error?.message}`);
  return data.id;
}

export const DIA_MS = 86_400_000;
export const HORA_MS = 3_600_000;

/** Reserva ya creada en la base con un token conocido. */
export async function crearReserva(opciones: {
  salidaId: string;
  email?: string;
  nombre?: string;
  personas?: number;
  idioma?: 'es' | 'en';
  estado?: 'pendiente_pago' | 'confirmada';
  paymentIntent?: string;
}) {
  const token = generarToken();
  const email = opciones.email ?? `${unico('e2e')}@example.com`;
  const { data, error } = await db.rpc('crear_reserva', {
    p_salida_id: opciones.salidaId,
    p_nombre: opciones.nombre ?? 'Prueba E2E',
    p_email: email,
    p_telefono: '+50688887777',
    p_personas: opciones.personas ?? 2,
    p_idioma: opciones.idioma ?? 'es',
    p_token_hash: hashToken(token),
  });
  if (error || !data) throw new Error(`crear_reserva: ${error?.message}`);
  if ((opciones.estado ?? 'confirmada') === 'confirmada') {
    await db
      .from('reservas')
      .update({
        estado: 'confirmada',
        confirmada_en: new Date().toISOString(),
        stripe_payment_intent: opciones.paymentIntent ?? null,
      })
      .eq('id', data.id);
  }
  return { id: data.id, token, email };
}

/** Cobro de prueba real en Stripe (token pm_card_visa, sin teclear tarjetas). */
export async function cobroDePrueba(centavos: number) {
  const pi = await stripe.paymentIntents.create({
    amount: centavos,
    currency: 'usd',
    payment_method: 'pm_card_visa',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });
  return pi.id;
}

/** Simula el aviso de Stripe "pago completado", firmado con el secreto del webhook. */
export async function simularPagoCompletado(opciones: {
  sesionId: string;
  reservaId: string;
  successUrl: string;
}) {
  const payload = JSON.stringify({
    id: `evt_e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: opciones.sesionId,
        object: 'checkout.session',
        payment_intent: `pi_e2e_${Date.now()}`,
        success_url: opciones.successUrl,
        metadata: { reserva_id: opciones.reservaId },
      },
    },
  });
  const firma = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
  const res = await fetch('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': firma },
    body: payload,
  });
  if (res.status !== 200) throw new Error(`Webhook respondió ${res.status}`);
}

export async function estadoDeReserva(id: string) {
  const { data } = await db
    .from('reservas')
    .select('estado, deposito_cents')
    .eq('id', id)
    .single();
  return data;
}

/** Borra reservas y salidas de prueba (las reservas primero por la clave foránea). */
export async function limpiar(opciones: {
  reservaIds?: string[];
  salidaIds?: string[];
}) {
  if (opciones.reservaIds?.length)
    await db.from('reservas').delete().in('id', opciones.reservaIds);
  if (opciones.salidaIds?.length)
    await db.from('salidas').delete().in('id', opciones.salidaIds);
}
