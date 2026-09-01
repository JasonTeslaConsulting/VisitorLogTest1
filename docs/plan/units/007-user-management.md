---
id: U007
slug: user-management
title: User management
status: draft
kind: datatable
tier: leaf
area: admin
route: /admin/users
access: protected
required_role: ROLES.USER_ADMIN
layout: default
template: null
template_props: null
domain: users
data_mode: live
entities: [organizationuser, applicationuser, applicationuserrole, role]
depends_on: [U006]
gate: required
owner: null
branch: null
estimate_files: 4
blocked_reason: null
touches:
  routes: [src/routes/modules/admin.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: []
  pages: [src/pages/UserManagement.tsx]
  components:
    [
      src/components/UserManagement/UserColumns.tsx,
      src/components/UserManagement/UserFormSheet.tsx,
    ]
  shared_ui: []
  tokens: false
---

## Purpose

The User Admin's page: a table of every `organizationuser` with their roles shown as chips, a
toolbar `Add user` action, and per-row `Edit roles` / `Deactivate` actions. Per
`.claude/skills/build-datatable/SKILL.md`, forms open in a side sheet (`UserFormSheet`, covering
both add and edit-roles); `Deactivate` is destructive and stays behind `ConfirmDialog` regardless
of that default. Creates `src/routes/modules/admin.routes.tsx` — U008 appends to this same file.

## Data source

`getUsers`, `getRoles`, `addRoleToUser`, `removeRoleFromUser`, `addPortalUser`, `deactivateUser`
from `src/services/users.ts` (U006), via new `src/hooks/users/useUsers.ts` /
`useUserMutations.ts` (created in U006, consumed here — no new hook file in this unit).

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |

## Validation

Add-user sheet: full name, primary email, employment start date required (matches
`_secure.organizationuser` NOT NULL columns); email format validated. Role-edit sheet: at least
zero roles is valid (a user can have none).

## Layout

Only what differs from the template chosen at spec time — a `DataTable` with role chips and the
two-action row menu.

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
