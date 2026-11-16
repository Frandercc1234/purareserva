import { expect, test, type Page } from '@playwright/test';
import { DIA_MS, crearSalida, irA, limpiar } from './helpers';

// Corren con ASISTENTE_MOCK=1 (playwright.config.ts): las herramientas leen la base de
// verdad, pero el modelo es simulado, así que no gasta cuota de Groq.

const TOUR = '/es/aventuras-rincon/canopy-rincon';
const NOMBRE_BOTON = { es: 'Preguntale al asistente', en: 'Ask the assistant' };

const boton = (page: Page, idioma: 'es' | 'en' = 'es') =>
  page.getByRole('button', { name: NOMBRE_BOTON[idioma] });
const panel = (page: Page, idioma: 'es' | 'en' = 'es') =>
  page.getByRole('dialog', {
    name: idioma === 'es' ? 'Asistente PuraReserva' : 'PuraReserva assistant',
  });

async function abrir(page: Page, idioma: 'es' | 'en' = 'es') {
  await boton(page, idioma).click();
  await expect(panel(page, idioma)).toBeVisible();
  return panel(page, idioma);
}

async function preguntar(page: Page, texto: string) {
  const entrada = panel(page).getByRole('textbox');
  await entrada.fill(texto);
  await entrada.press('Enter');
}

test('abre el asistente, envía una sugerencia y muestra la tarjeta de un tour', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: DIA_MS, cupo: 5 });
  try {
    await irA(page, '/es');
    const dialogo = await abrir(page);
    // Con el foco en la entrada de texto, y las 3 sugerencias generales.
    await expect(dialogo.getByRole('textbox')).toBeFocused();
    await expect(
      dialogo.getByRole('button', { name: /playas hay cerca/ }),
    ).toBeVisible();

    await dialogo
      .getByRole('button', { name: 'Tours para mañana para 2 personas' })
      .click();

    // La tarjeta trae la foto, el precio, la próxima salida y los dos botones.
    const tarjeta = dialogo.locator('article').first();
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByRole('heading')).not.toBeEmpty();
    await expect(tarjeta.locator('img')).toHaveAttribute('alt', /.+/);
    await expect(tarjeta.getByText(/US\$\d+/)).toBeVisible();
    await expect(tarjeta.getByText(/Próxima salida/)).toBeVisible();
    await expect(tarjeta.getByRole('link', { name: 'Ver' })).toBeVisible();
    await expect(
      tarjeta.getByRole('button', { name: 'Reservar' }),
    ).toBeVisible();
    // El texto de respuesta llega después de las tarjetas.
    await expect(dialogo.getByText(/Encontré \d+ opci/)).toBeVisible();
  } finally {
    await limpiar({ salidaIds: [salidaId] });
  }
});

test('"Reservar" en la tarjeta lleva al formulario con la salida y las personas cargadas', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: DIA_MS, cupo: 5 });
  try {
    await irA(page, '/es/aventuras-rincon');
    const dialogo = await abrir(page);
    await preguntar(page, 'Tours para mañana para 2 personas');
    const tarjeta = dialogo
      .locator('article')
      .filter({ hasText: 'Canopy en el Rincón' });
    await tarjeta.getByRole('button', { name: 'Reservar' }).click();

    await page.waitForURL(
      /\/es\/aventuras-rincon\/canopy-rincon\?salida=.+&personas=2/,
    );
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('input[name="salida_id"]:checked')).toHaveCount(
      1,
    );
    await expect(page.getByLabel('Personas')).toHaveValue('2');
  } finally {
    await limpiar({ salidaIds: [salidaId] });
  }
});

test('"Reservar" estando ya en la página del tour reinicia el formulario con la salida elegida', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: DIA_MS, cupo: 5 });
  try {
    await irA(page, TOUR);
    await abrir(page);
    await preguntar(page, 'Tours para mañana para 3 personas');
    await panel(page)
      .locator('article')
      .filter({ hasText: 'Canopy en el Rincón' })
      .getByRole('button', { name: 'Reservar' })
      .click();
    await page.waitForURL(/personas=3/);
    await expect(page.locator('input[name="salida_id"]:checked')).toHaveCount(
      1,
    );
    await expect(page.getByLabel('Personas')).toHaveValue('3');
  } finally {
    await limpiar({ salidaIds: [salidaId] });
  }
});

