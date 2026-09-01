---
id: U006
slug: users-domain-foundation
title: Users domain foundation
status: draft
kind: infra
tier: foundation
area: admin
route: null
access: authenticated
required_role: null
layout: default
template: null
template_props: null
domain: users
data_mode: live
entities: [organizationuser, applicationuser, applicationuserrole, role]
depends_on: []
gate: required
owner: null
branch: null
estimate_files: 4
blocked_reason: null
touches:
  routes: []
  types: [src/types/users.ts, src/types/index.ts]
  constants: []
  services: [src/services/users.ts]
  hooks: [src/hooks/users/useUsers.ts, src/hooks/users/useUserMutations.ts]
  pages: []
  components: []
  shared_ui: []
  tokens: false
---

## Purpose

Shared foundation for the two admin pages (U007 user management, U008 roles & permissions).
`platform/src/services/users.ts` is framework-owned, read-only in this portal, and cannot serve
this app as-is: its `addUser` types `authuserid` as required, but the user made
`_secure.applicationuser.authuserid` nullable (Supabase auth accounts are created out-of-band, not
by this app), and there is no deactivate function at all. Per `CLAUDE.md`'s "extend it from app
code" rule, this unit adds an app-owned `src/services/users.ts` — never edits the framework file.

`src/services/users.ts` re-exports/wraps `getUsers`, `getRoles`, `addRoleToUser`,
`removeRoleFromUser` from `@framework/services/users` unchanged, and adds:

- `addPortalUser(payload)` — same shape as the framework's `addUser` but with `authuserid`
  optional, inserting `organizationuser` then `applicationuser`
- `deactivateUser(organizationuserid)` — sets `organizationuser.employmentenddate` to today. This
  is the only gate `resolveCurrentUser` checks (`docs/architecture/auth.md`), so this alone is
  sufficient to lock a deactivated user out on their next request

`src/types/users.ts` holds the app-specific payload types (`AddPortalUserPayload`,
`DeactivateUserPayload`) — distinct from and re-using `@framework/types/users`'s `OrgUser`/
`ApplicationUser`/`ApplicationUserRole`, not duplicating them.

## Data source

`_secure.organizationuser`, `_secure.applicationuser`, `_secure.applicationuserrole`,
`_secure.role` (all existing). No new tables.

## Fields

n/a — foundation unit, no page.

## Validation

n/a — foundation unit; validation schemas belong to U007/U008's forms.

## Layout

n/a — foundation unit, no page.

## Actions

n/a — foundation unit, no page.

## States

n/a — foundation unit, no page.

## Permissions

n/a — foundation unit; enforced by each consuming page's own route guard and by `_secure`'s
existing RLS.

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

None.
