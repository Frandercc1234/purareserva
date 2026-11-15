import { expect, test } from '@playwright/test';

const TOUR_ES = '/es/mar-y-sol-tamarindo/catamaran-atardecer';

test('un tour tiene título, descripción y Open Graph propios', async ({
  page,
}) => {
  await page.goto(TOUR_ES);
  await expect(page).toHaveTitle(
    'Catamarán al atardecer – Mar y Sol Tamarindo | PuraReserva',
  );
  const og = (propiedad: string) =>
    page.locator(`meta[property="og:${propiedad}"]`).getAttribute('content');
  expect(await og('title')).toBe(
    'Catamarán al atardecer – Mar y Sol Tamarindo',
  );
  expect(await og('description')).toContain('US$85 por persona');
  expect(await og('image')).toMatch(/\/tours\/catamaran\.jpg$/);

  // hreflang entre los dos idiomas.
  await expect(
    page.locator('link[rel="alternate"][hreflang="en"]'),
  ).toHaveAttribute('href', /\/en\/mar-y-sol-tamarindo\/catamaran-atardecer$/);
});

test('en inglés el precio y el título salen en inglés', async ({ page }) => {
  await page.goto('/en/mar-y-sol-tamarindo/snorkel-bahia');
  await expect(page).toHaveTitle(
    'Bay snorkeling – Mar y Sol Tamarindo | PuraReserva',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /^\$55 per person\./,
  );
});

test('la landing tiene su propio título y una imagen para compartir', async ({
  page,
}) => {
  await page.goto('/es');
  await expect(page).toHaveTitle(
    'Tours en Guanacaste con depósito en línea | PuraReserva',
  );
  const imagen = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content');
  const respuesta = await page.request.get(imagen!);
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['content-type']).toContain('image/png');
});

test('la reserva no se indexa y robots.txt la bloquea junto con el panel', async ({
  page,
  request,
}) => {
  await page.goto('/es/reserva/gracias');
  // Toda etiqueta robots de la página (la del layout y la de la 404) pide no indexar.
  const robotsMeta = await page
    .locator('meta[name="robots"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('content') ?? ''));
  expect(robotsMeta.length).toBeGreaterThan(0);
  for (const contenido of robotsMeta) expect(contenido).toContain('noindex');

  const robots = await (await request.get('/robots.txt')).text();
  for (const ruta of ['/panel', '/api', '/reserva', '/es/reserva'])
    expect(robots).toContain(`Disallow: ${ruta}`);
});

test('el sitemap lista la landing, los negocios y los tours en los dos idiomas', async ({
  request,
}) => {
  const respuesta = await request.get('/sitemap.xml');
  expect(respuesta.status()).toBe(200);
  const xml = await respuesta.text();
  for (const ruta of [
    '/es',
    '/en',
    '/es/aventuras-rincon',
    '/en/mar-y-sol-tamarindo',
    '/es/aventuras-rincon/canopy-rincon',
    '/en/mar-y-sol-tamarindo/snorkel-bahia',
  ])
    expect(xml).toMatch(new RegExp(`<loc>[^<]*${ruta}</loc>`));
});
