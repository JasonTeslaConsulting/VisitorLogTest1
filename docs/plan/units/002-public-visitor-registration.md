---
id: U002
slug: public-visitor-registration
title: Public visitor registration
status: spec-ready
kind: form
tier: leaf
area: visitor
route: /register
access: public
required_role: null
layout: none
template: single-card
template_props: { width: narrow, headerPlacement: above }
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: [U001]
gate: required
owner: null
branch: null
estimate_files: 4
blocked_reason: null
spec_source: 2026-09-01
touches:
  routes: [src/routes/modules/register.routes.tsx]
  types: [src/types/visitor.ts]
  constants: []
  services: [src/services/visitor.ts]
  hooks: [src/hooks/visitor/useVisitLookups.ts]
  pages: [src/pages/Register.tsx]
  components:
    [
      src/components/Register/RegisterForm.tsx,
      src/components/Register/EquipmentFieldArray.tsx,
    ]
  shared_ui: []
  tokens: false
---

## Purpose

The visitor-facing entry point: a public, unauthenticated form reached by a QR code at reception
on arrival (on-arrival model — `entrydate` is stamped `now()` server-side, never a form field).
Records who the visitor is, their host, their purpose, consent, and any equipment brought in, then
swaps to a confirmation state in place — no second route.

`Register.tsx` owns one piece of UI state: `submitted: boolean`. `false` renders `RegisterForm`;
`true` renders `ConfirmationPanel`. Toggling it remounts whichever side is hidden, which is what
gives "Register another visitor" a fresh, empty form for free — no manual `form.reset()` needed.

## Data source

All reads/writes go through `src/services/visitor.ts` (U001), extended by this unit with one more
lookup:

- `createVisit(payload: CreateVisitPayload)` — existing, via `useCreateVisit()`
  (`useVisitMutations.ts`)
- `listVisitHosts()`, `listVisitPurposes()`, `listEquipmentItemTypes()`, `getPolicyText()` —
  existing, via `useVisitHosts()`/`useVisitPurposes()`/`useEquipmentItemTypes()`/`usePolicyText()`
  (`useVisitLookups.ts`), all `staleTime: STALE_TIMES.STATIC`
