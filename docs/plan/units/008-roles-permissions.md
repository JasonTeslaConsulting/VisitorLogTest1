---
id: U008
slug: roles-permissions
title: Roles & permissions
status: blocked
kind: form
tier: leaf
area: admin
route: /admin/roles
access: protected
required_role: ROLES.USER_ADMIN
layout: default
template: null
template_props: null
domain: users
data_mode: live
entities: [role, rolescreen, screen]
depends_on: [U007]
gate: required
owner: null
branch: null
estimate_files: 3
blocked_reason: "Descoped 2026-09-01 — roles/permissions are setup data, edited directly in the database (see app.md's Out of scope list and db-setup.md §9)."
touches:
  routes: [src/routes/modules/admin.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: [src/hooks/users/useRoleScreens.ts]
  pages: [src/pages/RolePermissions.tsx]
  components: [src/components/RolePermissions/PermissionMatrix.tsx]
  shared_ui: []
  tokens: false
---

## Purpose

**Descoped, not built — see `blocked_reason` above.** During this unit's spec-page interview, the
user decided roles and their screen-level permissions should be setup data, edited directly in the
database — the same way `_sysconfig`'s policy/consent text already is — rather than through an
in-app matrix. This section records the original plan intact, as the reason the unit was decomposed
this way in the first place; it was never built.

Original purpose: a role × screen permission matrix, entirely reusing existing framework CRUD
rather than building new services: `platform/src/services/roles.ts` (`upsertRoleScreen`,
`deleteRoleScreen`), `platform/src/services/screens.ts` (`getScreens`), and `PERMISSION_OPTIONS`
from `platform/src/lib/constants/permissions.ts` (`docs/architecture/user-administration.md`).
Would have added only the page, the matrix component, and one hook wrapping those framework
services — no new service file. Would have appended one route entry to `admin.routes.tsx`
(created by U007).

## Reusing

- `platform/src/services/roles.ts` — `getRoles`, `insertRole`, `updateRole`, `deleteRole`,
  `upsertRoleScreen`, `deleteRoleScreen`
- `platform/src/services/screens.ts` — `getScreens`
- `platform/src/lib/constants/permissions.ts` — `PERMISSION_OPTIONS` ("No Access" / "Read Only" /
  "Read, Write & Delete")
- `platform/src/types/roles.ts` — `Role`, `RoleScreen`, `Screen`, `PermissionDraft`

## Data source

`getRoles`, `getScreens` (read), `upsertRoleScreen`/`deleteRoleScreen` (write) — all framework
services, wrapped by the new `src/hooks/users/useRoleScreens.ts`.

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |

Matrix rows = roles, columns = screens; each cell = a `PERMISSION_OPTIONS` value.

## Validation

n/a — a select-per-cell matrix, not a form with field-level rules; each change saves as a discrete
`upsertRoleScreen`/`deleteRoleScreen` call, per `PermissionDraft`'s existing shape.

## Layout

Only what differs from the template chosen at spec time.

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

`access: protected`, `required_role: ROLES.USER_ADMIN`.

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

None.
