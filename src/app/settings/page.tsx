import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiKeysPanel } from '@/components/settings/api-keys-panel';
import { ShortcutSteps } from '@/components/settings/shortcut-steps';
import { env } from '@/lib/env';
import { API_KEY_HEADER } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Settings · Pocket',
};

export default async function SettingsPage() {
  // Render per request so the endpoint uses the runtime BETTER_AUTH_URL, not the
  // value present at build time (the page would otherwise be prerendered).
  await connection();
  const endpoint = new URL('/api/bookmarks', env.BETTER_AUTH_URL).toString();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/saves"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to saves
      </Link>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Settings</h1>

      <section aria-labelledby="api-keys-heading" className="mb-10">
        <h2 id="api-keys-heading" className="text-lg font-semibold text-gray-900">
          API keys
        </h2>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          Let apps that can't sign in, like Apple Shortcuts, save to your account. Treat a key like
          a password and revoke any you no longer use.
        </p>
        <ApiKeysPanel shortcutUrl={env.IOS_SHORTCUT_URL} />
      </section>

      <section aria-labelledby="shortcut-heading">
        <h2 id="shortcut-heading" className="text-lg font-semibold text-gray-900">
          Save from Safari on iPhone
        </h2>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          Build this shortcut once, then save any page from Safari's Share button.
        </p>
        <ShortcutSteps endpoint={endpoint} header={API_KEY_HEADER} />
      </section>
    </main>
  );
}
