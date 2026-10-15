import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Logo } from '@/components/logo';
import { ApiKeysPanel } from '@/components/settings/api-keys-panel';
import { ShortcutSteps } from '@/components/settings/shortcut-steps';
import { env } from '@/lib/env';
import { API_KEY_HEADER } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Settings · Pocket',
};

const SECTION = 'mb-6 rounded-xl border bg-card p-5 sm:p-6';

export default async function SettingsPage() {
  // Render per request so the endpoint uses the runtime BETTER_AUTH_URL, not the
  // value present at build time (the page would otherwise be prerendered).
  await connection();
  const endpoint = new URL('/api/bookmarks', env.BETTER_AUTH_URL).toString();

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/saves" aria-label="Pocket home" className="rounded-md">
            <Logo />
          </Link>
          <Link
            href="/saves"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to saves
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 md:py-10">
        <h1 className="mb-8 font-serif text-[1.75rem] leading-tight font-semibold tracking-[-0.005em]">
          Settings
        </h1>

        <section aria-labelledby="api-keys-heading" className={SECTION}>
          <h2 id="api-keys-heading" className="text-base font-semibold">
            API keys
          </h2>
          <p className="mt-1 mb-5 max-w-prose text-sm text-muted-foreground">
            Let apps that can't sign in, like Apple Shortcuts, save to your account. Treat a key
            like a password and revoke any you no longer use.
          </p>
          <ApiKeysPanel shortcutUrl={env.IOS_SHORTCUT_URL} />
        </section>

        <section aria-labelledby="shortcut-heading" className={SECTION}>
          <h2 id="shortcut-heading" className="text-base font-semibold">
            Save from Safari on iPhone
          </h2>
          <p className="mt-1 mb-5 max-w-prose text-sm text-muted-foreground">
            Build this shortcut once, then save any page from Safari's Share button.
          </p>
          <ShortcutSteps endpoint={endpoint} header={API_KEY_HEADER} />
        </section>
      </main>
    </>
  );
}
