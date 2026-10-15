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
    include: ['tests/**/*.test.ts'],
  },
});
