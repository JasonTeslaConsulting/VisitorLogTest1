# Portals Skeleton

Internal starter template for spinning up Tesla Consulting's internal enterprise portals (admin tools, HR tools, management dashboards). It ships with auth, role-based access control, DB-driven navigation, theming, and the full design/data-fetching plumbing already wired up, so a new portal is built by adding pages and Supabase tables — not by re-building infrastructure.

This document describes what exists in the skeleton today and how the pieces fit together. For the rules Claude Code follows when generating code in this repo, see [`CLAUDE.md`](CLAUDE.md); for the "already built, don't recreate" checklist, see [`docs/architecture/`](docs/architecture/) (generated inventory + hand-written notes, indexed from [`ARCHITECTURE.md`](ARCHITECTURE.md)); for visual design tokens, see [`DESIGN.md`](DESIGN.md).

---

## Tech Stack

| Layer          | Choice                                                    |
| -------------- | ---------------------------------------------------------- |
| Framework      | React 19 + TypeScript, built with Vite 8 (Rolldown/Oxc)   |
| Backend        | Supabase (Postgres + Auth + Data API), `@supabase/supabase-js` |
| Server state   | TanStack Query v5                                          |
| Styling        | Tailwind CSS v4 + shadcn/ui-derived components (`@base-ui/react` primitives) |
| Forms          | react-hook-form + zod                                      |
| Routing        | React Router v8 (data mode)                                 |
| Auth           | Supabase Auth — Azure Entra ID (OAuth), OTP email, or password, switchable per deployment |
| Notifications  | Sonner (toasts)                                             |
| Deployment     | Docker — `docker/Dockerfile` onto an internal `spa-host` base image, or `docker/Dockerfile.nginx` for a self-contained nginx image |

---

## Getting Started

```bash
npm install
npm run dev       # http://localhost:8080
```

