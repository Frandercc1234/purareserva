import { expect, test } from '@playwright/test';
import {
  DIA_MS,
  HORA_MS,
  cobroDePrueba,
  crearReserva,
  crearSalida,
  estadoDeReserva,
  irA,
  limpiar,
  stripe,
  unico,
} from './helpers';

// El negocio 1 del seed permite cancelar con reembolso hasta 24 horas antes.

test('cancelar antes del límite reembolsa el depósito', async ({ page }) => {
  const salidaId = await crearSalida({ enMs: 3 * DIA_MS });
  const pi = await cobroDePrueba(3900);
  const email = `delivered+${unico('cancel')}@resend.dev`;
  const r = await crearReserva({ salidaId, email, paymentIntent: pi });

  try {
    await irA(page, `/es/reserva/${r.token}`);
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Cancelar reserva' }).click();
    // El diálogo avisa que habrá reembolso.
    await expect(page.getByRole('dialog')).toContainText(
      'te reembolsamos el depósito',
    );
    await page.getByRole('button', { name: 'Sí, cancelar' }).click();

    await expect(page.getByText('Reembolsada', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('el depósito se reembolsó')).toBeVisible();
    expect((await estadoDeReserva(r.id))?.estado).toBe('reembolsada');

    const reembolsos = await stripe.refunds.list({ payment_intent: pi });
    expect(reembolsos.data).toHaveLength(1);
    expect(reembolsos.data[0]).toMatchObject({
      amount: 3900,
      status: 'succeeded',
    });
  } finally {
    await limpiar({ reservaIds: [r.id], salidaIds: [salidaId] });
  }
});

test('cancelar fuera del plazo no reembolsa', async ({ page }) => {
  const salidaId = await crearSalida({ enMs: 10 * HORA_MS });
  const pi = await cobroDePrueba(3900);
  const email = `delivered+${unico('tarde')}@resend.dev`;
  const r = await crearReserva({
    salidaId,
    email,
    idioma: 'en',
    paymentIntent: pi,
  });

  try {
    await irA(page, `/en/reserva/${r.token}`);
    await page.getByRole('button', { name: 'Cancel booking' }).click();
    // El diálogo avisa que NO habrá reembolso.
    await expect(page.getByRole('dialog')).toContainText('is not refunded');
    await page.getByRole('button', { name: 'Yes, cancel' }).click();

    await expect(page.getByText('Cancelled', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    expect((await estadoDeReserva(r.id))?.estado).toBe('cancelada');

    const reembolsos = await stripe.refunds.list({ payment_intent: pi });
    expect(reembolsos.data).toHaveLength(0);
  } finally {
    await limpiar({ reservaIds: [r.id], salidaIds: [salidaId] });
  }
});

test('un enlace de reserva falso da 404 con el mensaje', async ({ page }) => {
  const respuesta = await page.goto('/es/reserva/token-que-no-existe');
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByText('Reserva no encontrada')).toBeVisible();
});
