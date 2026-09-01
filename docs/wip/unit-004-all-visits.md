# Claim: unit/004-all-visits

- **Dev:** @jl
- **Started:** 2026-09-01
- **Expected merge:** 2026-09-01
- **Plan source:** docs/plan/units/004-all-visits.md

## Building

Office-Manager-facing `/visits/manager` page: same Active/Past tabs as U003, plus a Host column
and an independent per-tab host filter, reusing and extending U003's shared components.

## Creating (do not create these on another branch)

- src/pages/VisitsManager.tsx

## Modifying shared files (append-only conflicts likely)

- src/components/Visits/VisitTables.tsx — add `scope` prop, per-tab host `FilterSheet`
- src/components/Visits/VisitColumns.tsx — add `showHost`/`hostNameById` params
- src/routes/modules/visits.routes.tsx — append the `/visits/manager` route

## Reusing (already exists — not rebuilding these)

- `listVisits`, `logVisitExit`, `useVisits`, `useLogVisitExit`, `useVisitPurposes`,
  `useEquipmentItemTypes`, `useVisitHosts` — all from U001
- `FilterSheet`, `Combobox` — same components U002's form already uses

## Not doing

- No shared/single host filter across both tabs — independent per tab
- No filter-aware empty-state copy
- No new service, hook, or type files
