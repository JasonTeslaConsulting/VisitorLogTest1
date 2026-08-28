---
paths:
  - platform/src/lib/dateTimeUtils.ts
  - platform/src/lib/numericUtils.ts
  - platform/src/lib/layoutUtils.ts
  - platform/src/lib/functions.js
---

# Rules: platform/src/lib/dateTimeUtils.ts, numericUtils.ts and layoutUtils.ts

Framework-owned — all four files moved here as a unit in the framework/app split; a portal never
edits them (`npm run framework:verify` rejects it).

## General

- Pure functions only — no React imports, no Supabase, no side effects
- All functions are reached through their namespace: DateTimeUtils.x() / NumericUtils.x() /
  LayoutUtils.x() — each module is re-exported as a namespace from `platform/src/lib/index.ts`
- Never format dates or numbers inline in components, hooks, or services — always call these utils
- When a new formatting need arises, add it here rather than handling it inline

## DateTimeUtils (lib/dateTimeUtils.ts)

- Import via namespace: import { DateTimeUtils } from '@framework/lib' — never import individual functions directly
- Input dates can be string | Date | null — always handle all three
- Always handle null/invalid input gracefully — return "" or null, never throw
- Locale-aware formatting should use the user's locale, not hardcoded "en-US"

## NumericUtils (lib/numericUtils.ts)

- Import via namespace: import { NumericUtils } from '@framework/lib' — never import individual functions directly
- Always handle null/undefined/NaN input gracefully — return "—" or 0, never throw
- Currency formatting should accept a currency code param, default to project default

## LayoutUtils (lib/layoutUtils.ts)

- Import via namespace: import { LayoutUtils } from '@framework/lib' — never import individual functions directly
- Pure pathname predicates only (isActive, isModuleActive) — no router hooks, no `useLocation()`;
  the caller passes `location.pathname` in
- `NavModule`/`NavScreen` come from `@framework/types/navigation`, not `@framework/services/menu`
  — `platform/src/lib` never imports from `platform/src/services`
- Never re-derive active-route logic inline (`pathname.startsWith(...)`) in a nav component —
  every navbar component shares these

## platform/src/lib/functions.js

- Contains generic helpers: compareObjects, compareArrays, isNullOrUndefined, and more
- Before writing any utility/helper logic inline in a component, hook, or service —
  check functions.js first. If a relevant function exists, use it.
- If you write a helper that is genuinely generic (not domain-specific), add it here
  rather than leaving it inline
- Import individually: import { isNullOrUndefined } from '@framework/lib/functions'
- Never duplicate logic that already exists here
