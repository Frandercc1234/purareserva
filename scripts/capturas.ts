/**
 * Capturas para el README. Uso: npx tsx scripts/capturas.ts [url-base]
 * Por defecto usa la demo en producción.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'https://purareserva.vercel.app';
const salida = 'docs/capturas';
mkdirSync(salida, { recursive: true });

async function main() {
  const navegador = await chromium.launch();

  async function pagina(ancho: number, alto: number) {
    const ctx = await navegador.newContext({
      viewport: { width: ancho, height: alto },
      deviceScaleFactor: 1,
    });
    return ctx.newPage();
  }

  async function captura(
    p: Awaited<ReturnType<typeof pagina>>,
    ruta: string,
    archivo: string,
  ) {
    await p.goto(`${base}${ruta}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${salida}/${archivo}.png` });
  }

  const escritorio = await pagina(1280, 800);
  await captura(escritorio, '/es', 'landing');
  await captura(escritorio, '/es/aventuras-rincon/canopy-rincon', 'tour');

  const movil = await pagina(375, 812);
  await captura(movil, '/es', 'landing-movil');
  await captura(movil, '/es/aventuras-rincon/canopy-rincon', 'tour-movil');

  await escritorio.goto(`${base}/login`);
  await escritorio.getByLabel('Correo').fill('dueno1@test.com');
  await escritorio.getByLabel('Contraseña').fill('Prueba123!');
  await escritorio.getByRole('button', { name: 'Entrar' }).click();
  await escritorio.waitForURL('**/panel');
  await escritorio.waitForLoadState('networkidle');
  await escritorio.waitForTimeout(900);
  await escritorio.screenshot({ path: `${salida}/panel.png` });

  await navegador.close();
  console.log(`Capturas en ${salida}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
