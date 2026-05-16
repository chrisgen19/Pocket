import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

const apiOrigin = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const apiHostPattern = `${new URL(apiOrigin).origin}/*`;

export default defineManifest({
  manifest_version: 3,
  name: 'Pocket',
  description: 'Save the current tab to your Pocket account.',
  version: pkg.version,
  action: {
    default_title: 'Save to Pocket',
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['activeTab', 'contextMenus', 'storage', 'cookies'],
  host_permissions: [apiHostPattern],
  commands: {
    'save-current-tab': {
      suggested_key: {
        default: 'Ctrl+Shift+S',
        mac: 'Command+Shift+S',
      },
      description: 'Save the current tab to Pocket',
    },
  },
});