Before running, set up the runtime config file (see [Runtime Configuration](#runtime-configuration) below) — the app will fail to boot without it.

Other commands:

```bash
npm run typecheck           # type check (tsc --noEmit --project tsconfig.app.json)
npm run lint                # eslint
npm run format:check        # prettier --check
npm run build                # production build
npm run gen-supabase-types   # regenerate src/integrations/supabase/types.ts
```

`gen-supabase-types` has the Supabase project ID hardcoded in `package.json` — update the `--project-id` flag to point at your project before running it on a new deployment.

---

## Bootstrap & Runtime Configuration

Nothing is hardcoded per-deployment — Supabase credentials and a handful of app settings are loaded at runtime from a JSON file, so the same build artifact can be deployed to multiple environments/clients.

**Flow:** `src/main.tsx` calls `appConfig.initialize()` (`platform/src/app/appConfig.ts`) **before** React ever mounts. It fetches `public/config/app.json`, deep-merges it into an in-memory config object, and only then renders `<App />`. If the fetch or JSON parse fails, the app shows a plain error message instead of mounting — this is intentional, since nothing downstream (Supabase client, auth mode) can work without it.

Everything else reads config via `appConfig.config`, never via `import.meta.env` or hardcoded values.

Shape of `public/config/app.json`:

```json
{
  "supabase": {
    "supabaseUrl": "https://[projectId].supabase.co",
    "supabasePublishableKey": "[sb_publishable_...]"
  },
  "app": {
    "authMode": "password",
    "paginationOptions": [10, 25, 50, 100, 200],
    "companyName": "[Company Name]",
    "portalName": "[Portal Name]",
    "homeIcon": "Home",
    "enableSample": true
  }
}
```

- `authMode` — `"entra"` | `"otp"` | `"password"` — controls which login form renders (see [Authentication](#authentication)).
- `paginationOptions` — default page-size choices for the shared `Pagination` component.
- `portalName` — shown on the login page.
- `homeIcon` — the navbar's leading home icon. A **key of `MENU_ICON_MAP`** (`platform/src/app/layout/MenuIcon.tsx`), not a Phosphor component name: `"Home"`, not `"PiHouse"`. An unmapped value renders a generic fallback icon, warns in the dev console, and is reported by `npm run docs:check`.
- `companyName` — read by nothing today; the navbar no longer carries a company-name slot.
- `enableSample` — read by nothing today; the `/sample/*` routes are always registered.

**Never commit real Supabase credentials for a live client into this file** — treat it as environment/deployment-specific.

---

## Authentication

Auth is Supabase Auth, wrapped by `AuthContext`/`AuthProvider` (`platform/src/contexts/AuthContext.tsx`) and consumed via `useAuth()`. Three login modes are built in and switched purely by `appConfig.config.app.authMode` — no code changes needed to switch a deployment between them:

| Mode | Component | Flow |
| --- | --- | --- |
| `entra` | `EntraLogin` | `supabase.auth.signInWithOAuth({ provider: "azure" })` — redirects to Azure Entra ID |
| `otp` | `OtpLogin` | Email → `signInWithOtp` → 6-digit code → `verifyOtp` |
| `password` | `PasswordLogin` | Email + password → `signInWithPassword` — intended for local/dev use |

`platform/src/pages/Login.tsx` renders whichever component matches `authMode`.

**Post-login resolution:** once Supabase confirms a session (`onAuthStateChange` fires `SIGNED_IN`/`INITIAL_SESSION`/`TOKEN_REFRESHED`), `AuthContext` calls `resolveCurrentUser()` (`platform/src/services/auth.ts`). This is where the app's own authorization model kicks in — it is intentionally decoupled from Supabase Auth:

1. Looks up the caller's email in `_secure.organizationuser`, joined down through `applicationuser` → `applicationuserrole` → `role` → `rolescreen`.
2. Rejects the login (signs the Supabase session back out) if the employment record isn't found, or if today falls outside the employment date range, returning a `reason` of `not_found` | `employment_inactive`. The employment window is the only date gate — `_secure` dropped `applicationuser.access{start,end}date` and `applicationuserrole.{start,end}date`, so there is no `access_inactive` reason and no time-bounded role assignment.
3. Flattens every role assigned to the user into (there is nothing to filter on — `role.isenabled` was dropped, so a role can no longer be disabled):
   - `roles: string[]` — role names, checked via `hasRole()`
   - `screenAccess: Record<screenId, { read, write, delete }>` — per-screen CRUD flags, checked via `hasScreenAccess(screenId, flag)` or the `useScreenAccess(screenId)` hook

So "being authenticated" (has a valid Supabase session) and "being authorized" (has an active `organizationuser`/`applicationuser` record with a role) are two separate checks — a valid Azure/OTP/password login does not by itself grant access to the app.

`ProtectedRoute` (`platform/src/routes/ProtectedRoute.tsx`) gates routes on `isAuthenticated`, and optionally on `hasRole(requiredRole)` for admin routes.

---

## Routing & Layout

Routes are declared as data, not JSX, in `src/routes/modules/<area>.routes.tsx` — one file per
top-level nav area (`auth`, `home`, `admin`, ...), each exporting a `routes` array. There's no
shared file to register a route in: `platform/src/routes/registry.ts` discovers every `*.routes.tsx` module
under `modules/` via `import.meta.glob` and aggregates them. Each route is data with an `access`
field instead of belonging to one of several fixed arrays:

- `access: "public"` — no auth required (e.g. `/` → `Login`)
- default (`access` omitted) — requires a session (e.g. `/home`)
- `requiredRole: string | string[]` — requires a session **and** a role (a `ROLES` member from `src/lib/constants/roles.ts`, or a bare string)

`AppRouter` (`platform/src/routes/AppRouter.tsx`) consumes the registry's `publicRoutes`/`guardedRoutes` and
builds a `createBrowserRouter` tree, wrapping each route's `element` in `PageLayout` via a
`withLayout()` helper — unless the route sets `layout: "none"` (used by `Login`, which renders
full-screen with no navbar). Routes with a `requiredRole` get an extra
`<ProtectedRoute requiredRole={...}>` wrapper around the normal one. See
`docs/architecture/routing.md` for why data mode over declarative/framework mode.

`PageLayout` (`platform/src/app/layout/PageLayout.tsx`) renders `Navbar` + the page content + `BackToTop`. The company/portal name shown there and on the Login screen are read from `appConfig.config.app.companyName`/`portalName` (`public/config/app.json`) — set per deployment, not hardcoded. The logo image itself (`public/images/logo.png`) still needs to be swapped per project.

---

## Navigation (DB-driven)

The navbar is not hardcoded — it's generated from three Supabase tables in the `_arch` schema:

```
_arch.module  (top-level nav group, e.g. "Admin")
   └─ _arch.screen  (a route + its screenname/urladdress)
        └─ _arch.menu  (which screens appear in the nav, in what order, under what icon)
```

`getNavMenu()` (`platform/src/services/menu.ts`) joins `menu → screen → module`, filters to top-level menu entries (`parentmenuid is null`), and groups them into `NavModule[]`. Row-level security on `_arch.menu` (keyed off `auth.uid()`) is what actually restricts which items a given user sees — the client doesn't do its own filtering. `useNavMenu()` wraps this in a `useQuery`, keyed by the current user's `organizationUserId` and only enabled once that's known.

`Navbar` (`platform/src/app/layout/Navbar.tsx`) is composition only. A module with a single screen renders as a direct `Link`; a module with several renders as a `ModuleDropdown`. Below the `lg` breakpoint the whole nav collapses into a slide-in `MobileSidebar` behind a hamburger. All three use `MenuIcon`, which maps the `_arch.menu.menuicon` string onto a `react-icons/pi` icon (falling back to `PiCircle` for unmapped names) — add new icon names to `MenuIcon.tsx`'s `MENU_ICON_MAP`, not at the call site. Active-route highlighting comes from `LayoutUtils.isActive()` / `isModuleActive()` (`platform/src/lib/layoutUtils.ts`), shared by all three rather than re-derived per component. All four files live in `platform/src/app/layout/`.

Adding a page to the nav is a database change (insert into `_arch.screen`/`_arch.menu`), not a code change.

---

## Data Fetching (Pages → Hooks → Services → Supabase)

Strict one-way layering, enforced by `.claude/rules/*`:

```
Pages            composition only — no useQuery/useMutation imports, no supabase calls
  ↓
Hooks            src/hooks/<domain>/  — the only files allowed to import @tanstack/react-query
  ↓
Services         src/services/ (app) · platform/src/services/ (framework)  — the only files allowed to call supabase; map raw rows to camelCase types
  ↓
Supabase         Postgres via the Data API, multiple schemas (see below)
```

The services that ship with the skeleton are framework-owned, all in `platform/src/services/` (read-only in a portal — your own go in `src/services/`). No `Service` suffix on the filenames despite the naming convention table in `CLAUDE.md` — follow the convention for new files, existing ones haven't been renamed:

- `auth.ts` — `getUserProfile`, `resolveCurrentUser` (see [Authentication](#authentication))
- `menu.ts` — `getNavMenu` (see [Navigation](#navigation-db-driven))
- `roles.ts` — role CRUD + `upsertRoleScreen`/`deleteRoleScreen` for the role↔screen permission matrix
- `screens.ts` — `getScreens`
- `users.ts` — user CRUD, role assignment (`addUser`, `addRoleToUser`, `updateApplicationUser`, etc.)

These are the user-administration service layer. **No admin page ships** — a permission UI is exactly what every portal needs differently, so the framework provides the CRUD and you build the screen. See [docs/architecture/user-administration.md](docs/architecture/user-administration.md).

Supabase is accessed through `supabase` (`platform/src/integrations/supabase/client.ts`), a lazy proxy that defers client creation until `appConfig` has loaded — this is why services never need to worry about config load order.

### Schemas in use

- `_arch` — application metadata: `module`, `screen`, `menu` (drives navigation, above)
- `_secure` — the app's own auth/authorization model: `organizationuser`, `applicationuser`, `role`, `rolescreen`, `applicationuserrole`
- `_common`, `_content`, `_training` — also included in `gen-supabase-types`, but nothing in the current codebase queries them yet — presumably reserved for future/domain-specific tables in derived portals

Types are generated (never hand-written) via `npm run gen-supabase-types` into `src/integrations/supabase/types.ts`. Service files define local `RawX` types matching those generated columns and map them to camelCase `X` types exported from the relevant `src/types/<domain>.ts` file.

---

## Theming & Design

- **Dark mode** — `ThemeProvider`/`useTheme()` (`platform/src/contexts/ThemeContext.tsx`), light/dark/system, persisted to `localStorage`. `DarkModeToggle` cycles through all three on click.
- **i18n** — none. The `LanguageProvider`/`useLanguage()`/`LanguageSelector` layer was removed on 2026-08-14: its dictionary was placeholder copy, `t()` was never called, and the selector was never wired into `Navbar`, so it was a framework/app seam with no consumers. Translation gets designed when a portal actually needs it, alongside the planned login work. See `docs/DECISIONS.md`.
- **Design tokens** — all colors are CSS custom properties in `src/index.css` (HSL values only, no hex/rgb), consumed via Tailwind's `hsl(var(--x))` mapping in `index.css`'s `@theme inline` block. `DESIGN.md` is the source of truth for what those tokens *should* be for a given client — its YAML frontmatter (primary color, typography, radius) currently reflects a generic orange "internal enterprise portal" identity and is meant to be edited per project, then applied to `index.css` via the `plan-design` skill. See `.claude/rules/index-css-rules.md` for the editing rules (HSL-only, no new tokens without adding both light/dark values, etc).

---

## Shared UI Components

| Component | Path | Purpose |
| --- | --- | --- |
| `Pagination` | `platform/src/components/ui/datatable/Pagination.tsx` | Page controls + optional page-size selector, reads default sizes from `appConfig` |
| `SearchBar` | `platform/src/components/ui/datatable/Searchbar.tsx` | Debounced search input (300ms default) |
| `RefreshButton` | `platform/src/components/ui/datatable/RefreshButton.tsx` | Invalidates a TanStack Query `queryKey` (or calls a manual callback) with a spin animation |
| `DarkModeToggle` | `platform/src/components/ui/DarkModeToggle.tsx` | See [Theming](#theming--design) |
| `Field` family | `platform/src/components/ui/field.tsx` | Form layout: `Field` + `FieldLabel` per control, `FieldGroup` to stack them, `FieldError` for messages. Never lay a form out with a bare `div` |
| `DatePicker` | `platform/src/components/ui/DatePicker.tsx` | Text input (multi-format parsing on blur) + calendar popover, normalizes to `yyyy-MM-dd` |
| `TimePicker` | `platform/src/components/ui/TimePicker.tsx` | Text input + popover with Hr/Min(/Sec) columns; always 24-hour, stores `HH:mm:ss` |
| `DateTimePicker` | `platform/src/components/ui/DateTimePicker.tsx` | DatePicker + TimePicker as two fields sharing one value; emits offset-aware ISO, `withSeconds` opt-in |
| `BackToTop` | `platform/src/components/ui/BackToTop.tsx` | Floating scroll-to-top button, appears after 300px scroll |
| `ScrollToTop` | `platform/src/components/ui/ScrollToTop.tsx` | Route-change effect, no UI — resets scroll position on navigation |
| `Toaster` | `src/components/ui/Toaster.tsx` | Themed wrapper around shadcn's Sonner toaster |

`platform/src/components/ui/` holds both the shadcn-generated primitives (kebab-case, e.g. `button.tsx`)
and custom/composed components (PascalCase) in one place — shadcn output is only the initial
scaffold, customized directly rather than wrapped. Every primitive runs on `@base-ui/react`
(migrated off Radix — see `docs/architecture/ui.md`). When building an app *from* this skeleton, treat
this folder as frozen — don't modify it, and don't import Base UI directly into page/feature code.

---

## Shared Hooks

- `useAuth()` — see [Authentication](#authentication)
- `useNavMenu()` — see [Navigation](#navigation-db-driven)
- `useScreenAccess(screenId)` — shorthand returning `{ canRead, canWrite, canDelete }` for a screen
- `useTheme()` — see [Theming](#theming--design)

Toasts come from Sonner via `platform/src/components/ui/sonner.tsx` — there is no `use-toast` hook.

---

## Utilities

- `platform/src/lib/functions.js` — generic, framework-agnostic helpers (type checks, string/array/object comparison, base64, UUID generation, etc). Check here before writing an inline helper.
- `platform/src/lib/dateTimeUtils.ts` / `platform/src/lib/numericUtils.ts` — exposed as `DateTimeUtils.x()` / `NumericUtils.x()` via the `platform/src/lib/index.ts` barrel (import via `import { DateTimeUtils, NumericUtils } from "@/lib"`). All date/number formatting should go through these rather than inline `Intl`/`toFixed` calls — see `.claude/rules/utils-rules.md`.
- `platform/src/lib/layoutUtils.ts` — exposed as `LayoutUtils.isActive()` / `LayoutUtils.isModuleActive()` via the same `platform/src/lib/index.ts` barrel (import via `import { LayoutUtils } from "@/lib"`). Pure pathname predicates used by the navbar components to decide which link is active — see `.claude/rules/utils-rules.md`.
- `platform/src/lib/shadcn/shadcn-utils.ts` — `cn()` class-merging helper used everywhere for conditional Tailwind classes.
- `src/lib/constants/` — all app-wide constants, one file per domain (`roles.ts` has `ROLES`/`PERMISSION_OPTIONS`, `app.ts` has `AUTH`/`STALE_TIMES`/`PAGINATION`), re-exported from `index.ts`. Add new roles to `roles.ts`, sorted alphabetically by key, never as inline string literals.

---

## Folder Structure

```
src/
├── app/                    Bootstrap-level concerns
│   ├── appConfig.ts         Runtime config loader
│   └── layout/               Navbar, MenuIcon, ModuleDropdown, MobileSidebar, PageLayout, RootLayout
├── components/
│   ├── ui/                   Shared component library — shadcn-derived + custom, edited directly
│   └── <PageName>/            Page-scoped components (e.g. Login/)
├── contexts/                Auth, Theme providers
├── hooks/
│   ├── shadcn/                shadcn-generated — don't modify
│   └── <domain>/               TanStack Query wrappers, one per domain
├── integrations/supabase/   Generated types + the lazy Supabase client
├── lib/                     Utilities, constants, shadcn cn() helper
├── pages/                   One file per route, composition only
├── routes/                  AppRouter, registry, ProtectedRoute, modules/ (route-per-area)
├── services/                All Supabase calls — nothing else
└── types/index.ts           All TypeScript types, grouped by domain
```

See `CLAUDE.md` for the full naming conventions and per-directory rules (`.claude/rules/*.md`).

---

## What's Actually Built vs. Stubbed

Fully working: auth (all 3 modes), authorization/RBAC resolution, DB-driven navigation, routing/layout, theming, all shared UI components listed above, and the full service layer for user/role/screen management.

**Not yet built — placeholders only:**
- `src/pages/Home.tsx` — empty placeholder. Every portal replaces it, so it's seeded rather than framework-owned (`platform/framework.json`).

**Intentionally absent:** there is no user-administration page. Its service layer (`users.ts`, `roles.ts`, `screens.ts`) is complete and framework-owned, but the screen itself is per portal — build it with the `build-datatable` / `build-form-page` skills. See [docs/architecture/user-administration.md](docs/architecture/user-administration.md).

No automated test suite exists in this repo currently.

---

## Rebranding a New Portal

Things that are placeholder/example content and should be replaced per client:

- `DESIGN.md`'s markdown tables (brand color, typography) — then apply to `src/index.css` via the `plan-design` skill
- `public/images/logo.png`, and `<title>`/meta tags in `index.html` (not config-driven — these are static assets/HTML)
- `public/config/app.json` — `companyName`, `portalName`, Supabase project credentials, and `authMode` for the new deployment (`portalName` flows automatically into `PageLayout` and `Login` — no code change needed. `companyName` currently renders nowhere: its span in `PageLayout.tsx` is commented out — uncomment it if the client wants the company name beside the logo)
- `dockerbuild.bat`'s `IMAGE` — set it to this portal's own ACR repository. If deploying outside Tesla Consulting's infra, build `docker/Dockerfile.nginx` instead, which needs no private registry
- `package.json`'s `gen-supabase-types` script — update `--project-id` to the new Supabase project

---

## Claude Code Setup

This repo is set up to be built primarily with Claude Code:

- `CLAUDE.md` — global behavior rules, tech stack, folder/naming conventions
- `.claude/rules/*.md` — auto-loaded, directory-specific rules (services, hooks, components, pages, index.css, utils)
- `.claude/skills/*` — step-by-step procedures for common tasks: planning a page/feature/debug session (plan mode), building a data table or form page, adding a route/type/UI component, generating Supabase types, or updating the design system

When extending this skeleton into a new portal, the expected workflow is: plan (via the relevant `plan-*` skill) → implement (via the relevant `build-*`/`add-*` skill) → create `docs/features/<feature>.md` for the feature, and update the relevant `docs/architecture/<area>.md` if new reusable infrastructure was added. See `CONTRIBUTING.md` for the branching and PR conventions this assumes with more than one developer in the repo.
