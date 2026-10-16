# Pocket — Project Instructions

## Stack

- **Framework:** Next.js (App Router, React Server Components)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config.*`)
- **UI Library:** [shadcn/ui](https://ui.shadcn.com) — components copied into `src/components/ui/`
- **Component primitives:** Base UI (`@base-ui/react`) — shadcn's `base` preset
- **Icons:** `lucide-react`
- **Utilities:** `clsx`, `tailwind-merge` (via `cn()` in `src/lib/utils.ts`), `class-variance-authority`
- **Lint/format:** Biome (`biome.json`). `pnpm lint` runs `biome check .` (lint, formatting and import order); `pnpm check` applies the safe fixes
- **Package manager:** `pnpm` (required — do not use npm/yarn)
- **Runtime:** Node 20+

> Installed Next.js is **16.x** (latest at scaffold time). If a strict Next.js 15 baseline is required, downgrade `next` and `eslint-config-next` before adding feature code.

## Folder Structure

```
pocket/
├── src/
│   ├── app/                  # App Router routes, layouts, pages, route handlers
│   │   ├── layout.tsx        # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx          # Home route
│   │   └── globals.css       # Tailwind v4 imports + theme tokens (CSS vars)
│   ├── components/
│   │   └── ui/               # shadcn/ui components (generated — do not hand-edit lightly)
│   └── lib/
│       └── utils.ts          # `cn()` and other shared helpers
├── public/                   # Static assets served at `/`
├── components.json           # shadcn/ui CLI config
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs        # Tailwind v4 PostCSS plugin
├── tsconfig.json             # `@/*` alias → `src/*`
└── CLAUDE.md                 # ← you are here
```

### Conventions

- **Files:** `kebab-case.tsx` (e.g. `user-card.tsx`)
- **Components:** `PascalCase` exports, `function` declarations
- **Hooks / utils:** `camelCase`, arrow functions
- **Constants:** `UPPER_SNAKE_CASE`
- **Import alias:** `@/` → `src/`
- **Server vs Client:** server components by default; add `"use client"` only when needed (state, effects, browser APIs, event handlers)
- **Route handlers:** `src/app/**/route.ts`
- **Co-locate** small route-specific components under the route folder; promote to `src/components/` when reused

## Rules

### Dependencies

- **Ask before adding any new package.** Prefer native APIs or what's already installed.
- Add shadcn components via CLI: `pnpm dlx shadcn@latest add <component>` — never hand-author into `src/components/ui/`.
- Do not introduce a new linter, formatter, or test runner without approval.

### Styling

- Use Tailwind utilities directly in JSX. Avoid `@apply` unless extracting a truly repeated pattern.
- Theme tokens live as CSS variables in `globals.css` (Tailwind v4 style). Extend there, not in a JS config.
- Do not add separate `.css`/`.scss` module files unless Tailwind cannot express the style.

### TypeScript

- `unknown` over `any`. No `// @ts-ignore` without a comment explaining why.
- Named exports for everything except Next.js framework files (`page.tsx`, `layout.tsx`, `route.ts`, etc.) which require default exports.
- Functions ≤ 50 lines, components ≤ 150 lines — split when they grow past that.

### React / Next.js

- Default to Server Components. Push `"use client"` to the leaves.
- Handle **loading**, **error**, and **empty** states for any data-fetching UI (`loading.tsx`, `error.tsx`, or inline).
- No `console.log` in committed code.

### Git

- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, …).
- Branches: `feature/*`, `bugfix/*`, `hotfix/*`. Never commit to `main`.
- Run `pnpm lint` and `pnpm exec tsc --noEmit` before declaring work done.
- CI (`.github/workflows/ci.yml`) runs on every PR: `pnpm lint`, `tsc`, `pnpm test`, then the extension's `pnpm typecheck` and `pnpm test`. It needs no secrets or database (`prisma generate` runs without `DATABASE_URL`). pnpm is pinned there (no `packageManager` field); bump it with the local pnpm.

## Scripts