test('Esc cierra el panel y devuelve el foco al botón', async ({
  page,
}, info) => {
  test.skip(
    info.project.name === 'mobile',
    'En móvil el botón queda oculto con el panel abierto',
  );
  await irA(page, '/es');
  await abrir(page);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeHidden();
  await expect(boton(page)).toBeFocused();
});

test('el asistente tiene roles y etiquetas accesibles', async ({ page }) => {
  await irA(page, '/en');
  await expect(boton(page, 'en')).toHaveAttribute(
    'aria-label',
    'Ask the assistant',
  );
  const dialogo = await abrir(page, 'en');
  await expect(dialogo.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  await expect(dialogo.getByText(/AI-generated answers/)).toBeVisible();
  await expect(
    dialogo.getByRole('button', { name: 'Close the assistant' }),
  ).toBeVisible();
});

test('las sugerencias cambian según la página, también en inglés', async ({
  page,
}) => {
  await irA(page, TOUR);
  let dialogo = await abrir(page);
  for (const s of [
    '¿Hay cupo el sábado?',
    '¿Qué incluye este tour?',
    '¿Cómo llego al punto de encuentro?',
  ])
    await expect(dialogo.getByRole('button', { name: s })).toBeVisible();

  await irA(page, '/en/aventuras-rincon/canopy-rincon');
  dialogo = await abrir(page, 'en');
  for (const s of [
    'Are there spots on Saturday?',
    'What does this tour include?',
    'How do I get to the meeting point?',
  ])
    await expect(dialogo.getByRole('button', { name: s })).toBeVisible();
});

test('la conversación se conserva al cambiar de página', async ({ page }) => {
  await irA(page, '/es');
  await abrir(page);
  await preguntar(page, 'Solo una prueba');
  await expect(panel(page).getByText('Solo una prueba')).toBeVisible();
  await expect(
    panel(page).getByText(/Solo puedo ayudarte con turismo/),
  ).toBeVisible();

  await irA(page, '/es/aventuras-rincon');
  await abrir(page);
  await expect(panel(page).getByText('Solo una prueba')).toBeVisible();
});

test('en escritorio el botón es una pastilla con texto y el panel mide 380 x 560', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'mobile');
  await irA(page, '/es');
  await expect(boton(page)).toContainText('Preguntale al asistente');
  const dialogo = await abrir(page);
  const caja = await dialogo.boundingBox();
  expect(Math.round(caja!.width)).toBe(380);
  expect(Math.round(caja!.height)).toBe(560);
});

test('en móvil el botón es redondo, no tapa la barra de reserva y el panel va a pantalla completa', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await irA(page, TOUR);

  const fab = boton(page);
  const cajaFab = (await fab.boundingBox())!;
  expect(Math.round(cajaFab.width)).toBe(56);
  expect(Math.round(cajaFab.height)).toBe(56);
  // Solo ícono: la etiqueta de texto no se ve (el nombre accesible sale del aria-label).
  await expect(fab.locator('span')).toBeHidden();
  const barra = (await page.locator('#barra-reserva').boundingBox())!;
  expect(cajaFab.y + cajaFab.height).toBeLessThanOrEqual(barra.y);

  const dialogo = await abrir(page);
  await expect(dialogo).toHaveAttribute('aria-modal', 'true');
  const vista = page.viewportSize()!;
  const caja = (await dialogo.boundingBox())!;
  expect(Math.round(caja.width)).toBe(vista.width);
  expect(Math.round(caja.height)).toBe(vista.height);
  await expect(fab).toBeHidden();
});

