import { fileURLToPath } from 'node:url';
import { defineProject } from 'vitest/config';

// The extension's test config. `cd extension && pnpm test` runs it with the extension's
// own Vitest; the repo root's `pnpm test` also runs it as a project (listed in the
// root `vitest.config.ts` under `test.projects`). Keep both Vitest versions the same.
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
