---
id: U007
slug: user-management
title: User management
status: spec-ready
kind: datatable
tier: leaf
area: admin
route: /admin/users
access: protected
required_role: ROLES.USER_ADMIN
layout: default
template: single-card
template_props: { width: wide, headerPlacement: above }
domain: users
data_mode: live
entities: [organizationuser, applicationuser, applicationuserrole, role]
depends_on: [U006]
gate: required
owner: null
branch: null
estimate_files: 5
blocked_reason: null
spec_source: 2026-09-01
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
      src/components/UserManagement/AddUserSheet.tsx,
      src/components/UserManagement/EditRolesSheet.tsx,
    ]
  shared_ui: []
  tokens: false
---

## Purpose

The User Admin's page: every `organizationuser`, their roles as chips, a toolbar "Add user"
action, and per-row "Edit roles"/"Deactivate" actions. `DataTable` runs `mode="client"` —
`listUsers()` (U006) has no pagination params, it returns everyone at once, matching how U006
built it.

**Two separate sheets, not one with two modes** — `AddUserSheet` (create form: name/email/start
date) and `EditRolesSheet` (a `MultiSelect` of role assignments for one existing user) have
different field shapes and different mutations underneath; combining them would mean one component
branching between two mostly-unrelated field sets.

Creates `src/routes/modules/admin.routes.tsx` — U008 appends to this same file.

## Data source

`useUsers()`, `useAssignableRoles()` (`src/hooks/users/useUsers.ts`, U006) and
`useAddPortalUser()`, `useDeactivateUser()`, `useAssignRole()`, `useUnassignRole()`
(`useUserMutations.ts`, U006) — all already exist, no new service or hook file.

**Client-side status filter**, per the established `mode="client"` pattern
(`platform/src/samples/samples/ScopedListPage.tsx`): the page computes
`filteredUsers = useMemo(() => allUsers.filter(...), [allUsers, state.filters.status])` from
`useUsers()`'s full result and `state.filters.status` — `DataTable` itself only does client-side
search/sort/pagination over whatever array it's given; filtering by an app-defined predicate is
the page's own job in client mode, not something `DataTable` does automatically.

## Fields

**Table columns** (`UserColumns.tsx`):

| Field | Type | Source column | Display | Notes |
| --- | --- | --- | --- | --- |
| Full name | text | `organizationuser.fullname` | plain, sortable | — |
| Email | text | `organizationuser.primaryemail` | plain | — |
| Roles | chips | `applicationuserrole[].role.rolename` | `Badge` per role, `wrap: true` | empty cell (no badges) when `roles.length === 0`, not a placeholder badge |
| Employment start | date | `organizationuser.employmentstartdate` | plain, sortable | `DateTimeUtils.formatDateTime` (date portion) |
| Status | badge | derived from `employmentEndDate` | `badge: { variants: { active: "success", deactivated: "secondary" } }` | `"active"` when `employmentEndDate === null`, else `"deactivated"` |

**Filter** (`FilterSheet`, one field): Status — `Select` with `Active` (default) / `Deactivated` /
`All`. Search: full name only, matching the convention already used on the visitor pages.

**AddUserSheet fields:**

| Field | Type | Notes |
| --- | --- | --- |
| Full name | text | required |
| Primary email | text | required, email format |
| Employment start date | `DatePicker` | required, defaults to today (`_secure.organizationuser.employmentstartdate` is `NOT NULL`) |

No `authUserId` field — a Supabase auth account is created out-of-band per U006's design; the
field exists on `AddPortalUserPayload` but this form never sets it.

**EditRolesSheet fields:** one `MultiSelect` of `useAssignableRoles()`'s options, controlled,
initialized from the target user's current `roles.map(r => r.roleId)`.

## Validation

**AddUserSheet:** `react-hook-form` + `zod` — `fullName: z.string().min(1)`,
`primaryEmail: z.string().email()`, `employmentStartDate: z.string().min(1)` (a date string, not
further constrained). **EditRolesSheet:** no schema — any subset of available roles, including
none, is valid.

