import { defineConfig, devices } from '@playwright/test';

// Las pruebas leen las mismas variables que la app (Supabase local, Stripe de prueba).
try {
  process.loadEnvFile('.env.local');
} catch {
  // En CI las variables vienen del entorno.
}

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // La base es compartida: las pruebas corren una detrás de otra.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      // iPhone 13 emulado sobre Chromium (no hace falta instalar WebKit).
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // El asistente usa el modelo simulado: sin Groq, sin cuota y sin límites de uso.
    env: { ASISTENTE_MOCK: '1' },
  },
});
