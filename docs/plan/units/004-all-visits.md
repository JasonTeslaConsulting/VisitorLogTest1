---
id: U004
slug: all-visits
title: All visits
status: spec-ready
kind: datatable
tier: leaf
area: visitor
route: /visits/manager
access: protected
required_role: ROLES.OFFICE_MANAGER
layout: default
template: single-card
template_props: { width: wide, headerPlacement: above }
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: [U003]
gate: required
owner: null
branch: null
estimate_files: 1
blocked_reason: null
spec_source: 2026-09-01
touches:
  routes: [src/routes/modules/visits.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: []
  pages: [src/pages/VisitsManager.tsx]
  components:
    [src/components/Visits/VisitTables.tsx, src/components/Visits/VisitColumns.tsx]
  shared_ui: []
  tokens: false
---

## Purpose

The Office Manager's view of every visit, regardless of host — same Active/Past tabs as U003, with
a Host column added and an independent host filter per tab. RLS (`is_visitor_admin()`) is what
actually widens the result set past "my visits"; `scope="all"` only changes what's requested and
displayed.

Extends U003's shared `VisitTables`/`VisitColumns` rather than forking them:

- `VisitTables` takes a new `scope?: "mine" | "all"` prop (default `"mine"`, so U003 is unaffected).
  When `"all"`: each tab's `DataTable` gets a `filterSheet` with a host `Combobox` (matching
  `useVisitHosts()`'s Combobox in U002's registration form), bound to that tab's own
  `state.draftFilters.hostId`/`setDraftFilter`/`applyFilters` — **independent per tab**, not a
  single filter shared across both (a host applied on Active does not carry over to Past). This is
  the standard `useTableState`/`FilterSheet` draft-then-apply pattern, not a bespoke one — no new
  state mechanism needed.
- `getVisitColumns()` takes a new `showHost?: boolean` and `hostNameById?: Map<string, string>`
  (mirroring `purposeNameById`'s shape). When `showHost`, inserts a Host column resolved the same
  way Purpose already is. `useVisitHosts()` is called once in `VisitTables` (only when
  `scope === "all"`) and its result feeds both the column and both tabs' filter option lists.

Only one new file: `src/pages/VisitsManager.tsx`. Appends one route to `visits.routes.tsx` (U003
created it).

## Data source

Same as U003 — `listVisits`, `logVisitExit`, `useVisits`, `useLogVisitExit` from U001, plus
`useVisitHosts()` (`useVisitLookups.ts`, already exists) for the host column/filter. `listVisits`
already accepts `hostId?: string` (U001's `ListVisitsParams`) — each tab passes its own
`state.filters.hostId` into its `useVisits({ ..., hostId })` call. No new service or hook file.

## Fields

Same columns as U003 (`## Fields` there), plus:

| Field | Type | Source column | Display | Notes |
| --- | --- | --- | --- | --- |
| Host | text | `visitorregister.hostid` | plain | resolved via `useVisitHosts()`, inserted after Organization, before Purpose |

Filter (per tab, in that tab's `FilterSheet`): Host — `Combobox` over `useVisitHosts()`'s options,
optional, clearable (`FilterSheet`'s own Clear all).

## Validation

n/a — read-only view; `Log exit` is a row action, not a form.

## Layout

Identical to U003's tabs arrangement (`single-card`, `width: "wide"`, title "All Visits"). The only
addition is each `DataTable`'s `filterSheet` prop — no new page-level layout element, since the
filter lives in each table's own existing toolbar slot.

## Actions

Identical to U003's Log exit action (`## Actions` there) — unchanged, reused as-is from
`VisitTables`.

## States

Same as U003, plus: applying a host filter with zero matching rows shows the same empty-state text
as an unfiltered empty tab ("No active visits" / "No past visits") — not filter-aware copy, kept
simple rather than adding a variant not otherwise requested.

## Permissions

`access: protected`, `required_role: ROLES.OFFICE_MANAGER`. RLS (`is_visitor_admin()`) is the real
boundary; the route guard only controls who can reach the page.

## Files

### Creating

- `src/pages/VisitsManager.tsx`

### Modifying shared files

- `src/components/Visits/VisitTables.tsx` — add `scope` prop, per-tab host `FilterSheet` when
  `scope === "all"`, one `useVisitHosts()` call gated on that scope
- `src/components/Visits/VisitColumns.tsx` — add `showHost`/`hostNameById` params, insert the Host
  column when `showHost` is true
- `src/routes/modules/visits.routes.tsx` — append the `/visits/manager` route

### Reusing

- Everything U003 already built: `listVisits`, `logVisitExit`, `useVisits`, `useLogVisitExit`,
  `useVisitPurposes`, `useEquipmentItemTypes`, plus now `useVisitHosts()` (existing, unused until
  now)
- `FilterSheet`, `Combobox` — same components U002's form already uses for the host picker

### Not doing

- No shared/single host filter across both tabs — each tab's filter is independent, per the
  standard per-DataTable `FilterSheet` pattern
- No filter-aware empty-state copy
- No new service, hook, or type files

## Open questions

(none)

## Deviations

None.
