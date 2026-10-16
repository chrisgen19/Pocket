import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Same aliases as tsconfig.json.
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Pure functions only so far; switch per file with `// @vitest-environment happy-dom`
    // (and add the package) once component tests need a DOM.
    environment: 'node',
    projects: [
      { extends: true, test: { name: 'web', include: ['tests/**/*.test.ts'] } },
      // Its own aliases (`@/` is extension/src there), so it can't share this config.
      'extension/vitest.config.ts',
    ],
  },
});
