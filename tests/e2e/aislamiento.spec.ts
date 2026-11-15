import { expect, test } from '@playwright/test';
import {
  DIA_MS,
  DUENO1,
  DUENO2,
  TOUR_CANOPY,
  anon,
  crearReserva,
  crearSalida,
  iniciarSesion,
  irA,
  limpiar,
  unico,
} from './helpers';

test('sin sesión, el panel redirige al login', async ({ page }) => {
  await page.goto('/panel/tours');
  await expect(page).toHaveURL(/\/login$/);
});

test('el dueño 2 no puede abrir los tours ni las salidas del dueño 1', async ({
  page,
}) => {
  await iniciarSesion(page, DUENO2);
  const tour = await page.goto(`/panel/tours/${TOUR_CANOPY}`);
  expect(tour?.status()).toBe(404);
  const salidas = await page.goto(`/panel/tours/${TOUR_CANOPY}/salidas`);
  expect(salidas?.status()).toBe(404);
});

test('el dueño 2 no ve las reservas del dueño 1, pero el dueño 1 sí', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: 3 * DIA_MS });
  const nombre = `Cliente ${unico('aisl')}`;
  const r = await crearReserva({ salidaId, nombre });
  try {
    await iniciarSesion(page, DUENO2);
    await irA(page, '/panel/reservas');
    await expect(
      page.getByRole('heading', { name: 'Reservas', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(nombre)).toHaveCount(0);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.waitForURL('**/login');
    await iniciarSesion(page, DUENO1);
    await irA(page, '/panel/reservas');
    // En móvil la lista son tarjetas y la tabla está oculta: se mira la versión visible.
    await expect(
      page.getByText(nombre).filter({ visible: true }).first(),
    ).toBeVisible();
  } finally {
    await limpiar({ reservaIds: [r.id], salidaIds: [salidaId] });
  }
});

test('un cliente anónimo no lee reservas ni llama funciones del servidor', async () => {
  const salidaId = await crearSalida({ enMs: 3 * DIA_MS });
  const r = await crearReserva({ salidaId });
  try {
    const reservas = await anon.from('reservas').select('id');
    expect(reservas.data ?? []).toHaveLength(0);
    const eventos = await anon.from('eventos_stripe').select('id');
    expect(eventos.data ?? []).toHaveLength(0);

    const crear = await anon.rpc('crear_reserva', {
      p_salida_id: salidaId,
      p_nombre: 'Anon',
      p_email: 'anon@example.com',
      p_telefono: '88887777',
      p_personas: 1,
      p_idioma: 'es',
      p_token_hash: 'x',
    });
    expect(crear.error?.code).toBe('42501');

    const confirmar = await anon.rpc('confirmar_reserva_pago', {
      p_reserva_id: r.id,
      p_payment_intent: 'pi_x',
    });
    expect(confirmar.error?.code).toBe('42501');

    // Tampoco puede escribir sobre negocios o tours.
    const edicion = await anon
      .from('tours')
      .update({ nombre_es: 'HACK' })
      .eq('id', TOUR_CANOPY)
      .select('id');
    expect(edicion.data ?? []).toHaveLength(0);
  } finally {
    await limpiar({ reservaIds: [r.id], salidaIds: [salidaId] });
  }
});
