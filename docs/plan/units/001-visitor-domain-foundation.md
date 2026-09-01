---
id: U001
slug: visitor-domain-foundation
title: Visitor domain foundation
status: draft
kind: infra
tier: foundation
area: visitor
route: null
access: authenticated
required_role: null
layout: default
template: null
template_props: null
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: []
gate: required
owner: null
branch: null
estimate_files: 5
blocked_reason: null
touches:
  routes: []
  types: [src/types/visitor.ts, src/types/index.ts]
  constants:
    [
      src/lib/constants/visitor.ts,
      src/lib/constants/roles.ts,
      src/lib/constants/index.ts,
    ]
  services: [src/services/visitor.ts]
  hooks: [src/hooks/visitor/useVisits.ts, src/hooks/visitor/useVisitMutations.ts]
  pages: []
  components: []
  shared_ui: []
  tokens: false
---

## Purpose

Shared foundation for every visitor-log page: types, constants, the one `visitor` domain service,
and its hooks. Touched by U002 (public registration), U003 (my visits), U004 (all visits), and
U005 (on-site today) — built once here so none of those four units duplicates it.

`src/services/visitor.ts` covers, per `.claude/rules/service-rules.md` (local `RawX` types, `mapX`
mappers, camelCase return types, throw on error):

- `listVisits({ page, perPage, search, filters, sort, scope })` → `{ rows, count }`, `scope`
  distinguishing "mine" (RLS `is_current_host` narrows it regardless) from "all" (office manager,
  RLS `is_visitor_admin`); embeds `visitorequipment(*)` for each row so the table's expandable row
  needs no second fetch
- `logVisitExit(visitorregisterid)` — sets `exitdate`/`exitloggedby`/`exitloggeddate`
- `createVisit(payload)` — the public registration path; inserts `visitorregister` +
  `visitorequipment` rows via the anon RLS policies in `docs/plan/db-setup.md`
- `listVisitHosts()`, `listVisitPurposes()`, `getPolicyText()` — call the two
  `public.list_visit_hosts()` / `public.list_visit_purposes()` SECURITY DEFINER RPCs and read
  `_sysconfig.configurationsetting`, all reachable by `anon`

`src/hooks/visitor/useVisits.ts` wraps `listVisits` plus the three read-only lookups above (one
file, several exported hooks — all served by the same domain); `useVisitMutations.ts` wraps
`logVisitExit` and `createVisit`.

`src/lib/constants/roles.ts` is also seeded here with `STAFF`, `OFFICE_MANAGER`, `USER_ADMIN` —
values must equal `_secure.role.rolename` exactly (`resolveCurrentUser` builds `roles[]` from
`rolename`, and route guards compare against it).

## Data source

Tables: `_visitor.visitorregister`, `_visitor.visitorequipment` (existing — see
`docs/plan/db-setup.md` for the exposed-schema/grant/RLS work needed before this unit can read or
write anything). Lookups: `public.list_visit_hosts()`, `public.list_visit_purposes()` (RPC),
`_sysconfig.configurationsetting` (policy/consent text). staleTime tier: TBD at spec time.

## Fields

n/a — foundation unit, no page.

## Validation

n/a — foundation unit; validation schemas belong to the pages that use these types.

## Layout

n/a — foundation unit, no page.

## Actions

n/a — foundation unit, no page.

## States

n/a — foundation unit, no page.

## Permissions

n/a — foundation unit; enforced by the RLS policies in `docs/plan/db-setup.md` and by each
consuming page's own route guard.

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

None.
