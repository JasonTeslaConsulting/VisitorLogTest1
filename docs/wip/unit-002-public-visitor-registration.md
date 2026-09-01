# Claim: unit/002-public-visitor-registration

- **Dev:** @jl
- **Started:** 2026-09-01
- **Expected merge:** 2026-09-01
- **Plan source:** docs/plan/units/002-public-visitor-registration.md

## Building

Public, unauthenticated visitor registration form at `/register` — the QR-code kiosk entry point.
On success, swaps in place to a confirmation state rather than navigating away.

## Creating (do not create these on another branch)

- src/pages/Register.tsx
- src/components/Register/RegisterForm.tsx
- src/components/Register/EquipmentFieldArray.tsx
- src/routes/modules/register.routes.tsx

## Modifying shared files (append-only conflicts likely)

- src/services/visitor.ts — add `listCountryDialCodes()`
- src/types/visitor.ts — add `CountryDialCodeOption`
- src/hooks/visitor/useVisitLookups.ts — add `useCountryDialCodes()`

## Reusing (already exists — not rebuilding these)

- `createVisit`, `listVisitHosts`, `listVisitPurposes`, `listEquipmentItemTypes`, `getPolicyText`
  and their hooks — all from U001, unchanged
- `platform/src/templates/SingleCardTemplate`, `ConfirmationPanel`, `Field`/`FieldGroup`/
  `FieldLabel`/`FieldError`, `Input`, `Select`, `Combobox`, `Checkbox`, `Button`, `Popover`
- `react-hook-form` (`useForm`, `useFieldArray`, `Controller`), `zod`

## Not doing

- No side sheet or modal — this is a standalone page, not opened from a table
- No `useUnsavedChangesGuard` — only required inside a Sheet/Dialog, not a standalone page
- No Cancel button — a QR-scanning visitor has nowhere else to go
- No cap on equipment row count
