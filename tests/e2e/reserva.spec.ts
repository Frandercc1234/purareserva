import { expect, test } from '@playwright/test';
import {
  DIA_MS,
  crearSalida,
  db,
  estadoDeReserva,
  irA,
  limpiar,
  simularPagoCompletado,
  stripe,
  unico,
} from './helpers';

const URL_TOUR = '/es/aventuras-rincon/canopy-rincon';

async function reservarHastaStripe(
  page: import('@playwright/test').Page,
  salidaId: string,
  email: string,
) {
  await irA(page, URL_TOUR);
  await page
    .locator('label')
    .filter({ has: page.locator(`input[value="${salidaId}"]`) })
    .click();
  await page.getByLabel('Nombre completo').fill('Ana Mora');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Teléfono (con código de país)').fill('+506 8888 7777');
  await page.getByLabel('Personas').fill('2');
  await page.getByRole('button', { name: /Pagar depósito/ }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 });
}

test('el turista reserva, llega a Stripe Checkout y el pago confirma la reserva', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: 3 * DIA_MS, cupo: 5 });
  const email = `${unico('turista')}@example.com`;
  let reservaId: string | undefined;
  let sesionId: string | null = null;

  try {
    await reservarHastaStripe(page, salidaId, email);

    // La reserva quedó pendiente, con el depósito calculado en la base: 65.00 x 2 x 30 %.
    const { data: reserva } = await db
      .from('reservas')
      .select('id, estado, deposito_cents, total_cents, stripe_session_id')
      .eq('email', email)
      .single();
    expect(reserva).toMatchObject({
      estado: 'pendiente_pago',
      total_cents: 13000,
      deposito_cents: 3900,
    });
    reservaId = reserva!.id;
    sesionId = reserva!.stripe_session_id;
    expect(sesionId).toMatch(/^cs_test_/);

    // La sesión de Stripe cobra exactamente el depósito.
    const sesion = await stripe.checkout.sessions.retrieve(sesionId!);
    expect(sesion.amount_total).toBe(3900);
    expect(sesion.currency).toBe('usd');

    // El pago se completa: se simula el aviso firmado de Stripe (en local y en CI).
    await simularPagoCompletado({
      sesionId: sesionId!,
      reservaId: reservaId!,
      successUrl: sesion.success_url!,
    });
    expect((await estadoDeReserva(reservaId!))?.estado).toBe('confirmada');

    // La página de gracias lo muestra confirmado.
    await irA(
      page,
      new URL(sesion.success_url!).pathname +
        new URL(sesion.success_url!).search,
    );
    await expect(page.getByText('¡Tu reserva está confirmada!')).toBeVisible();
    await page.getByRole('link', { name: 'Ver mi reserva' }).click();
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible();
  } finally {
    if (sesionId)
      await stripe.checkout.sessions.expire(sesionId).catch(() => {});
    await limpiar({
      reservaIds: reservaId ? [reservaId] : [],
      salidaIds: [salidaId],
    });
  }
});

test('pedir más personas que cupos muestra el error y no crea la reserva', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: 4 * DIA_MS, cupo: 1 });
  const email = `${unico('sincupo')}@example.com`;
  try {
    await irA(page, URL_TOUR);
    await page
      .locator('label')
      .filter({ has: page.locator(`input[value="${salidaId}"]`) })
      .click();
    await page.getByLabel('Nombre completo').fill('Sin Cupo');
    await page.getByLabel('Correo electrónico').fill(email);
    await page
      .getByLabel('Teléfono (con código de país)')
      .fill('+506 8888 7777');
    await page.getByLabel('Personas').fill('3');
    await page.getByRole('button', { name: /Pagar depósito/ }).click();
    await expect(
      page.getByText('Ya no quedan suficientes cupos en esta salida'),
    ).toBeVisible();
    const { count } = await db
      .from('reservas')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);
    expect(count).toBe(0);
  } finally {
    await limpiar({ salidaIds: [salidaId] });
  }
});

// Pago real con la tarjeta de prueba 4242 en Stripe Checkout. Necesita `stripe listen`
// reenviando a /api/stripe/webhook y se activa con E2E_STRIPE_REAL=1. Los selectores de
// la página de Stripe pueden cambiar con el tiempo.
test('pago real con la tarjeta de prueba 4242', async ({ page }) => {
  test.skip(
    !process.env.E2E_STRIPE_REAL,
    'Se activa con E2E_STRIPE_REAL=1 y stripe listen corriendo',
  );
  test.setTimeout(180_000);
  const salidaId = await crearSalida({ enMs: 5 * DIA_MS, cupo: 5 });
  const email = `${unico('pago')}@example.com`;
  let reservaId: string | undefined;
  try {
    await reservarHastaStripe(page, salidaId, email);
    await page.locator('#cardNumber').fill('4242 4242 4242 4242');
    await page.locator('#cardExpiry').fill('12 / 34');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('Ana Mora');
    await page.getByTestId('hosted-payment-submit-button').click();
    await page.waitForURL(/\/es\/reserva\/gracias/, { timeout: 90_000 });
    await expect(page.getByText('¡Tu reserva está confirmada!')).toBeVisible({
      timeout: 45_000,
    });
    const { data } = await db
      .from('reservas')
      .select('id, estado')
      .eq('email', email)
      .single();
    reservaId = data!.id;
    expect(data!.estado).toBe('confirmada');
  } finally {
    await limpiar({
      reservaIds: reservaId ? [reservaId] : [],
      salidaIds: [salidaId],
    });
  }
});
