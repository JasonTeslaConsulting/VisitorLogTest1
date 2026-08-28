---
paths:
  - src/routes/**
  - platform/src/routes/**
  - platform/src/contexts/**
  - src/hooks/**
  - platform/src/hooks/**
  - src/services/**
  - platform/src/services/**
  - src/types/**
  - platform/src/types/**
  - platform/src/integrations/supabase/**
---

# Rules: cross-cutting architecture (data fetching, DB mapping, routing, auth, storage)

Read this when working across layers — adding a service+hook+page together, wiring a new route,
touching auth, or adding storage. `src/` paths below are app-owned; `platform/src/` paths are
framework-owned and read-only in a portal — see `platform/framework.json`.

## Component layers

```
Pages / feature components  →  UI base components (platform/src/components/ui/)  →  Base UI primitives
```

- `platform/src/components/ui/` is both the shadcn-generated scaffold and this repo's customized
  component library — one folder, no wrap-don't-touch split. shadcn-generated code is only the
  *initial* scaffold; once generated it's ordinary project code, edited directly (radius, fill,
  loading states, etc. — see `.claude/rules/components-rules.md`). Framework-owned: a portal never
  edits this folder.
- `src/components/<PageName>/` components are page-scoped only, never shared, app-owned.

**If you are building an app from this skeleton (not developing the skeleton itself):**

- Never modify files in `platform/src/components/ui/` — treat it as a frozen, given component
  library (`npm run framework:verify` rejects the edit anyway).
- Feature/page components must never import Base UI directly — only through
  `platform/src/components/ui/` (`@framework/components/ui/...`).

## Data fetching layers (strict top-to-bottom)

```
Pages → Hooks (useQuery/useMutation) → Services (Supabase)
```

- Pages never import from `@tanstack/react-query` directly.
- Services never contain React imports or hooks.
- Hooks never call Supabase directly.

## Database mapping

- DB columns are all-lowercase (`createddate`, `organizationname`).
- `RawX` types stay inside the service file — never exported.
- Service functions always map to camelCase before returning via `mapX()` functions.
- Clean types live in `<domain>.ts`, one file per domain, re-exported from an `index.ts` barrel —
  app domains under `src/types/`, framework domains under `platform/src/types/`
  (`@/types/<domain>` / `@framework/types/<domain>` directly, not the barrel, for new imports).

## Supabase types

- Generated types live in `src/integrations/supabase/types.ts` — app-owned; the framework's own
  `platform/src/integrations/supabase/client.ts` imports it via the `@/` alias as a declared
  contract (`platform/framework.json`'s `appContracts`).
- Run `npm run gen-supabase-types` to regenerate after DB changes.
- Service `RawX` types must match column names in `types.ts` exactly.
- Never modify `types.ts` manually — always regenerate.

## Routing

- New routes go in `src/routes/modules/<area>.routes.tsx` for an app-owned area, or
  `platform/src/routes/modules/<area>.routes.tsx` for a framework-owned one — never directly in
  `AppRouter.tsx`, and never a new top-level file outside `modules/`. Routes are auto-discovered
  via two `import.meta.glob` calls in `platform/src/routes/registry.ts`, one per root — there's no
  shared file to register a route in.
- One module per top-level nav area (`home.routes.tsx`, `auth.routes.tsx`, ...), each exporting a
  single `routes` array with `access`/`requiredRole` as fields on each route — see
  `.claude/skills/add-new-route/SKILL.md` for the split trigger once an area grows.
- Layout applied at route level via `AppRouter.tsx`'s `withLayout()` wrapper routes — never inside
  page components.
- Opt out with `layout: "none"`.
- **Never add `loader`, `action`, or `shouldRevalidate` to a route.** React Router v8 runs in data
  mode (`createBrowserRouter`/`RouterProvider`), which supports them, but they're a second data
  path competing with Pages → Hooks → Services above — that's the only sanctioned one. Data mode
  was adopted for `useBlocker` and per-route `ErrorBoundary` only — see
  `docs/architecture/routing.md`.

## Auth

- Always `supabase.auth.getUser()` — never trust `session.user`.
- `resolveCurrentUser()` in `services/auth.ts` handles profile + validation.
- Login/logout/OTP/password flows live in `AuthContext`, not in a service.
- To open a page behind `ProtectedRoute` with no real account, set `VITE_DEV_AUTH=true` in
  `.env.local` (dev-only, build-time eliminated) — never fork or comment out `ProtectedRoute` or
  `AuthContext` to do this. See `docs/architecture/auth.md` § Dev auth bypass.

## Storage

Not built yet. See `docs/architecture/storage.md` for the convention to follow when it's added —
don't duplicate it here.
