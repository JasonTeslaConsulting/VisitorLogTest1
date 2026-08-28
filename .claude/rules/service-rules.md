---
paths:
  - src/services/**
  - platform/src/services/**
---

# Rules: services (`src/services/` app-owned, `platform/src/services/` framework-owned)

Files in either directory must follow these rules without exception. The framework's own services
(`auth`, `menu`, `roles`, `screens`, `users` — `docs/architecture/user-administration.md`) live at
`platform/src/services/`; an app's services live at `src/services/`.

- Import supabase only from the client module — `@framework/integrations/supabase/client` in an app
  service, `@framework/integrations/supabase/client` in a framework one (same single client
  instance either way; only the alias differs, since `client.ts` itself is framework-owned)
- Define RawX types locally — never export them
- Map all return values to camelCase types before returning
- Mapper functions named `mapX` (e.g. `mapUser`, `mapOrganization`)
- Clean return types imported from the domain's type file directly — `src/types/<domain>.ts` for
  an app service, `@framework/types/<domain>` for a framework one
- No React imports, no hooks, no UI logic
- Every function must throw on error — never return null or undefined for failures
- Use `throw new Error(error.message)` not `console.error` and return
- Service files are named `<domain>.ts` (e.g. `menu.ts`, `users.ts`) — not `<domain>Service.ts`
- `supabase.auth.getUser()` is allowed here to stamp audit fields (`createdby`/`modifiedby`)
- Auth _flows_ (login, logout, OTP, password) live in `AuthContext`, never in a service

## Mock-data mode (`data_mode: mock` units — see `docs/plan/README.md`)

- `src/services/fixtures/<domain>.ts` is the one import besides `@framework/integrations/supabase/client`
  a service file may have — a mock service returns typed data from its domain's fixture file
  through the exact same `mapX()` contract and return types the real (`live`) implementation
  would use, so hooks, pages, and types never differ between mock and real
- No runtime toggle (env flag, feature flag) between mock and real — a service file is either
  mock or real, never both; keeping both paths alive forever is how a mock silently ships to
  production
- Every mock function carries a marker comment naming the unit and pointing at its spec, e.g.
  `// MOCK(U003): replace with a Supabase query — see docs/plan/units/003-user-directory.md` — this
  is what `npm run docs:check` scans for to keep the debt visible

## Server-side table queries (`DataTable`'s default `mode="server"`)

A data-table page's service function takes the table's state and returns one page plus a total, so
`DataTable` can render pagination without holding the whole dataset:

```ts
type ListVendorsParams = {
  page: number;        // 1-based, straight from useTableState
  perPage: number;
  search?: string;
  filters?: Record<string, string | null>;
  sort?: { field: string; direction: "asc" | "desc" } | null;
};

export async function listVendors(
  params: ListVendorsParams,
): Promise<{ rows: Vendor[]; count: number }> {
  const from = (params.page - 1) * params.perPage;
  const to = from + params.perPage - 1;

  let query = supabase
    .from("...")
    .select("...", { count: "exact" }); // count: "exact" — DataTable needs the true total

  if (params.search) query = query.ilike("vendorname", `%${params.search}%`);
  if (params.filters?.status) query = query.eq("status", params.filters.status);
  if (params.sort)
    query = query.order(params.sort.field, {
      ascending: params.sort.direction === "asc",
    });

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { rows: (data as RawVendor[]).map(mapVendor), count: count ?? 0 };
}
```

- Always `{ count: "exact" }` — without it `count` is null and pagination can't size itself
- `.range()` is inclusive on both ends, so `to` is `from + perPage - 1`, not `+ perPage`
- `params.sort.field` is the column's `id` from `DataTableColumn` — keep those ids equal to the DB
  column names so no translation table is needed
- Return `{ rows, count }`, never a bare array — the hook passes `count` to `DataTable`'s
  `totalItems`
- The hook's query key includes every param, so changing page/search/filter/sort refetches:
  `queryKey: ["vendors", params]`
