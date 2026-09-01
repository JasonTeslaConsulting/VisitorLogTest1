# Claim: unit/006-users-domain-foundation

- **Dev:** @jl
- **Started:** 2026-09-01
- **Expected merge:** 2026-09-01
- **Plan source:** docs/plan/units/006-users-domain-foundation.md

## Building

Shared foundation for the two admin pages (U007, U008): app-owned `src/services/users.ts`
wrapping the framework's read-only `platform/src/services/users.ts` with camelCase mapping, plus
`addPortalUser` (nullable `authuserid`) and `deactivateUser`, which the framework service can't do.

## Creating (do not create these on another branch)

- src/types/users.ts
- src/services/users.ts
- src/hooks/users/useUsers.ts
- src/hooks/users/useUserMutations.ts

## Modifying shared files (append-only conflicts likely)

(none)

## Reusing (already exists — not rebuilding these)

- `@framework/services/users` — `getUsers`, `getRoles`, `addRoleToUser`, `removeRoleFromUser`
- `@framework/integrations/supabase/client`, `@framework/lib/constants/app` (`STALE_TIMES`)

## Not doing

- No barrel edits to `src/types/index.ts`
- No reactivate function
- No changes to any framework file
- No UI, no page — that's U007/U008
