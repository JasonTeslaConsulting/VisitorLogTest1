# Claim: unit/001-visitor-domain-foundation

- **Dev:** @jl
- **Started:** 2026-09-01
- **Expected merge:** 2026-09-01
- **Plan source:** docs/plan/units/001-visitor-domain-foundation.md

## Building

Shared foundation for every visitor-log page: `visitor` domain types, the one `src/services/visitor.ts`,
and its hooks, plus seeding this portal's `ROLES`.

## Creating (do not create these on another branch)

- src/types/visitor.ts
- src/services/visitor.ts
- src/hooks/visitor/useVisits.ts
- src/hooks/visitor/useVisitLookups.ts
- src/hooks/visitor/useVisitMutations.ts

## Modifying shared files (append-only conflicts likely)

- src/lib/constants/roles.ts — add `STAFF`, `OFFICE_MANAGER`, `USER_ADMIN` to `ROLES`

## Reusing (already exists — not rebuilding these)

- `@framework/integrations/supabase/client` — the one Supabase client import
- `@framework/lib/constants/app` — `STALE_TIMES`
- `@tanstack/react-query` — `useQuery`/`useMutation`/`useQueryClient`

## Not doing

- No barrel edits to `src/types/index.ts` or `src/lib/constants/index.ts` — both explicitly say new
  domains import directly rather than through the barrel
- No `src/lib/constants/visitor.ts` — no domain-specific runtime constant is needed
- No embedding of host/purpose names in `listVisits` — `visitorregister` has no declared FK to
  `organizationuser`/`referencedata`; names resolve client-side from the lookup hooks instead
