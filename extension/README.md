# Pocket — Chrome Extension

MV3 Chrome extension that saves the active tab to your Pocket account.

## Stack
- Manifest V3 · Vite · @crxjs/vite-plugin
- React 19 + TypeScript
- Tailwind v4 (matches the web app)
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

## Features (v1)
- Click icon → popup with current tab URL/title, tag input, **Save to Pocket**
- Right-click page → **Save page to Pocket**
- Right-click link → **Save link to Pocket**
- Keyboard shortcut: `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` — saves current tab silently with a badge flash
- Unauthenticated state shows a sign-in / register gate

## Follow-ups
- Show "already saved" badge on visited pages
- Options page (default tags, custom shortcut)
- Personal access tokens (avoid cookie dependency)
