# Routing

`AppRouter` (`platform/src/routes/AppRouter.tsx`) consumes `publicRoutes`/`guardedRoutes` from
`platform/src/routes/registry.ts`, which auto-discovers every `src/routes/modules/<area>.routes.tsx` file
via `import.meta.glob` — there is no shared file to register a route in. `withLayout()` builds a
pathless wrapper `RouteObject` that renders each route's `element` under `PageLayout` unless
`layout: "none"`; `withRoleGuard()` adds an extra `ProtectedRoute` wrapper for routes with a
`requiredRole`. The whole tree is passed once to `createBrowserRouter` at module scope and served
via `<RouterProvider>`.

**Why glob, not a shared array or file-system routing:** every route used to require editing
`routeConfig.tsx` twice (an import, and one of three arrays) — the worst merge-conflict hotspot in
the repo, since every page touched it. `import.meta.glob` removes the shared file entirely. The
usual objection to glob-based routing — nondeterministic match order — doesn't apply here:
react-router@8's `createBrowserRouter` ranks matches by path specificity (`rankRouteBranches`), not
declaration order — the same algorithm the old `<Routes>` used, so this held before the v8 upgrade
and still holds after it. File-system routing (deriving the path from the filename) was rejected
because it fights this repo's existing PascalCase page-naming convention and the exact
`urladdress` match required by `_arch.screen`.

**Granularity:** one module per top-level nav area, split into per-page files once an area exceeds
~5 routes or two developers are concurrently working in it — see
`.claude/skills/add-new-route/SKILL.md` for the exact trigger. Splitting later costs nothing: the
glob doesn't care how many files there are.

New routes go in `src/routes/modules/<area>.routes.tsx` only — never directly in `AppRouter.tsx`,
and never in `registry.ts` (write once, never edited again). See
`.claude/rules/architecture-rules.md` and `.claude/skills/add-new-route/SKILL.md`.

## Why data mode, not declarative or framework mode

React Router v8 ships three modes, each strictly additive over the last: **declarative**
(`<BrowserRouter>`/`<Routes>`/`<Route>`, what this repo ran through v6), **data**
(`createBrowserRouter`/`RouterProvider`, what it runs now), and **framework** (data mode plus
React Router's own Vite plugin, file-based route config, and SSR/static-rendering support).

Declarative mode is not deprecated in v8 — the only *mandatory* change on the v6→v8 upgrade was
the package rename (`react-router-dom` doesn't exist for v8; see below). Moving to data mode was a
deliberate choice for two capabilities declarative mode cannot provide at all:

- **`useBlocker`** — unsaved-changes navigation guards. Consumed by
  `platform/src/hooks/useUnsavedChangesGuard.ts`; call that, not `useBlocker` directly, so the
  dialog-close and route-navigation prompts stay one behaviour with one copy
  (`.claude/skills/build-form-page/SKILL.md`).
- **Per-route `ErrorBoundary`** — contains a render crash to that route's outlet, with nav and
  layout still standing, instead of blanking the whole app. Particularly valuable here because
  pages in apps built from this skeleton are AI-generated.

Framework mode was rejected: this is a client-only SPA with no SSR/static-rendering need, and
adopting React Router's Vite plugin would mean replacing this repo's own Vite + `import.meta.glob`
routing setup rather than layering on top of it.

**What data mode costs, and why it's still worth it:** `createBrowserRouter` runs once at module
scope, so route *config* can't depend on React state the way a component-rendered `<Routes>` tree
could. This repo's nav is already DB-driven (`_arch.screen`/`_arch.menu` via `useNavMenu`) — if a
future portal wants **routes** (not just nav items) derived from that data, module-scope creation
fights it (workarounds exist: `useMemo` in a wrapper component, or `router.patchRoutes`). The
tradeoff was accepted because this is a skeleton, not a single app: retrofitting data mode later
would mean touching every portal already generated from it.

**Loaders and actions are banned.** Data mode's headline feature — `loader`/`action` on a route —
is never used here. `CLAUDE.md`'s data-fetching layers (`Pages → Hooks → Services`) are the only
sanctioned data path; a route `loader` would be a second, competing one. Data mode was adopted
*only* for `useBlocker` and `ErrorBoundary`, not for its data-loading model. See
`.claude/rules/architecture-rules.md` §Routing for the enforced rule.

**A known non-optimization:** `withLayout()` wraps `PageLayout` around each leaf route
individually (mirroring the pre-v8 `applyLayout` behaviour), so `PageLayout` — and therefore
`Navbar` — remounts on every cross-page navigation, same as before the upgrade. Grouping every
default-layout route under one shared `PageLayout` parent would stop that remount, but it's a
*behaviour* change (`Navbar`-local state would start persisting across navigations), not a
router-version one, so it wasn't taken as part of this upgrade. It's available if a future change
wants it.

## History: react-router-dom → react-router

Through v6, this repo depended on `react-router-dom`. That package does not exist for v8 — it was
demoted to a thin re-export of `react-router` in v7 and dropped entirely in v8; npm's `latest` tag
for `react-router-dom` is permanently frozen at `7.18.2`. All routing imports now come from
`react-router` (or `react-router/dom` for the DOM-specific `HydratedRouter`/RSC exports this repo
doesn't use). No routing API used here changed shape across v6→v7→v8 — `BrowserRouter`, `Routes`,
`Route`, `Navigate`, `Outlet`, `Link`, `useLocation`, `useNavigate` are all exported unchanged; only
the package name changed.