```bash
pnpm dev                              # start dev server
pnpm build                            # production build
pnpm start                            # serve production build
pnpm lint                             # biome check: lint + format + import order (read-only)
pnpm check                            # same checks, applying safe fixes (--write)
pnpm test                             # Vitest, once: web (tests/**) + extension (extension/tests/**)
pnpm exec vitest run --project extension  # only the extension's tests (or `cd extension && pnpm test`)
pnpm test:watch                       # Vitest in watch mode
pnpm dlx shadcn@latest add <name>     # add a shadcn component
```

## Current State

- **`/`** — placeholder homepage (CTA → `/saves`). Replace with real marketing landing.
- **`/saves`** — Pocket-style bookmark dashboard. Client-only, Zustand-persisted to `localStorage` under key `pocket-saves`. No backend yet.
- **Stack confirmed:** Postgres (role `myuser`, DB `pocket`), Prisma + pg adapter (driver adapters preview), Better Auth, Zustand, TanStack Query, Zod, Biome. Migrations not yet run.

## Feature Layout

```
src/
├── app/
│   ├── page.tsx            # placeholder home
│   ├── saves/layout.tsx    # header (save + search box), toasts, save announcer: stay mounted across saves views
│   └── saves/page.tsx      # bookmarks dashboard (also favorites/, archive/, tags/[tag]/)
├── components/
│   ├── logo.tsx            # Pocket wordmark (ribbon mark + "Pocket" in Newsreader)
│   ├── saves/              # SavesView, Navbar, Omnibox (+ panel, shortcuts), TagChipsInput, Sidebar, MobileNav,
│   │                       # SavesHeading, SavesList, PendingSaveRow, saves-states (skeleton/error/session), EmptyState,
│   │                       # BookmarkRow/Tile/Cover/Meta/Actions/TagsEditor, SaveQueueStatus, ToastViewport
│   └── ui/                 # shadcn primitives
├── features/
│   └── saves/              # types, utils, api, hooks, cache, omnibox (input classifier), search, save queue
│                           # (store + runner), cover, Zustand UI store, toast store
└── lib/
    ├── env.ts              # Zod-validated env
    ├── prisma.ts           # Prisma client singleton via PrismaPg adapter
    └── utils.ts            # `cn()`
```

When the API arrives, the Zustand store in `src/features/saves/store.ts` should become a thin client cache around TanStack Query, and `localStorage` persistence should be dropped.

## Saving links

- **One box** in the saves header (`src/components/saves/omnibox.tsx`): `classifyInput()` in `src/features/saves/omnibox.ts` turns its text into a search, one link, several links (pasted list, up to 50) or an inline error. Links open a panel with tags and Enter saves; words filter the current view (`src/features/saves/search.ts`). Its text lives in `useSavesStore().draft` (not persisted). Ctrl/Cmd+K and `/` focus it; pasting links outside a text field fills it.
- **Save queue:** saves go through `enqueueSaves()` (`src/features/saves/save-queue-runner.ts`, state in `save-queue-store.ts`), never a one-off mutation: 3 at a time, new links show as pending rows, failures stay inline with Retry (network/5xx) or Dismiss. It lives outside React so it survives navigation. Call `resetSessionState()` (`src/features/saves/session-reset.ts`: queue, header box text, toasts) before every `qc.clear()` (sign-in, sign-up, sign-out), so a late response can't write into another session's cache and the next account doesn't see the previous one's draft or Undo.
- **Cache writes:** the save path uses `upsertSavedBookmark()` in `src/features/saves/cache.ts`; update/delete mutations roll back only their own row (a whole-list snapshot would drop rows the queue added meanwhile).
- **Tags** are edited as chips (`TagChipsInput`) at save time and later from a save's menu (Edit tags). The extension popup has its own copy (`extension/src/popup/tag-chips-input.tsx`, since React can't be shared across the two builds); keep the two in sync. Their suggestion ranking (`rankedSuggestions()`) is shared.

## Design system ("Reading list")

