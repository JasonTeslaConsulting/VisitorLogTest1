---
id: U006
slug: users-domain-foundation
title: Users domain foundation
status: spec-ready
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
spec_source: 2026-09-01
touches:
  routes: []
  types: [src/types/users.ts]
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

**Unlike the framework's own `getUsers()`/`getRoles()`, every export here maps to camelCase**
(`RawX` types local, `mapX` mappers), matching this app's own established convention
(`src/services/visitor.ts`) rather than the framework service's raw lowercase passthrough — so
U007/U008's pages consume the same clean-type shape every other page in this app already does.

## Data source

`_secure.organizationuser`, `_secure.applicationuser`, `_secure.applicationuserrole`,
`_secure.role`, `_secure.organization` (all existing, no new tables).

**`src/types/users.ts`** — new file:

```ts
export type PortalUserRole = {
  applicationUserRoleId: string;
  roleId: string;
  roleName: string;
};

export type PortalUser = {
  organizationUserId: string;
  fullName: string;
  displayName: string | null;
  primaryEmail: string;
  employmentStartDate: string;
  employmentEndDate: string | null;
  /** null until a Supabase auth account exists — created out-of-band, not by this app. */
  applicationUserId: string | null;
  authUserId: string | null;
  roles: PortalUserRole[];
};

export type AssignableRole = {
  roleId: string;
  roleName: string;
};

export type AddPortalUserPayload = {
  fullName: string;
  primaryEmail: string;
  /** _secure.organizationuser.employmentstartdate is NOT NULL. */
  employmentStartDate: string;
  /** Optional — a Supabase auth account may not exist yet at creation time. */
  authUserId?: string;
};
```

**`src/services/users.ts`** — new file, per `.claude/rules/service-rules.md`:

- `listUsers(): Promise<PortalUser[]>` — calls the framework's `getUsers()`
  (`@framework/services/users`) and maps its nested raw result (`organizationuser` →
  `applicationuser` → `applicationuserrole` → `role`) into `PortalUser[]`; a user with no
  `applicationuser` row yet maps to `applicationUserId: null`, `authUserId: null`, `roles: []`.
- `listAssignableRoles(): Promise<AssignableRole[]>` — calls the framework's `getRoles()`
  (the simple `{roleid, rolename}` list in `@framework/services/users`, **not**
  `platform/src/services/roles.ts`'s richer version with `rolescreen` — U008 uses that one
  directly, unwrapped, for its own permission-matrix needs).
- `addPortalUser(payload: AddPortalUserPayload): Promise<{ organizationUserId: string; applicationUserId: string }>`
  — looks up the single `_secure.organization` row internally first (`select organizationid ...
  limit(1).single()` — this app is single-tenant per `app.md`, so U007's form never needs an
  organization field), then inserts `organizationuser` then `applicationuser` — the same two-step
  pattern as the framework's `addUser`, but with `authuserid` optional (`payload.authUserId ??
  null`) instead of required.
- `deactivateUser(organizationUserId: string): Promise<void>` — sets
  `organizationuser.employmentenddate` to today (date-only, `YYYY-MM-DD`). This is the only gate
  `resolveCurrentUser()` checks (`docs/architecture/auth.md`), so this alone locks the user out on
  their next request. **Does not touch `applicationuserrole` rows** — they're left in place;
  `resolveCurrentUser()`'s employment-date check is what blocks login regardless of what roles
  remain assigned, and leaving them means a future "reactivate" wouldn't need to reassign
  everything from scratch.
- `assignRole({ applicationUserId, roleId }): Promise<void>` — wraps the framework's
  `addRoleToUser` with camelCase params.
- `unassignRole(applicationUserRoleId: string): Promise<void>` — wraps the framework's
  `removeRoleFromUser`.

**Hooks:**

- `src/hooks/users/useUsers.ts` — `useUsers()` wrapping `listUsers` (`queryKey: ["users"]`,
  `staleTime: STALE_TIMES.STANDARD`), `useAssignableRoles()` wrapping `listAssignableRoles`
  (`queryKey: ["assignableRoles"]`, `staleTime: STALE_TIMES.STATIC`).
- `src/hooks/users/useUserMutations.ts` — `useAddPortalUser()`, `useDeactivateUser()`,
  `useAssignRole()`, `useUnassignRole()`, each wrapping its same-named service function and
  invalidating the `["users"]` queryKey `onSuccess`.

## Fields

n/a — foundation unit, no page. See `## Data source` for the full type/function contract.

## Validation

n/a — foundation unit; validation schemas belong to U007's form.

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

- `src/types/users.ts`
- `src/services/users.ts`
- `src/hooks/users/useUsers.ts`
- `src/hooks/users/useUserMutations.ts`

### Modifying shared files

(none)

### Reusing

- `@framework/services/users` — `getUsers`, `getRoles` (the simple list), `addRoleToUser`,
  `removeRoleFromUser` — wrapped, not re-exported unchanged
- `@framework/integrations/supabase/client`, `@framework/lib/constants/app` (`STALE_TIMES`)

### Not doing

- No barrel edits to `src/types/index.ts` — same convention as U001 (new domains import directly)
- No reactivate function — out of scope; `app.md`'s permission matrix only lists "deactivate"
- No changes to `platform/src/services/users.ts` or any other framework file
- No UI, no page — that's U007/U008

## Open questions

(none)

## Deviations

Everything shipped exactly as specified: all four files created, every export mapped to camelCase
(`RawX` local, `mapX` mappers) matching `visitor.ts`'s convention rather than the framework
service's raw passthrough, `addPortalUser` hand-rolled (not wrapping the framework's `addUser`,
whose `authuserid` param is typed required) with the single-organization lookup, `deactivateUser`
leaving role assignments untouched. VERIFY passed clean after one `prettier --write` pass on
`users.ts` (the subagent's output); no other retry was needed. No live browser check — this is a
foundation unit with no page or route.

