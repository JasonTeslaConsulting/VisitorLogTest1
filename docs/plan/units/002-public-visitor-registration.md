---
id: U002
slug: public-visitor-registration
title: Public visitor registration
status: draft
kind: form
tier: leaf
area: visitor
route: /register
access: public
required_role: null
layout: none
template: null
template_props: null
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: [U001]
gate: required
owner: null
branch: null
estimate_files: 4
blocked_reason: null
touches:
  routes: [src/routes/modules/register.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: []
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
on arrival. Records who the visitor is, when they arrived (now, not editable — on-arrival model),
their purpose, their host, consent, and any equipment brought in, then confirms in place rather
than navigating away.

Shape matches `platform/src/samples/samples/FormPagePublic.tsx` — `single-card` template,
`headerPlacement: "above"`, `layout: "none"` (no navbar). Must work at 375px — this is the page
most likely to be opened on a phone.

Fields (final shape confirmed at spec time): full name, organization, email, mobile number + dial
code (`listVisitHosts`/dial-code lookup from U001), host (searchable combobox), visit purpose
(select), privacy-policy-read + video-consent checkboxes (text from `getPolicyText()`), and a
repeatable equipment section (item type, description, quantity, serial number) via
`EquipmentFieldArray`.

On success, the card content swaps to a `ConfirmationPanel`-style success state in place — no
second route, keeping this a single unit.

## Data source

`createVisit`, `listVisitHosts`, `listVisitPurposes`, `getPolicyText` — all from
`src/services/visitor.ts` (U001), via `src/hooks/visitor/useVisits.ts` (reads) and
`useVisitMutations.ts` (`createVisit`). No new service or hook file.

## Fields

| Field | Type | Source column | Display | Editable | Notes |
| --- | --- | --- | --- | --- | --- |

## Validation

react-hook-form + zod. Required: full name, host, visit purpose, privacy-policy-read,
video-consent. Equipment rows optional; each present row requires item type, description, and a
positive quantity.

## Layout

Only what differs from `single-card`, `headerPlacement: "above"`, `width: "narrow"` — recorded at
spec time.

## Actions

| Action | Trigger | Confirmation | Effect | On success | On failure |
| --- | --- | --- | --- | --- | --- |

## States

- **Empty:**
- **Loading:**
- **Error:**
- **Permission-limited:**
- **Post-mutation:**

## Permissions

Public — no auth, no role. RLS on `_visitor.visitorregister`/`visitorequipment` (see
`docs/plan/db-setup.md`) is the only real gate; the client never proves an identity.

## Files

### Creating

### Modifying shared files

### Reusing

### Not doing

## Open questions

- Must be empty before this unit leaves `spec-ready`.

## Deviations

None.
