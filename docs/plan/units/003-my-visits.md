---
id: U003
slug: my-visits
title: My visits
status: spec-ready
kind: datatable
tier: leaf
area: visitor
route: /visits
access: protected
required_role: ROLES.STAFF
layout: default
template: single-card
template_props: { width: wide, headerPlacement: above }
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: [U001]
gate: required
owner: null
branch: null
estimate_files: 4
blocked_reason: null
spec_source: 2026-09-01
touches:
  routes: [src/routes/modules/visits.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: []
  pages: [src/pages/Visits.tsx]
  components:
    [src/components/Visits/VisitTables.tsx, src/components/Visits/VisitColumns.tsx]
  shared_ui: []
  tokens: false
---

## Purpose

The Staff-facing view: **Active Visits** and **Past Visits** as two tabs (`Tabs`/`TabsList`/
`TabsTrigger`/`TabsContent`, `platform/src/components/ui/tabs.tsx`) inside one `single-card`,
`width: wide` page — not two stacked tables. Each is its own `DataTable` with its own
`useTableState()`, independent pagination/search/sort. Scoped to visits where the signed-in user is
the host; RLS (`is_current_host`) enforces this regardless of what the client sends.

Each row's equipment expands inline (`renderExpanded`, `expandMode: "single"` — opening one row
closes the last). The expanded panel also shows contact info (email, mobile + dial code) and the
two consent flags — read-only detail the row already carries, so no side sheet, no second fetch.
Active rows carry a **Log exit** action behind `ConfirmDialog`.

Builds the shared `src/components/Visits/VisitTables.tsx` and `VisitColumns.tsx` that U004 (all
visits) also renders — `VisitColumns.tsx` takes a `showHost` boolean so U004 can reuse it with the
host column shown, `false`/omitted here. Creates `src/routes/modules/visits.routes.tsx`; U004 and
U005 append to this same file.

## Data source

`listVisits`, `logVisitExit` from `src/services/visitor.ts` (U001), via
`src/hooks/visitor/useVisits.ts` (`useVisits`) and `useVisitMutations.ts` (`useLogVisitExit`). Also
`useVisitPurposes()` (`useVisitLookups.ts`) to resolve `visitPurposeId` → display name client-side —
no embed, per U001's `## Purpose` note that `visitorregister` has no declared FK to `referencedata`.
No new service or hook file.

Two independent `useVisits` calls, one per tab: `{ status: "active", ... }` and
`{ status: "past", ... }`. `staleTime`: `FREQUENT` for the active query, `STATIC` for the past
query — both already the defaults baked into `useVisits`'s `params.status` branch (U001), so no
override needed here.

## Fields

**Table columns** (both tabs, via `VisitColumns.tsx`):

| Field | Type | Source column | Display | Notes |
| --- | --- | --- | --- | --- |
| Full name | text | `visitorregister.fullname` | plain, sortable | default sort `entrydate desc` |
| Organization | text | `visitorregister.organization` | plain | — |
| Purpose | text | `visitorregister.visitpurposeid` | plain | resolved to a name via `useVisitPurposes()`, not the raw id |
| Entry | datetime | `visitorregister.entrydate` | plain, sortable | — |
| Exit | datetime | `visitorregister.exitdate` | plain, sortable | **Past tab only** — omitted from the Active columns entirely, not shown blank |
| Equipment | count | `visitorequipment` (length) | plain, e.g. "2 items" / "—" | drives `canExpand` — no chevron when the count is 0 |

**Expanded panel** (`renderExpanded`, both tabs): email, mobile number (formatted as
`{countryDialCode} {mobileNumber}` when a dial code id is present, else the raw number, else "—"),
privacy-policy-read and video-consent as two read-only yes/no rows, then the full equipment list
(item type name, description, quantity, serial number) as a small `InfoTable` or plain list — no
side sheet, no second fetch, all already on the row.

Search (both tabs): full name only, matching U002's convention. Page size: 25 (skeleton default).
No filter sheet — a host's own visits are already narrow enough that a filter adds nothing; no
scope selector either, since there's nothing to select (always "me").

## Validation

n/a — read-only view; the only mutation (`Log exit`) is a row action, not a form.

## Layout

`single-card`, `width: "wide"`, `headerPlacement: "above"` (the template default), title "My
Visits". Everything inside `children` is the `Tabs` block: `TabsList` with "Active Visits" /
"Past Visits" triggers, `defaultValue="active"`, each `TabsContent` holding one `DataTable`.
Switching tabs does not reset or affect the other tab's table state. No subtitle — the two tab
labels already say what the page is for.

