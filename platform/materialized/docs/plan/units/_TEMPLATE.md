---
id: U000
slug: unit-slug
title: Unit title
status: draft # draft|spec-ready|approved|building|pr-open|blocked — see docs/plan/README.md
kind: datatable # datatable|form|detail|dashboard|infra|design
tier: leaf # foundation|leaf
area: admin # LANE KEY — matches src/routes/modules/<area>.routes.tsx
route: /admin/example # null for kind: infra|design
access: protected # public|authenticated|protected
required_role: null # required iff access: protected, e.g. ROLES.USER_ADMIN
layout: default # default|none
template: null # registry id from platform/src/templates/registry.ts — required before spec-ready
  # unless kind is infra|design. Templates are named by arrangement, never by
  # job — match on the holes the page needs, not on this unit's `kind`
template_props: null # a value for each of that entry's `options` keys, e.g. {width: narrow}
domain: example # drives src/services/<domain>.ts, src/types/<domain>.ts
data_mode: live # live|mock — see .claude/rules/service-rules.md
entities: []
depends_on: [] # unit ids that must be merged to origin/main first
gate: required # required|skipped — copied from app.md at creation
owner: null
branch: null # set once status: building
estimate_files: 0 # >5 files means split this unit
blocked_reason: null
touches:
  routes: []
  types: []
  constants: []
  services: []
  hooks: []
  pages: []
  components: []
  shared_ui: [] # must be empty unless tier: foundation
  tokens: false # must be false unless tier: foundation
---

## Purpose

One paragraph: what the user does here and why.

## Data source

Table/view/RPC (exists or needs creating), service path + signature (reuse or new), hook path
(reuse or new), staleTime tier.

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |

## Validation

Forms only — per-field and cross-field rules. Write "n/a — read-only view" rather than omitting.

## Layout

Only what differs from the template named in `template:` — it already owns header placement and card
wrapping (page-edge padding and max content width are `PageLayout`'s job, not the template's —
DESIGN.md §7). Record section order, filter placement and responsive deviations here; never
re-describe the frame.

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

Who sees the route, who sees each action, what a lower role sees (hidden vs disabled).

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

Written at COMMIT, **after** the unit is built — everything above this line is intent agreed at the
gate, and this is the only section recording what actually shipped. Write `None.` when the unit built
exactly as specified, so silence is a recorded fact rather than a gap.

Record, one bullet each: anything in `## Files` that could not be done and why, any shape the spec
assumed that the real schema or a framework component didn't support, and any workaround left in
place. If a VERIFY retry was needed, say what failed the first time.

This is what makes the spec safe to regenerate from. Without it a unit that shipped a workaround
reads as if it shipped clean, and the next regeneration walks into the same wall.
