---
id: U005
slug: on-site-today
title: On site today
status: draft
kind: dashboard
tier: leaf
area: visitor
route: /visits/today
access: protected
required_role: ROLES.OFFICE_MANAGER
layout: default
template: null
template_props: null
domain: visitor
data_mode: live
entities: [visitorregister]
depends_on: [U003]
gate: required
owner: null
branch: null
estimate_files: 3
blocked_reason: null
touches:
  routes: [src/routes/modules/visits.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: [src/hooks/visitor/useOnSiteToday.ts]
  pages: [src/pages/VisitsToday.tsx]
  components: [src/components/Visits/OnSiteSummary.tsx]
  shared_ui: []
  tokens: false
---

## Purpose

A reception-facing snapshot for the Office Manager: who is currently on site (entrydate today,
exitdate null), a headcount, and anyone still checked in past a configurable "overdue" point.
Appends one more route to `visits.routes.tsx` (created by U003).

Adds `src/hooks/visitor/useOnSiteToday.ts` because this is an aggregation query distinct from
`listVisits`'s paged list — count and a compact "currently on site" list, not a full table with
search/sort/pagination. No new service function is assumed yet; whether this needs its own
`src/services/visitor.ts` export (e.g. `getOnSiteToday()`) or can be derived client-side from
`listVisits` is decided at spec time.

## Data source

TBD at spec time — either a new `getOnSiteToday()` export on U001's `src/services/visitor.ts`, or
a client-side derivation from `listVisits`. staleTime should be short (this is a "right now" view).

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |

## Validation

n/a — read-only dashboard.

## Layout

Template (`card-grid` or `stacked-card`) chosen at spec time — a headcount/summary card plus a
compact list, per the interview's "Today dashboard" answer.

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

`access: protected`, `required_role: ROLES.OFFICE_MANAGER`.

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

None.