## Actions

| Action | Trigger | Confirmation | Effect | On success | On failure |
| --- | --- | --- | --- | --- | --- |
| Log exit | Row action, Active tab only | `ConfirmDialog`: "Log [visitor's full name] out? This marks their visit as ended and moves it to Past Visits." | `useLogVisitExit()` with `exitLoggedBy: currentUser.organizationUserId` | `toast.success("Visit ended")`; invalidates `["visits"]`, row disappears from Active (RLS/query still returns it correctly to the Past tab on next load) | `toast.error(error.message)`, row stays as-is |

Stays on the Active tab after a successful Log exit — no auto-switch to Past.

## States

- **Empty:** `EmptyState` per tab — "No active visits" (Active tab, no CTA — a host doesn't create
  visits, visitors do via `/register`) and "No past visits" (Past tab, no CTA).
- **Loading:** `DataTable`'s built-in `TableSkeleton`, independently per tab.
- **Error:** `toast.error` on a failed `listVisits`/`logVisitExit` call; the table keeps its last
  good data rather than blanking.
- **Permission-limited:** n/a on this page itself — a non-`Staff` user never reaches `/visits` at
  all (`ProtectedRoute` bounces them before render).
- **Post-mutation:** see Actions — toast + query invalidation, no navigation.

## Permissions

`access: protected`, `required_role: ROLES.STAFF`. Row-level scope to "my visits" is enforced by
RLS (`is_current_host`), not just by the query the client sends — `hostId` is never passed from
this page (unlike U004's optional filter), since `listVisits` with no `hostId` already returns only
what RLS allows a Staff-role caller to see.

## Files

### Creating

- `src/pages/Visits.tsx`
- `src/components/Visits/VisitTables.tsx`
- `src/components/Visits/VisitColumns.tsx`
- `src/routes/modules/visits.routes.tsx`

### Modifying shared files

(none)

### Reusing

- `listVisits`, `logVisitExit`, `useVisits`, `useLogVisitExit`, `useVisitPurposes` — all from U001
- `platform/src/templates/SingleCardTemplate`, `platform/src/components/ui/tabs.tsx`
  (`Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`)
- `DataTable`, `useTableState`, `ConfirmDialog`, `EmptyState`, `InfoTable`
- `@framework/contexts/AuthContext`'s `useAuth()` for `currentUser.organizationUserId`

### Not doing

- No filter sheet, no scope selector — see `## Fields`
- No side sheet for equipment/contact detail — expands inline instead
- No host column — that's U004's `showHost: true` variant of the same `VisitColumns.tsx`
- No auto-switch to the Past tab after Log exit

## Open questions

(none)

## Deviations

- **`AppRoute.access` has no `"protected"` value** — the type is `"public" | "authenticated"`;
  `requiredRole` alone implies `"authenticated"` and adds the role guard. `visits.routes.tsx` sets
  only `requiredRole: ROLES.STAFF`, which is the correct way to express this unit's
  `access: protected` frontmatter (a unit-template term, not a literal `AppRoute` field value).
- **`getVisitColumns()` does not take a `showHost` parameter yet**, despite the spec naming one for
  U004's future reuse. The subagent omitted it as an unused parameter this unit doesn't need;
  U004 will add it when it extends this file for the host column — a normal "modifying shared
  files" change for that unit, not a gap in this one.
- **Log exit uses its own `ConfirmDialog`** (in `VisitTables.tsx`) rather than `RowActionsCell`'s
  built-in destructive-confirm path (marking the `RowAction` `destructive: true`), since the spec's
  exact wording ("Log [visitor's full name] out? This marks their visit as ended and moves it to
  Past Visits.") is more specific than the generic message `RowActionsCell` would generate.
- **Caught and fixed during review, before commit:** the "Log exit" `RowAction` had no `icon`, so
  `RowActionsCell`'s single-action path (`action.icon ?? PiWarning`) would have rendered a caution
  triangle on a routine action. Added `icon: PiSignOut`.
- Everything else shipped exactly as specified: tabs (not stacked tables), independent
  `useTableState`/`useVisits` per tab, `expandMode="single"`, purpose/equipment-type name
  resolution via the existing U001 lookup hooks, per-tab `EmptyState` with no CTA, Active-tab-only
  row action, no auto-tab-switch. VERIFY passed clean after one `prettier --write` pass (the
  subagent's output, then again after the icon fix); no other retry was needed. Confirmed live in
  the browser via `VITE_DEV_AUTH` — tabs render, columns are correct per tab (Past shows Exit,
  Active doesn't), no console errors beyond the expected dev-bypass network 401s.
