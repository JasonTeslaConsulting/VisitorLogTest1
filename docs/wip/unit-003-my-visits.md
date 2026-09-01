# Claim: unit/003-my-visits

- **Dev:** @jl
- **Started:** 2026-09-01
- **Expected merge:** 2026-09-01
- **Plan source:** docs/plan/units/003-my-visits.md

## Building

Staff-facing `/visits` page: Active/Past visits as tabs, each its own DataTable with inline
expandable equipment/contact/consent detail, and a Log exit row action on active visits.

## Creating (do not create these on another branch)

- src/pages/Visits.tsx
- src/components/Visits/VisitTables.tsx
- src/components/Visits/VisitColumns.tsx
- src/routes/modules/visits.routes.tsx

## Modifying shared files (append-only conflicts likely)

(none)

## Reusing (already exists — not rebuilding these)

- `listVisits`, `logVisitExit`, `useVisits`, `useLogVisitExit`, `useVisitPurposes` — all from U001
- `platform/src/templates/SingleCardTemplate`, `platform/src/components/ui/tabs.tsx`
- `DataTable`, `useTableState`, `ConfirmDialog`, `EmptyState`, `InfoTable`
- `@framework/contexts/AuthContext`'s `useAuth()`

## Not doing

- No filter sheet, no scope selector
- No side sheet for equipment/contact detail — expands inline instead
- No host column — U004's variant of the same `VisitColumns.tsx`
- No auto-switch to the Past tab after Log exit
