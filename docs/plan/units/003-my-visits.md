---
id: U003
slug: my-visits
title: My visits
status: draft
kind: datatable
tier: leaf
area: visitor
route: /visits
access: protected
required_role: ROLES.STAFF
layout: default
template: null
template_props: null
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: [U001]
gate: required
owner: null
branch: null
estimate_files: 4
blocked_reason: null
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

The Staff-facing view: two tables (active visits, past visits) scoped to visits where the signed-in
user is the host. Each row's equipment expands inline via `DataTable`'s `renderExpanded` — no side
sheet, no second route (`platform/src/components/ui/datatable/DataTable.tsx` already supports this;
its own doc comment names a nested table as a valid expanded-panel shape). Active rows carry a
`Log exit` action behind `ConfirmDialog`.

Builds the shared `src/components/Visits/VisitTables.tsx` that U004 (all visits) also renders, and
`VisitColumns.tsx`. Scope for this page comes from `useAuth().currentUser.organizationUserId`
passed as `listVisits({ scope: "mine", hostId })`; RLS (`is_current_host`) enforces the same
boundary server-side regardless of what the client sends.

Creates `src/routes/modules/visits.routes.tsx` — U004 and U005 append to this same file rather than
creating their own, since all three routes are the one `visitor` nav area.

## Data source

`listVisits`, `logVisitExit` from `src/services/visitor.ts` (U001) via
`src/hooks/visitor/useVisits.ts` / `useVisitMutations.ts`. No new service or hook file. staleTime
tier: TBD at spec time (active visits likely shorter than past visits).

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |

## Validation

n/a — read-only view; the only mutation (`Log exit`) is a row action, not a form.

## Layout

Two `DataTable`s (active, past) on one page — arrangement confirmed against the template chosen at
spec time. Only what differs from that template goes here.

## Actions

| Action | Trigger | Confirmation | Effect | On success | On failure |
| --- | --- | --- | --- | --- | --- |

## States

- **Empty:**
- **Loading:**
- **Error:**
- **Permission-limited:**
- **Post-mutation:**

## Permissions

`access: protected`, `required_role: ROLES.STAFF`. Row-level scope to "my visits" is enforced by
RLS (`is_current_host`), not just by the query the client sends.

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

None.
