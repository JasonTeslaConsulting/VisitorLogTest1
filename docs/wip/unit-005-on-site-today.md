# Claim: unit/005-on-site-today

- **Dev:** @jl
- **Started:** 2026-09-01
- **Expected merge:** 2026-09-01
- **Plan source:** docs/plan/units/005-on-site-today.md

## Building

Office-Manager-facing `/visits/today` dashboard: headcount + overdue stats, and a compact
currently-on-site list, entirely derived client-side from U001's existing `useVisits`.

## Creating (do not create these on another branch)

- src/pages/VisitsToday.tsx
- src/components/Visits/OnSiteSummary.tsx

## Modifying shared files (append-only conflicts likely)

- src/routes/modules/visits.routes.tsx — append the `/visits/today` route

## Reusing (already exists — not rebuilding these)

- `useVisits` from U001 — unchanged
- `platform/src/templates/SplitCardTemplate`, `Separator`, `Skeleton`, `EmptyState`, `Badge`
- `DateTimeUtils.calcDurationText`

## Not doing

- No new service or hook file
- No "office closing time" config — overdue is purely derived
- No search/sort/filter/pagination on the on-site list
