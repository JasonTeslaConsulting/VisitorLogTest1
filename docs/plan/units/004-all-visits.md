---
id: U004
slug: all-visits
title: All visits
status: draft
kind: datatable
tier: leaf
area: visitor
route: /visits/manager
access: protected
required_role: ROLES.OFFICE_MANAGER
layout: default
template: null
template_props: null
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: [U003]
gate: required
owner: null
branch: null
estimate_files: 1
blocked_reason: null
touches:
  routes: [src/routes/modules/visits.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: []
  pages: [src/pages/VisitsManager.tsx]
  components: []
  shared_ui: []
  tokens: false
---

## Purpose

The Office Manager's view of every visit, regardless of host. Deliberately thin: renders U003's
shared `<VisitTables scope="all">` with a host `FilterSheet` added, and appends one route entry to
the `visits.routes.tsx` module U003 created. RLS (`is_visitor_admin()`) is what actually widens the
result set past "my visits" — the client-side `scope` prop only changes what's requested and
displayed (host column, host filter), not what's authorized.

## Data source

Same as U003 — `listVisits({ scope: "all", filters: { hostId } })` via U001's hooks/service. No new
files there; this unit's only new file is the page itself.

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |

Adds a host column (hidden on the Staff page, shown here) — confirmed at spec time whether
`VisitColumns.tsx` takes a `showHost` prop or this page supplies its own column set.

## Validation

n/a — read-only view; `Log exit` is a row action, not a form.

## Layout

Same two-table arrangement as U003, plus a host filter in `FilterSheet` per DESIGN.md's
scope-vs-filter distinction (host narrows within the dataset — a filter, not a scope, since "all
hosts" is a valid default state).

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

`access: protected`, `required_role: ROLES.OFFICE_MANAGER`. RLS (`is_visitor_admin()`) is the real
boundary; the route guard only controls who can reach the page.

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

None.
