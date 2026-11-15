import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], passWithNoTests: true },
  // Las pruebas unitarias no procesan CSS: se evita cargar el postcss de Tailwind.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'tests/unit/stub-server-only.ts'),
    },
  },
});
