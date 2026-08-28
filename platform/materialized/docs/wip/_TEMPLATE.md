# Claim: <branch-name>

- **Dev:** @<you>
- **Started:** <YYYY-MM-DD>
- **Expected merge:** <YYYY-MM-DD>
- **Plan source:** plan-new-feature / plan-new-page / ad-hoc

## Building

One or two sentences.

## Creating (do not create these on another branch)

- src/components/<Feature>/<Component>.tsx
- src/hooks/<domain>/use<Thing>.ts

## Modifying shared files (append-only conflicts likely)

- src/routes/modules/<area>.routes.tsx — adding one route
- src/types/<domain>.ts — adding a domain
- src/lib/constants/<domain>.ts — no change expected

## Reusing (already exists — not rebuilding these)

- src/services/<domain>.ts
- platform/src/components/ui/<Component>.tsx

## Not doing

- List anything explicitly out of scope, so nobody assumes it's covered.
