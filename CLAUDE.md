# Pocket — Project Instructions

## Stack

- **Framework:** Next.js (App Router, React Server Components)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config.*`)
- **UI Library:** [shadcn/ui](https://ui.shadcn.com) — components copied into `src/components/ui/`
- **Component primitives:** Base UI (`@base-ui/react`) — shadcn's `base` preset
- **Icons:** `lucide-react`
- **Utilities:** `clsx`, `tailwind-merge` (via `cn()` in `src/lib/utils.ts`), `class-variance-authority`
- **Lint:** ESLint (flat config, `eslint.config.mjs`)
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

## Scripts

```bash
pnpm dev                              # start dev server
pnpm build                            # production build
pnpm start                            # serve production build
pnpm lint                             # eslint
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
│   └── saves/page.tsx      # bookmarks dashboard
├── components/
│   ├── saves/              # Navbar, Sidebar, AddBookmarkForm, BookmarkCard, EmptyState, SavesView, ToastViewport
│   └── ui/                 # shadcn primitives
├── features/
│   └── saves/              # types, utils, Zustand store, toast store
└── lib/
    ├── env.ts              # Zod-validated env
    ├── prisma.ts           # Prisma client singleton via PrismaPg adapter
    └── utils.ts            # `cn()`
```

When the API arrives, the Zustand store in `src/features/saves/store.ts` should become a thin client cache around TanStack Query, and `localStorage` persistence should be dropped.

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
- [ ] Add `pnpm test` (Vitest) once there's logic worth testing
- [ ] Consider Playwright for auth + save flow e2e

### Open product questions
- [ ] **Purpose / one-line pitch:**
- [ ] **Target users / use case:**
- [ ] **Non-goals:**
- [ ] **Deployment target:** Vercel? Coolify? Both?
- [ ] **Third-party services:** transactional email provider for verification + password reset?
- [ ] **Design system:** keep red accent / Inter, or adopt full shadcn theme tokens?
