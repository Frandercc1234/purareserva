import { expect, test } from '@playwright/test';

const casos = [
  { ruta: '/es/no-existe', titulo: 'No encontramos esta página' },
  { ruta: '/en/no-existe', titulo: "We couldn't find this page" },
  {
    ruta: '/es/mar-y-sol-tamarindo/no-existe',
    titulo: 'No encontramos esta página',
  },
  {
    ruta: '/en/mar-y-sol-tamarindo/no-existe',
    titulo: "We couldn't find this page",
  },
];

for (const { ruta, titulo } of casos) {
  test(`${ruta} muestra la 404 propia con estado 404`, async ({ page }) => {
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo);
    // Con la cabecera y el pie públicos, y sin desbordes.
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    const ancho = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(ancho.sw).toBeLessThanOrEqual(ancho.cw);
  });
}

test('una ruta fuera de los idiomas muestra la 404 en español', async ({
  page,
}) => {
  const respuesta = await page.goto('/api/no-existe');
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'No encontramos esta página',
  );
});
