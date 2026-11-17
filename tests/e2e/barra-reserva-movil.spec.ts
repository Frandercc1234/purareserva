import { expect, test, type Page } from '@playwright/test';
import { DIA_MS, crearSalida, db, irA, limpiar, unico } from './helpers';

const URL_TOUR = '/es/aventuras-rincon/canopy-rincon';

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.setViewportSize({ width: 375, height: 812 });
});

const barra = (page: Page) => page.locator('#barra-reserva');

test('sin salida elegida la barra de pago no se ve ni se puede enfocar', async ({
  page,
}) => {
  await irA(page, URL_TOUR);
  await expect(barra(page)).toHaveAttribute('inert', '');
  await expect(barra(page)).toHaveAttribute('aria-hidden', 'true');
  await expect(barra(page)).not.toBeInViewport();
  await expect(page.getByRole('button', { name: 'Pagar' })).toHaveCount(0);
});

test('al elegir un día con cupo la barra aparece y Pagar depósito lleva a Stripe', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: 3 * DIA_MS, cupo: 5 });
  const email = `${unico('barra')}@example.com`;
  try {
    await irA(page, URL_TOUR);
    await expect(barra(page)).not.toBeInViewport();

    await page
      .locator('#selector-salida label:has(input[type="radio"])')
      .first()
      .click();
    await expect(barra(page)).not.toHaveAttribute('inert');
    await expect(barra(page)).toBeInViewport();

    await page.getByLabel('Nombre completo').fill('Ana Mora');
    await page.getByLabel('Correo electrónico').fill(email);
    await page
      .getByLabel('Teléfono (con código de país)')
      .fill('+506 8888 7777');
    await barra(page).getByRole('button', { name: /Pagar/ }).click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45_000 });
  } finally {
    const { data } = await db.from('reservas').select('id').eq('email', email);
    await limpiar({
      reservaIds: data?.map((r) => r.id),
      salidaIds: [salidaId],
    });
  }
});

test('con ?salida= válido y personas la barra se ve al cargar', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: 3 * DIA_MS, cupo: 5 });
  try {
    await irA(page, `${URL_TOUR}?salida=${salidaId}&personas=2`);
    await expect(barra(page)).not.toHaveAttribute('inert');
    await expect(barra(page)).toBeInViewport();
    await expect(
      barra(page).getByRole('button', { name: /Pagar/ }),
    ).toBeVisible();
  } finally {
    await limpiar({ salidaIds: [salidaId] });
  }
});
