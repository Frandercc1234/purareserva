import { expect, test } from '@playwright/test';
import { DIA_MS, crearReserva, crearSalida, irA, limpiar } from './helpers';

// next-intl muestra la clave ("Tour.elegirSalida") cuando falta una traducción.
const CLAVE_SIN_TRADUCIR =
  /\b(Comun|Landing|Negocio|Tour|Reserva|ReservaPagina|Gracias|Cancelado)\.[A-Za-z_]+/;

const RUTAS = (token: string) => [
  '/{l}',
  '/{l}/aventuras-rincon',
  '/{l}/aventuras-rincon/canopy-rincon',
  '/{l}/reserva/cancelado',
  `/{l}/reserva/gracias?t=${token}`,
  `/{l}/reserva/${token}`,
];

for (const idioma of ['en', 'es'] as const) {
  test(`las rutas /${idioma} no muestran claves sin traducir`, async ({
    page,
  }) => {
    const salidaId = await crearSalida({ enMs: 3 * DIA_MS });
    const r = await crearReserva({ salidaId, idioma });
    try {
      for (const plantilla of RUTAS(r.token)) {
        const ruta = plantilla.replace('{l}', idioma);
        await irA(page, ruta);
        await expect(page.locator('html')).toHaveAttribute('lang', idioma);
        const texto = await page.locator('body').innerText();
        expect(texto, `claves sin traducir en ${ruta}`).not.toMatch(
          CLAVE_SIN_TRADUCIR,
        );
        if (idioma === 'en') {
          // Ningún texto de la interfaz queda en español en las rutas en inglés.
          for (const es of [
            'Elegí tu salida',
            'Reservá',
            'Cancelar reserva',
            'Consultar por WhatsApp',
          ]) {
            expect(texto, `"${es}" en ${ruta}`).not.toContain(es);
          }
        }
      }
    } finally {
      await limpiar({ reservaIds: [r.id], salidaIds: [salidaId] });
    }
  });
}

test('el selector de idioma conserva la ruta', async ({ page }) => {
  await irA(page, '/es/aventuras-rincon/canopy-rincon');
  // Hay un selector en la cabecera y otro en el pie: se usa el de la cabecera.
  await page.getByRole('banner').getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/en\/aventuras-rincon\/canopy-rincon$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Rincón Canopy',
  );
});
