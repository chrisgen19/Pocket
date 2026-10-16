# Pocket — Chrome Extension

MV3 Chrome extension that saves the active tab to your Pocket account.

## Stack
- Manifest V3 · Vite · @crxjs/vite-plugin
- React 19 + TypeScript
- Tailwind v4 (matches the web app), on the shared design tokens in `../shared/tokens.css`
- Hanken Grotesk and Newsreader self-hosted in `public/fonts/` (OFL)
- Zod (validation, mirrors `src/features/saves/schemas.ts`)

## Auth
Cookie-based session reused from the web app. The popup calls `GET /api/auth/get-session`; if no session, it shows a **Sign in** / **Create account** gate that opens the web app's `/login` or `/register`.

For this to work the web app needs:
- CORS allowlist gated on `EXTENSION_IDS` for `/api/*` (see `src/proxy.ts`) — only origins matching `chrome-extension://${id}` for IDs in `EXTENSION_IDS` get credentialed CORS headers
- The same extension IDs added to Better Auth `trustedOrigins` (see `src/lib/auth.ts`)

## Setup (once)

```bash
cd extension
pnpm install
cp .env.example .env        # set VITE_API_BASE_URL to your API origin
```

`.env` is gitignored. Both `pnpm dev` and `pnpm build` read `VITE_API_BASE_URL` from it — typically `http://localhost:3000` for local dev or `https://pocket.cgdev.site` for prod.

## Develop (hot reload while editing)

```bash
pnpm dev        # Vite watches ./src and rebuilds ./dist on every save
```

Then in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/dist`

The popup will show a CRXJS placeholder when Vite isn't running — that's expected.

After the first load, copy the extension ID from `chrome://extensions` into your **web app** `.env.local`:

```
EXTENSION_IDS=abcdefghijklmnopabcdefghijklmnop
```

Restart the web app's `pnpm dev` so Better Auth and the CORS proxy pick up the ID.

## Build (use the extension without Vite running)

```bash
pnpm build      # produces a static ./dist, no dev-server dependency
```

Reload the extension in `chrome://extensions` (↻ on the card) after each rebuild. Run `pnpm build` again any time you change extension source.

## Tests

Run from the **repo root**: `pnpm test` runs the web app's and the extension's tests, `pnpm exec vitest run --project extension` only these. They use the root's Vitest, so this folder needs no extra dependency; `vitest.config.ts` here is the extension's project config (aliases match `tsconfig.json`). Tests live in `tests/` and fake the `chrome.*` APIs they touch.

## Features (v1)
- Click icon → popup with current tab URL/title, tag input, **Save to Pocket**
- Right-click page → **Save page to Pocket**
- Right-click link → **Save link to Pocket**
- Keyboard shortcut: `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` — saves current tab silently with a badge flash
- Unauthenticated state shows a sign-in / register gate
- Saved pages show the red Pocket icon (tooltip "Saved to Pocket"), other pages a gray outline. The popup on a saved page says when it was saved, shows its tags and offers **Update**

## Saved indicator
- Needs the `tabs` permission (Chrome shows "Read your browsing history" at install) to read each tab's URL as it navigates. Adding it to a published build disables the extension for existing users until they accept.
- The toolbar check never sends visited URLs to the server: the service worker caches the account's saved URLs (`GET /api/bookmarks/urls`) in `chrome.storage.local` (`unlimitedStorage`, no install warning, so a large account can't hit the 10 MB quota) and matches exactly, the same rule as the server's unique `(userId, url)` key. A failed storage write never fails a save: the worker keeps the list in memory and the next refresh writes it again.
- The cache refreshes on install/startup, every 15 minutes (`chrome.alarms`), on sign-in/out (session cookie change) and after any save from the extension. Opening the popup does send that one tab's URL (`GET /api/bookmarks?url=`) to show its details, and corrects the cache. Signing out clears the cache right away, even when the server is unreachable.

## Follow-ups
- Options page (default tags, custom shortcut)
- Personal access tokens (avoid cookie dependency)