- **New:** `listCountryDialCodes(): Promise<CountryDialCodeOption[]>` — calls
  `public.list_country_dial_codes()` (`docs/plan/db-setup.md` §3's fifth RPC), maps to
  `{ countryDialId, countryDialCode, countryName, isDefault }[]`. Add the type
  `CountryDialCodeOption` to `src/types/visitor.ts` and a `useCountryDialCodes()` hook (same
  `STALE_TIMES.STATIC` tier) to `useVisitLookups.ts` — both are additions to existing U001 files,
  not new files.

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |
| Full name | text | `visitorregister.fullname` | `Input` | required | — |
| Organization | text | `visitorregister.organization` | `Input` | optional | — |
| Email | text | `visitorregister.emailaddress` | `Input` | optional | zod `.email()` when non-empty |
| Country dial code | select | `visitorregister.mobilenumbercountrydialid` | `Combobox` (searchable) | optional | options from `useCountryDialCodes()`, label `"{countryName} ({countryDialCode})"`; pre-select the `isDefault` row |
| Mobile number | text | `visitorregister.mobilenumber` | `Input` | optional | paired with the field above per build-form-page's "Inline compound fields" layout (`flex-col sm:flex-row`, `min-w-0` on the number side) |
| Host | select | `visitorregister.hostid` | `Combobox` (searchable) | required | options from `useVisitHosts()` |
| Visit purpose | select | `visitorregister.visitpurposeid` | `Select` | required | options from `useVisitPurposes()` |
| Privacy policy read | checkbox | `visitorregister.isprivacypolicyread` | `Checkbox` + `Popover` "View policy" link | required, must be checked | popover body is `getPolicyText().privacyPolicyText` |
| Video consent | checkbox | `visitorregister.isconsentvideorecord` | `Checkbox` + `Popover` "View details" link | required, must be checked | popover body is `getPolicyText().videoConsentText` |
| Equipment | repeatable rows | `visitorequipment` (0..n) | `EquipmentFieldArray` | optional | see below |

Each equipment row (`react-hook-form`'s `useFieldArray`, no cap on row count):

| Row field | Source column | Display | Notes |
| --- | --- | --- | --- |
| Item type | `visitorequipment.itemtypeid` | `Select`, options from `useEquipmentItemTypes()` | required per row |
| Description | `visitorequipment.itemdescription` | `Input` | required per row |
| Quantity | `visitorequipment.quantity` | `Input type="number"` | defaults to `1`, min `1`, required per row |
| Serial number | `visitorequipment.serialnumber` | `Input` | optional |

Starts with **zero** rows and an "+ Add item" button below the (empty) list — always visible, not
behind a toggle. Each row gets a trailing remove (`×`) icon button.

## Validation

`react-hook-form` + `zod`:

```ts
const equipmentItemSchema = z.object({
  itemTypeId: z.string().min(1, "Item type is required"),
  itemDescription: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  serialNumber: z.string().optional(),
});

const registerFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  organization: z.string().optional(),
  emailAddress: z.string().email("Invalid email address").optional().or(z.literal("")),
  countryDialId: z.string().optional(),
  mobileNumber: z.string().optional(),
  hostId: z.string().min(1, "Host is required"),
  visitPurposeId: z.string().min(1, "Visit purpose is required"),
  isPrivacyPolicyRead: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you have read the privacy policy" }),
  }),
  isConsentVideoRecord: z.literal(true, {
    errorMap: () => ({ message: "You must consent to video recording" }),
  }),
  equipment: z.array(equipmentItemSchema),
});
```

No cross-field rules beyond this — e.g. no purpose-specific requirement on `organization`.

## Layout

Section order inside the `single-card` (`width: narrow`, `headerPlacement: "above"`): personal
details (name/organization/email/mobile+dial code) → host & purpose → equipment (field array) →
consent (two checkboxes) → submit.

**One deviation from `FormPagePublic`'s sample shape:** that sample's action row is a right-aligned
`Cancel`/`Save` pair. This page has **no Cancel** — a visitor who scanned a QR code has nowhere to
go back to (same reasoning `ConfirmationPageSimple`'s own comment states). The action row is a
**single full-width primary button**, `"Register"`, matching `ConfirmationPanel`'s own full-width
primary convention for a narrow public card. No `useUnsavedChangesGuard` — that hook (and its
lint rule) only applies inside a `Sheet`/`Dialog`; this is a standalone page.

Country dial code + mobile number use the compound-field layout from
`.claude/skills/build-form-page/SKILL.md` § Responsiveness: `flex flex-col gap-2 sm:flex-row`,
dial code at `w-full sm:w-2/5`, number at `flex-1 min-w-0`.

## Actions

| Action | Trigger | Confirmation | Effect | On success | On failure |
| --- | --- | --- | --- | --- | --- |
| Register | Submit button (full-width, shows spinner via `isLoading` while `useCreateVisit`'s `isPending`) | none | `createVisit(payload)` | `Register.tsx` sets `submitted: true` | inline zod errors stay visible; `toast.error(error.message)`; form keeps its entered values |
| Add item | "+ Add item" button below the equipment rows | none | `useFieldArray`'s `append()` with an empty row (`quantity: 1`) | new row appended | n/a |
| Remove item | Trailing `×` icon button per row | none | `useFieldArray`'s `remove(index)` | row removed | n/a |
| Register another visitor | Primary button on the confirmation state (full-width) | none | `Register.tsx` sets `submitted: false` | remounts `RegisterForm` empty | n/a |

## States

- **Empty:** equipment list starts with zero rows; nothing else is a "list" on this page.
- **Loading:** each lookup-backed control (`Host`, `Visit purpose`, item-type selects, dial-code
  combobox) shows a disabled trigger with a "Loading…" placeholder while its `useQuery` is
  pending. Submit button disables and shows a spinner while `useCreateVisit` is pending.
- **Error:** a lookup query failing shows the same control disabled with an
  "Unable to load options" placeholder, plus one `toast.error` (not one per failed lookup — dedupe
  by only toasting once per mount). A failed submit shows `toast.error(error.message)`; the form's
  entered values are preserved so the visitor can retry without retyping.
- **Permission-limited:** n/a — the route is public, nothing on the page is role-gated.
- **Post-mutation:** the whole card content swaps from `RegisterForm` to `ConfirmationPanel`
  (title "Registration completed", description telling the visitor to wait for their host,
  `secondary` restating the "must remain accompanied" condition per
  `ConfirmationPageSimple`'s copy), with the single "Register another visitor" action described
  above.

## Permissions

Public — no auth, no role. RLS on `_visitor.visitorregister`/`visitorequipment`
(`docs/plan/db-setup.md` §2) is the only real gate; the client never proves an identity.

## Files

### Creating

- `src/pages/Register.tsx`
- `src/components/Register/RegisterForm.tsx`
- `src/components/Register/EquipmentFieldArray.tsx`
- `src/routes/modules/register.routes.tsx`

### Modifying shared files

- `src/services/visitor.ts` — add `listCountryDialCodes()`
- `src/types/visitor.ts` — add `CountryDialCodeOption`
- `src/hooks/visitor/useVisitLookups.ts` — add `useCountryDialCodes()`

### Reusing

- `createVisit`, `listVisitHosts`, `listVisitPurposes`, `listEquipmentItemTypes`, `getPolicyText`
  and their hooks — all from U001, unchanged
- `platform/src/templates/SingleCardTemplate`, `ConfirmationPanel`, `Field`/`FieldGroup`/
  `FieldLabel`/`FieldError`, `Input`, `Select`, `Combobox`, `Checkbox`, `Button`, `Popover`
- `react-hook-form` (`useForm`, `useFieldArray`, `Controller`), `zod` + `@hookform/resolvers/zod`

### Not doing

- No side sheet or modal — this is a standalone page, not opened from a table
- No `useUnsavedChangesGuard` — see `## Layout`
- No Cancel button — see `## Layout`
- No cap on equipment row count
- No cross-field validation beyond what's listed in `## Validation`

## Open questions

(none)

## Deviations

- **zod v4 API drift.** The spec's `## Validation` schema used
  `z.literal(true, { errorMap: () => ({ message: "..." }) })`. This repo's installed `zod` (v4.4.3)
  renamed that param to `message` and changed the overload signature, so the verbatim spec code
  fails `tsc`. Implemented as `z.literal(true, { message: "..." })` instead — same validation, same
  error text, just the current API shape.
- **CI-blocking framework bug found, not fixed here (not editable in this portal).**
  `platform/scripts/gen-plan-docs.mjs`'s duplicate-route check
  (`if (inventory.includes(\`${fm.route}\`)) errors.push(...)`) searches the *entire* text of
  `docs/architecture/inventory.md` for a unit's own route, with no exemption for the route this
  same unit's own `## Files` just created. Once this unit's `register.routes.tsx` exists and
  `npm run docs:arch` regenerates the inventory (required — `docs:arch -- --check` fails
  otherwise), the inventory's own freshly-added `/register` row makes `docs:plan -- --check` report
  `route \`/register\` already exists` against **this unit's own frontmatter**. `docs:plan --
  check` is a required, blocking step in `.github/workflows/ci.yml` (not `continue-on-error` like
  `docs:check`), so **this will fail CI on this PR**, and will fail again on every future
  route-bearing unit's PR for the same reason — it is not specific to `/register`. Filed in
  `docs/framework-feedback.md` with the exact fix (skip a match when the inventory row's Module
  column equals a path in that unit's own `touches.routes`). All other VERIFY steps (typecheck,
  lint, format, `docs:arch -- --check`, build, scope-diff) pass clean.
- Everything else shipped exactly as specified: all four files created, the three U001 files
  extended exactly as planned (`listCountryDialCodes`, `CountryDialCodeOption`,
  `useCountryDialCodes`), no barrel edits, no side sheet/modal, no Cancel button. No VERIFY retry
  was needed beyond the one `prettier --write` pass on the three new files.
