# Claim: unit/007-user-management

- **Dev:** @jl
- **Started:** 2026-09-01
- **Expected merge:** 2026-09-01
- **Plan source:** docs/plan/units/007-user-management.md

## Building

User Admin page at `/admin/users`: client-mode DataTable of every organization user with role
chips, a status filter, and Add user / Edit roles / Deactivate actions via two separate side
sheets and a ConfirmDialog.

## Creating (do not create these on another branch)

- src/pages/UserManagement.tsx
- src/components/UserManagement/UserColumns.tsx
- src/components/UserManagement/AddUserSheet.tsx
- src/components/UserManagement/EditRolesSheet.tsx
- src/routes/modules/admin.routes.tsx

## Modifying shared files (append-only conflicts likely)

(none)

## Reusing (already exists — not rebuilding these)

- `useUsers`, `useAssignableRoles`, `useAddPortalUser`, `useDeactivateUser`, `useAssignRole`,
  `useUnassignRole` — all from U006
- `DataTable`, `useTableState`, `FilterSheet`, `ConfirmDialog`, `EmptyState`, `Sheet` family,
  `MultiSelect`, `DatePicker`, `useUnsavedChangesGuard`, `UnsavedChangesDialog`

## Not doing

- No new service, hook, or type files
- No combined add/edit sheet — two separate components
- No reactivate action
- No bulk actions