## Layout

`single-card`, `width: "wide"`, title "Users". Toolbar: search + "Add user" button
(`headerActions` on the template, matching `build-datatable`'s reference page). Both sheets:
standard side sheet, 448px, per `.claude/rules/components-rules.md` — footer actions right-aligned,
Cancel left of the confirming action. Both wired with `useUnsavedChangesGuard` (`when:
form.formState.isDirty` for `AddUserSheet`, `when` derived from a set-comparison of selected vs
original role ids for `EditRolesSheet`) and render `UnsavedChangesDialog` — `local/require-unsaved-
guard` fails the build without it, since both sheets contain field/data-entry controls.

## Actions

| Action | Trigger | Confirmation | Effect | On success | On failure |
| --- | --- | --- | --- | --- | --- |
| Add user | Toolbar button | none | Opens `AddUserSheet` | `useAddPortalUser()` → toast, close sheet, invalidate `["users"]` | inline zod errors + `toast.error` |
| Edit roles | Row action (hidden when `applicationUserId` is `null` — no linked auth account to attach a role to yet) | none | Opens `EditRolesSheet` pre-filled with current roles | diff selected vs original role ids; `useAssignRole()` per addition, `useUnassignRole()` per removal (parallel); `toast.success("Roles updated")`, close sheet, invalidate `["users"]` | `toast.error(error.message)`, sheet stays open with the attempted selection |
| Deactivate | Row action (hidden entirely — not just disabled — for a row already deactivated) | `ConfirmDialog`: "Deactivate [full name]? They will no longer be able to sign in." | `useDeactivateUser()` | `toast.success("User deactivated")`, invalidates `["users"]`, row's Status badge flips to "deactivated" and its Deactivate action disappears | `toast.error(error.message)` |

Two row actions when both are visible → collapses into a `⋮` menu per `RowActionsCell`'s own rule;
one when the other is hidden → renders as a single icon button.

## States

- **Empty:** `EmptyState` title "No users found", CTA "Add user" opening `AddUserSheet` — this
  page is the actual next action, unlike the visitor pages where nothing here creates a visit.
- **Loading:** `DataTable`'s built-in `TableSkeleton`.
- **Error:** `toast.error` on a failed `useUsers()`/mutation call; the table keeps its last good
  data rather than blanking.
- **Permission-limited:** n/a on this page itself — a non-`User Admin` never reaches `/admin/users`
  (`ProtectedRoute` bounces them before render).
- **Post-mutation:** see `## Actions` — toast + `["users"]` invalidation + sheet close, no
  navigation (stays on this page).

## Permissions

`access: protected`, `required_role: ROLES.USER_ADMIN`.

## Files

### Creating

- `src/pages/UserManagement.tsx`
- `src/components/UserManagement/UserColumns.tsx`
- `src/components/UserManagement/AddUserSheet.tsx`
- `src/components/UserManagement/EditRolesSheet.tsx`
- `src/routes/modules/admin.routes.tsx`

### Modifying shared files

(none)

### Reusing

- `useUsers`, `useAssignableRoles`, `useAddPortalUser`, `useDeactivateUser`, `useAssignRole`,
  `useUnassignRole` — all from U006
- `DataTable`, `useTableState`, `FilterSheet`, `ConfirmDialog`, `EmptyState`, `Sheet`/
  `SheetContent`/`SheetHeader`/`SheetFooter`/`SheetTitle`, `MultiSelect`, `DatePicker`,
  `useUnsavedChangesGuard`, `UnsavedChangesDialog`

### Not doing

- No new service, hook, or type files
- No combined add/edit sheet — two separate components
- No reactivate action — out of scope (U006 doesn't have the function either)
- No bulk actions (bulk-deactivate, bulk-role-assign)

## Open questions

(none)

## Deviations

None.
