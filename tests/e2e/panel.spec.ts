import { expect, test } from '@playwright/test';
import { slugify } from '../../src/lib/slug';
import { DIA_MS, DUENO1, db, irA, iniciarSesion, unico } from './helpers';

/** "YYYY-MM-DD" de un instante (en UTC, igual que el generador de lotes). */
const dia = (ms: number) => new Date(ms).toISOString().slice(0, 10);

test('el dueño crea un tour, programa salidas en lote y las ve en la página pública', async ({
  page,
}) => {
  const nombre = `E2E Tour ${unico('t')}`;
  const slug = slugify(nombre, 60);

  // Una semana completa desde pasado mañana: 6 salidas (lunes a sábado).
  const desde = dia(Date.now() + 2 * DIA_MS);
  const hasta = dia(Date.now() + 8 * DIA_MS);
  let esperadas = 0;
  for (let t = Date.parse(desde); t <= Date.parse(hasta); t += DIA_MS) {
    if (new Date(t).getUTCDay() !== 0) esperadas++;
  }
  expect(esperadas).toBe(6);

  try {
    await iniciarSesion(page, DUENO1);

    // Crear el tour con textos en ambos idiomas.
    await irA(page, '/panel/tours/nuevo');
    await page.getByLabel('Nombre (español)').fill(nombre);
    await page.getByRole('tab', { name: 'English' }).click();
    await page.getByLabel('Name (English)').fill(`${nombre} EN`);
    await page.getByLabel('Precio por persona (USD)').fill('25');
    await page.getByLabel('Duración (minutos)').fill('90');
    await page.getByLabel('Cupo por defecto').fill('8');
    await page.getByRole('button', { name: 'Guardar tour' }).click();
    await page.waitForURL('**/panel/tours');
    const fila = page.getByRole('row').filter({ hasText: nombre });
    await expect(fila).toBeVisible();
    await expect(fila).toContainText('$25.00');

    // Crear salidas en lote.
    await fila.getByRole('link', { name: 'Salidas' }).click();
    await page.waitForLoadState('networkidle');
    const lote = page.locator('form').filter({
      has: page.getByRole('heading', { name: 'Varias salidas (lote)' }),
    });
    await lote.getByLabel('Desde').fill(desde);
    await lote.getByLabel('Hasta').fill(hasta);
    await lote.getByLabel('Hora').fill('09:30');
    await expect(
      lote.getByText(`Se crearán ${esperadas} salidas`),
    ).toBeVisible();
    await lote.getByRole('button', { name: 'Crear salidas' }).click();
    await expect(
      lote.getByText(`Se crearon ${esperadas} salidas`),
    ).toBeVisible();

    // Repetir el lote no duplica.
    await lote.getByRole('button', { name: 'Crear salidas' }).click();
    await expect(lote.getByText(/Se crearon 0 salidas/)).toBeVisible();

    // La página pública muestra el tour con sus salidas.
    await irA(page, `/es/aventuras-rincon/${slug}`);
    await expect(
      page.getByRole('heading', { level: 1, name: nombre }),
    ).toBeVisible();
    // El selector muestra una tira con los primeros 14 días que tienen salidas.
    await expect(page.locator('#selector-salida [aria-pressed]')).toHaveCount(
      Math.min(esperadas, 14),
    );
    await irA(page, `/en/aventuras-rincon/${slug}`);
    await expect(
      page.getByRole('heading', { level: 1, name: `${nombre} EN` }),
    ).toBeVisible();
  } finally {
    const { data: tour } = await db
      .from('tours')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (tour) {
      await db.from('salidas').delete().eq('tour_id', tour.id);
      await db.from('tours').delete().eq('id', tour.id);
    }
  }
});

test('un tour desactivado deja de verse en la página pública', async ({
  page,
}) => {
  const nombre = `E2E Inactivo ${unico('i')}`;
  const slug = slugify(nombre, 60);
  try {
    await iniciarSesion(page, DUENO1);
    await irA(page, '/panel/tours/nuevo');
    await page.getByLabel('Nombre (español)').fill(nombre);
    await page.getByRole('tab', { name: 'English' }).click();
    await page.getByLabel('Name (English)').fill(`${nombre} EN`);
    await page.getByLabel('Precio por persona (USD)').fill('10');
    await page.getByRole('button', { name: 'Guardar tour' }).click();
    await page.waitForURL('**/panel/tours');

    expect((await page.goto(`/es/aventuras-rincon/${slug}`))?.status()).toBe(
      200,
    );

    await irA(page, '/panel/tours');
    await page
      .getByRole('switch', { name: `Desactivar ${nombre}`, exact: true })
      .click();
    await expect(
      page.getByRole('switch', { name: `Activar ${nombre}`, exact: true }),
    ).toBeVisible();

    expect((await page.goto(`/es/aventuras-rincon/${slug}`))?.status()).toBe(
      404,
    );
  } finally {
    await db.from('tours').delete().eq('slug', slug);
  }
});

test('el dueño sube la portada de su negocio y se ve en la landing', async ({
  page,
}) => {
  try {
    await iniciarSesion(page, DUENO1);
    await irA(page, '/panel/configuracion');
    await page
      .getByLabel(/Subir portada/)
      .setInputFiles('public/tours/snorkel.jpg');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Cambios guardados')).toBeVisible();

    const { data } = await db
      .from('negocios')
      .select('portada_url')
      .eq('slug', 'aventuras-rincon')
      .single();
    expect(data?.portada_url).toContain('/portada.jpg');

    await irA(page, '/es');
    await expect(page.locator('main img[alt="Aventuras Rincón"]')).toHaveCount(
      1,
    );
  } finally {
    await db
      .from('negocios')
      .update({ portada_url: null })
      .eq('slug', 'aventuras-rincon');
  }
});
