import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

// The extension's test project. It runs from the repo root (`pnpm test` there lists it
// in `test.projects`) with the root's Vitest, so the extension gets no extra
// dependency; `vitest/config` resolves from the root node_modules.
export default defineProject({
  resolve: {
    // Same aliases as extension/tsconfig.json.
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    name: 'extension',
    // chrome.* is faked per test; no browser or DOM needed so far.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
