---
name: add-new-route
description: >
  Use this skill when adding a new page and wiring it into the router.
  Triggers: "add a new page", "create a route for X", "wire up the X page",
  "add X to the router", "register the X page". Always used alongside the
  relevant page-building skill (build-datatable, build-form-page etc.) —
  never used alone since a route without a page is incomplete.
applies_to:
  - routing
  - new pages
  - src/routes/modules/
  - protected routes
  - public routes
---

# Skill: Add a New Route

Read this entire file before writing any code.

## What this skill covers

Adding a new page and wiring it into the router correctly.

---

## Steps

### 1. Create the page component

- File goes in `src/pages/<PageName>.tsx`
- Named export only — no `export default`
- Page component owns no data logic — it composes hooks, components, and layout
- Page must not import any layout component directly

```tsx
// src/pages/ManageHolidays.tsx
export const ManageHolidays = () => {
  return <div>{/* page content */}</div>;
};
```

### 2. Add the route to its nav-area module

- NEVER add routes directly in AppRouter.tsx, and never register a route anywhere but
  `src/routes/modules/<area>.routes.tsx` — routes are auto-discovered by
  `import.meta.glob` in `platform/src/routes/registry.ts`, so there is no shared array to append to.
- Find the module for the page's nav area (`admin.routes.tsx`, `home.routes.tsx`, ...). If the
  area doesn't have one yet, create it — the registry picks up any `*.routes.tsx` file under
  `modules/` automatically, nothing else to wire.
- Each module exports one `routes` array. Access level is a field on the route, not a choice of
  array:

```tsx
// src/routes/modules/home.routes.tsx
import type { AppRoute } from "@framework/types/routing";
import { Home } from "@/pages/Home";
import { ManageHolidays } from "@/pages/ManageHolidays";

export const routes = [
  { path: "/home", element: <Home /> },
  { path: "/manage-holidays", element: <ManageHolidays /> }, // ← add here
] satisfies AppRoute[];
```

```tsx
// src/routes/modules/admin.routes.tsx — role-guarded route
import type { AppRoute } from "@framework/types/routing";
import { ROLES } from "@/lib/constants/roles";
import { ManageUsers } from "@/pages/admin/ManageUsers";

export const routes = [
  { path: "/admin/users", element: <ManageUsers />, requiredRole: ROLES.USER_ADMIN },
] satisfies AppRoute[];
```

**`ROLES` starts empty.** `src/lib/constants/roles.ts` is app-owned and ships with no entries —
role names are rows in *this* portal's database, so the framework can't know them. Before using
`requiredRole`, **ask the user which role guards this route** and add it to `ROLES`; don't invent a
name. (`requiredRole` is typed `string | string[]`, so a bare string compiles — but a typo then
silently disables the guard, which is why the constant exists.)

```tsx
// platform/src/routes/modules/auth.routes.tsx — public route, no auth required
export const routes = [
  { path: "/", element: <Login />, access: "public", layout: "none" },
] satisfies AppRoute[];
```

**Granularity — one module per nav area, with a split trigger, not one file per page.**
Area-level *shrinks* collisions between developers, it doesn't eliminate them — but splitting an
area later is a 2-minute, zero-blast-radius change (the glob doesn't care how many files there
are), so don't pre-split an area that only has one route. Split an area module into per-page files
(`admin.users.routes.tsx`, `admin.roles.routes.tsx`) once either is true:
- the area exceeds ~5 routes, or
- two developers are actively working in that area concurrently (`git branch -r` / `docs/wip/`).

To see every registered route at a glance without a shared file to open:
`rg 'path: "' src/routes/modules`

### 3. Set layout if needed

- Default layout is applied automatically — omit `layout` prop for standard pages
- To opt out: `layout: "none"` (e.g. login page, onboarding, full-screen views)

```ts
{ path: "/onboarding", element: <Onboarding />, layout: "none" }
```

### 4. Add the screen to \_arch.screen and \_arch.menu (if navigable)

- Every new page should have a corresponding row in `_arch.screen`
- `urladdress` must exactly match the route path defined in the route module
- If the page should appear in the navbar, add a row to `_arch.menu` with `displaymenuflag = true`
- If the page is only reachable programmatically (e.g. detail page), skip the menu row

---

## AppRoute type reference

`AppRoute` is a **framework** type at `platform/src/types/routing.ts`. Import it from the framework,
not the app barrel — `@/types` is this portal's own barrel and does not re-export it:

```ts
import type { AppRoute } from "@framework/types/routing";
```

```ts
type AppRoute = {
  path: string;
  element: React.ReactNode;
  access?: "public" | "authenticated"; // default: "authenticated"
  requiredRole?: string | string[]; // omit for non-role-restricted routes
  layout?: "default" | "none"; // omit to use default layout
};
```

---

## What NOT to do

- Do not add JSX route elements directly in AppRouter.tsx
- Do not wrap the page component in a layout inside the page file
- Do not hardcode role strings — use the ROLES constants from src/lib/constants (`@/lib/constants`)
- Do not use export default in page components
- Do not add `loader`, `action`, or `shouldRevalidate` to a route — React Router v8's data mode
  (`createBrowserRouter`) supports them, but this repo's only sanctioned data path is
  Pages → Hooks → Services; fetch and mutate through a hook in the page component, never a route