- **Tokens:** `shared/tokens.css` holds the raw palette (paper, sheet, ink, graphite, pocket red, rule, wash, field, danger, notice) mapped onto the shadcn semantic names, with dark values under `prefers-color-scheme: dark`. `src/app/globals.css` imports it and exposes the Tailwind colors. Components use only semantic classes (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border`, `text-destructive`, `bg-notice`); no hardcoded `gray-*`/`red-*`/hex.
- **Dark mode** follows the system setting; the `dark:` variant is media-query based (no `.dark` class, no toggle).
- **Type:** Hanken Grotesk (`font-sans`, all UI) and Newsreader (`font-serif`, saved titles and page titles), both via `next/font/google` in `src/app/layout.tsx`.
- **Rules:** pocket red only for the brand mark, the primary action and favorites; no resting shadows (`shadow-float` only on floating layers); radius by hierarchy (`rounded-xl` panels, `rounded-lg` controls); sentence-case labels; one global `:focus-visible` outline in `globals.css`.
- **Covers:** saves without a usable image get a typographic cover (domain on a tint from `coverHue()` in `src/features/saves/cover.ts`); no third-party placeholder service.

## Extension

`extension/` holds the MV3 Chrome extension (Vite + `@crxjs/vite-plugin`, React 19, Tailwind v4, Zod). It saves the active tab to Pocket. See `extension/README.md` for full setup.

- **Installs separately:** not a pnpm workspace member (`pnpm-workspace.yaml` lists only `.`) and has its own `pnpm-lock.yaml` and `extension/pnpm-workspace.yaml`. That file makes `extension/` its own workspace root (otherwise pnpm 11 walks up and installs the web app instead) and holds its `allowBuilds` list (esbuild); add any new dependency with a build script there. Excluded from the root `tsconfig.json`, so root `tsc` does not check it. Work inside the folder: `cd extension && pnpm install`, then `pnpm dev` / `pnpm build` / `pnpm typecheck`.
- **Tests:** `extension/tests/**/*.test.ts`. Run with `cd extension && pnpm test` (the extension's own Vitest devDependency), and also by the repo root's `pnpm test`, which lists `extension/vitest.config.ts` under `test.projects`. That config maps `@/` to `extension/src`. `chrome.*` is faked per test with `vi.stubGlobal`. The extension tsconfig includes `tests/` and `vitest.config.ts`, so `pnpm typecheck` (and `pnpm build`) type-checks them. Keep the extension's `vitest` version equal to the root's: the root run loads test files that import the extension's copy.
- **Config:** `extension/.env` (gitignored, copy from `.env.example`) sets `VITE_API_BASE_URL` to the web app origin.
- **Styling:** `extension/src/popup/popup.css` imports `shared/tokens.css` (same palette and dark mode as the web app) and self-hosts the two fonts from `extension/public/fonts/` (Latin subsets of the variable fonts, OFL licenses alongside). Keep the popup on semantic classes like the web app.
- **Auth:** reuses the web app's Better Auth cookie session via `GET /api/auth/get-session`.
- **Server wiring:** the web app's `EXTENSION_IDS` env var (comma-separated extension IDs, optional, 32-char a-p IDs; schema in `src/lib/extension-ids.ts`) drives both:
  - `src/proxy.ts`: credentialed CORS on `/api/*` only for `chrome-extension://<id>` origins in the list. Validates with `safeParse` and only this one schema, so an invalid value fails closed (no CORS) instead of 500ing every route. Do not import `src/lib/env.ts` here: it would make `/api/health` depend on the full env.
  - `src/lib/auth.ts`: the same origins added to Better Auth `trustedOrigins`, via `env.EXTENSION_IDS: string[]` (strict: an invalid value throws)
- A new or changed extension ID (unpacked dev build vs Web Store build) must be added to `EXTENSION_IDS`, or the popup's API calls fail CORS/origin checks.
- Logic used by both the web app and the extension lives in `shared/` at the repo root (tag normalization in `shared/tags.ts`, tag suggestion matching and ranking in `shared/tag-autocomplete.ts`, design tokens in `shared/tokens.css`), imported as `@shared/*` (alias in both tsconfigs and `extension/vite.config.ts`) or by relative CSS `@import`. Keep those files free of imports: each build bundles them with its own `node_modules`.
- `extension/src/shared/schemas.ts` mirrors the create schema in `src/features/saves/schemas.ts` (URL rule, limits); keep them in sync when request payloads change.

## API keys (Apple Shortcuts)

Personal API keys let clients that can't carry the session cookie (the iPhone "Save to Pocket" shortcut) call the bookmark API.

- **Plugin:** `@better-auth/api-key` (pinned to the installed `better-auth` version) in `src/lib/auth.ts`. Keys are prefixed `pocket_`, stored hashed in the `api_keys` table (`Apikey` Prisma model, cascade-deleted with the user), rate-limited to 30 requests per minute (the plugin default is 10 per day).
- **Auth path:** API routes call `authenticateRequest()` in `src/lib/session.ts`, which returns `{ userId }` or a ready `response` to return as is. It accepts an `x-api-key` header (401 if invalid or revoked, 429 with `Retry-After` if rate-limited, never falling back to the cookie) and otherwise uses the session cookie. Keys only work on routes that call it; `enableSessionForAPIKeys` stays off so a key can't act as a login on `/api/auth/*`.
- **UI:** `/settings` (protected in `src/proxy.ts`, linked from the user menu) creates, lists and revokes keys and shows the Shortcut setup steps. The raw key is shown once.
- **Add to iPhone:** the optional `IOS_SHORTCUT_URL` env var (an `https://www.icloud.com/shortcuts/...` share link) shows an "Add to iPhone" button that creates a key, copies it and opens the shared shortcut. The shortcut should ask for the key with an import question; without one, users paste the key into its Text action after adding it. Unset or empty hides the button. After editing the shortcut, re-share it and update the var (don't assume the old link picks up edits).
- **Prisma 7:** `prisma migrate dev` does not regenerate the client; run `pnpm db:generate` after schema changes (the build's `postinstall` does it on deploy).

## TODO — Roadmap

### App shell / pages
- [ ] Marketing homepage (`/`) — hero, features, screenshots, CTA to sign up
- [ ] Auth pages: `/login`, `/register`, `/forgot-password`, `/verify-email`
- [ ] User account page: `/settings` (profile, password change, sessions, delete account)
- [ ] Replace `User` icon in navbar with real user menu (avatar, sign-out)

### Auth (Better Auth)
- [ ] Wire `better-auth` server instance in `src/lib/auth.ts` with Prisma adapter
- [ ] Mount Better Auth route handler at `src/app/api/auth/[...all]/route.ts`
- [ ] Create client helpers in `src/lib/auth-client.ts` (`signIn`, `signUp`, `useSession`)
- [ ] Generate Better Auth Prisma models and add to `schema.prisma` (User, Session, Account, Verification)
- [ ] Email/password + at least one OAuth provider (Google? GitHub?)
- [ ] Protect `/saves` and `/settings` via middleware (`src/middleware.ts`)
- [ ] Real `BETTER_AUTH_SECRET` in `.env.local` (`openssl rand -base64 32`)

### Bookmarks backend
- [ ] Prisma models: `Bookmark`, `Tag`, `BookmarkTag` join (or `String[]` if we stay simple)
- [ ] Run first migration: `pnpm db:migrate --name init`
- [ ] API routes or server actions: create / list / update / delete / toggle favorite / toggle archive
- [ ] Zod schemas for all request payloads (`src/features/saves/schemas.ts`)
- [ ] Server-side URL metadata fetcher (title, description, OpenGraph image) — replace the placeholder image generator
- [ ] Swap Zustand-only state for TanStack Query with optimistic updates; keep Zustand for UI prefs (view, current category) only

### Quality / DX
- [ ] Remove ESLint + `eslint-config-next` from `devDependencies` (Biome is the linter)
- [x] Add `pnpm test` (Vitest): `vitest.config.ts` mirrors the `@/` and `@shared/` aliases; tests live in `tests/`, Node environment. The extension is a second project (`extension/vitest.config.ts`, tests in `extension/tests/`)
- [x] CI on every PR (`.github/workflows/ci.yml`): lint, type-checks, unit tests for the web app and the extension
- [ ] Consider Playwright for auth + save flow e2e

### Open product questions
- [ ] **Purpose / one-line pitch:**
- [ ] **Target users / use case:**
- [ ] **Non-goals:**
- [ ] **Deployment target:** Vercel? Coolify? Both?
- [ ] **Third-party services:** transactional email provider for verification + password reset?
- [x] **Design system:** "Reading list" tokens and type (see Design system)