test('si se llega al límite se ofrece "Ver tours" y el WhatsApp solo con un negocio en contexto', async ({
  page,
}) => {
  await page.route('**/api/asistente', (ruta) =>
    ruta.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'LIMITE', whatsapp: '+50688887777' }),
    }),
  );

  // Con negocio en contexto: "Ver tours" y WhatsApp.
  await irA(page, '/es/aventuras-rincon');
  let dialogo = await abrir(page);
  await preguntar(page, 'hola');
  await expect(dialogo.getByRole('alert')).toContainText(
    'límite de mensajes por hoy',
  );
  await expect(dialogo.getByRole('link', { name: 'Ver tours' })).toBeVisible();
  await expect(
    dialogo.getByRole('link', { name: 'Consultar por WhatsApp' }),
  ).toHaveAttribute('href', /wa\.me\/50688887777/);
  await expect(dialogo.getByRole('textbox')).toBeDisabled();

  // Sin contexto: solo "Ver tours" (la respuesta del servidor no trae WhatsApp).
  await page.route('**/api/asistente', (ruta) =>
    ruta.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'LIMITE', whatsapp: null }),
    }),
  );
  await page.evaluate(() => sessionStorage.clear());
  await irA(page, '/es');
  dialogo = await abrir(page);
  await preguntar(page, 'hola');
  await expect(dialogo.getByRole('alert')).toContainText(
    'Podés seguir viendo los tours.',
  );
  await expect(dialogo.getByRole('link', { name: 'Ver tours' })).toBeVisible();
  await expect(dialogo.getByRole('link', { name: /WhatsApp/ })).toHaveCount(0);
});

test('si el asistente no está disponible se muestra el aviso y se puede reintentar', async ({
  page,
}) => {
  let falla = true;
  await page.route('**/api/asistente', (ruta) =>
    falla
      ? ruta.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'NO_DISPONIBLE' }),
        })
      : ruta.continue(),
  );
  await irA(page, '/es');
  const dialogo = await abrir(page);
  await preguntar(page, 'Solo una prueba');
  await expect(dialogo.getByRole('alert')).toContainText(
    'El asistente no está disponible ahora',
  );

  falla = false;
  await dialogo.getByRole('button', { name: 'Reintentar' }).click();
  await expect(
    dialogo.getByText(/Solo puedo ayudarte con turismo/),
  ).toBeVisible();
  await expect(dialogo.getByRole('alert')).toHaveCount(0);
});

test('si el modelo falla después de dejar lista la reserva, queda el botón y no el aviso rojo', async ({
  page,
}) => {
  const salidaId = await crearSalida({ enMs: DIA_MS, cupo: 5 });
  try {
    await irA(page, '/es/aventuras-rincon');
    const dialogo = await abrir(page);
    await preguntar(page, 'Tours para mañana para 2 personas');
    await expect(dialogo.locator('article').first()).toBeVisible();
    await expect(dialogo.getByText(/Encontré \d+ opci/)).toBeVisible();

    // preparar_reserva responde bien y el último paso del modelo falla (429).
    await preguntar(page, 'Quiero reservar para 2 personas simular-fallo');
    await expect(
      dialogo.getByRole('link', { name: 'Completar reserva' }),
    ).toBeVisible();
    await expect(
      dialogo.getByText('El asistente no pudo terminar la respuesta.'),
    ).toBeVisible();
    await expect(dialogo.getByRole('alert')).toHaveCount(0);
    await expect(dialogo.getByRole('button', { name: 'Reintentar' })).toHaveCount(
      0,
    );
  } finally {
    await limpiar({ salidaIds: [salidaId] });
  }
});

test('la API valida la entrada: mensaje de más de 500 caracteres, idioma inválido y cuerpo vacío', async ({
  request,
}) => {
  const mensaje = (texto: string) => ({
    id: '1',
    role: 'user',
    parts: [{ type: 'text', text: texto }],
  });
  const largo = await request.post('/api/asistente', {
    data: { locale: 'es', messages: [mensaje('a'.repeat(501))] },
  });
  expect(largo.status()).toBe(400);
  expect(await largo.json()).toEqual({ error: 'VALIDACION' });

  const idioma = await request.post('/api/asistente', {
    data: { locale: 'fr', messages: [mensaje('hola')] },
  });
  expect(idioma.status()).toBe(400);
  const vacio = await request.post('/api/asistente', { data: {} });
  expect(vacio.status()).toBe(400);
});

test('la API responde en streaming', async ({ request }) => {
  const respuesta = await request.post('/api/asistente', {
    data: {
      locale: 'en',
      messages: [
        {
          id: '1',
          role: 'user',
          parts: [{ type: 'text', text: 'hello there' }],
        },
      ],
    },
  });
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['content-type']).toContain('text/event-stream');
  expect(await respuesta.text()).toContain(
    'I can only help with tourism in Guanacaste',
  );
});
