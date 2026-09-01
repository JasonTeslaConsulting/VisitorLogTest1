---
id: U001
slug: visitor-domain-foundation
title: Visitor domain foundation
status: spec-ready
kind: infra
tier: foundation
area: visitor
route: null
access: authenticated
required_role: null
layout: default
template: null
template_props: null
domain: visitor
data_mode: live
entities: [visitorregister, visitorequipment]
depends_on: []
gate: required
owner: null
branch: null
estimate_files: 5
blocked_reason: null
spec_source: 2026-09-01
touches:
  routes: []
  types: [src/types/visitor.ts]
  constants: [src/lib/constants/roles.ts]
  services: [src/services/visitor.ts]
  hooks:
    [
      src/hooks/visitor/useVisits.ts,
      src/hooks/visitor/useVisitLookups.ts,
      src/hooks/visitor/useVisitMutations.ts,
    ]
  pages: []
  components: []
  shared_ui: []
  tokens: false
---

## Purpose

Shared foundation for every visitor-log page: types, the one `visitor` domain service, and its
hooks, plus seeding this portal's roles. Touched by U002 (public registration), U003 (my visits),
U004 (all visits), and U005 (on-site today) — built once here so none of those four units
duplicates it.

`src/lib/constants/roles.ts` (currently `export const ROLES = {} as const;`) is seeded with:

```ts
export const ROLES = {
  STAFF: "Staff",
  OFFICE_MANAGER: "Office Manager",
  USER_ADMIN: "User Admin",
} as const;
```

These values must equal `_secure.role.rolename` exactly (`resolveCurrentUser` builds `roles[]`
from `rolename`, and route guards compare against it) — they match the rows `docs/plan/db-setup.md`
§6 already inserted.

**No barrel edits.** `src/types/index.ts` and `src/lib/constants/index.ts` both say new code should
import from the domain file directly (`@/types/visitor`, `@/lib/constants/roles`) rather than being
re-exported through the barrel — do not add a line there for this unit.

**Host/purpose names are resolved client-side, not via embed.** `visitorequipment` has a real FK to
`visitorregister` (`fk_visitorequipment_visitorregister`), so `listVisits` can safely nested-select
it. `visitorregister.hostid`/`visitpurposeid` have **no** declared FK (`Relationships: []` in the
generated types) — so `Visit` carries raw ids only, and a page resolves them to display names by
looking up `useVisitHosts()`/`useVisitPurposes()`'s already-cached results, not by asking the query
to embed something that isn't there.

## Data source

**Tables** (existing — see `docs/plan/db-setup.md` §§1–2 for the exposed-schema/grant/RLS
prerequisites): `_visitor.visitorregister`, `_visitor.visitorequipment`.

**RPCs** (existing — `docs/plan/db-setup.md` §3, all `SECURITY DEFINER`, granted to `anon` and
`authenticated`): `public.list_visit_hosts()`, `public.list_visit_purposes()`,
`public.list_equipment_item_types()`, `public.get_visitor_policy_text()`.

**`src/types/visitor.ts`** — new file:

```ts
export type VisitStatus = "active" | "past";

export type VisitEquipmentItem = {
  visitorEquipmentId: string;
  itemTypeId: string;
  itemDescription: string;
  quantity: number;
  serialNumber: string | null;
};

export type Visit = {
  visitorRegisterId: string;
  fullName: string;
  organization: string | null;
  emailAddress: string | null;
  mobileNumber: string | null;
  mobileNumberCountryDialId: string | null;
  entryDate: string;
  exitDate: string | null;
  exitLoggedBy: string | null;
  exitLoggedDate: string | null;
  hostId: string;
  visitPurposeId: string;
  isPrivacyPolicyRead: boolean;
  isConsentVideoRecord: boolean;
  equipment: VisitEquipmentItem[];
};

export type VisitHostOption = { organizationUserId: string; fullName: string };
export type VisitPurposeOption = { referenceDataId: string; referenceDataName: string };
export type EquipmentTypeOption = { referenceDataId: string; referenceDataName: string };

export type CreateVisitEquipmentInput = {
  itemTypeId: string;
  itemDescription: string;
  quantity: number;
  serialNumber?: string;
};

export type CreateVisitPayload = {
  fullName: string;
  organization?: string;
  emailAddress?: string;
  mobileNumber?: string;
  mobileNumberCountryDialId?: string;
  hostId: string;
  visitPurposeId: string;
  isPrivacyPolicyRead: boolean;
  isConsentVideoRecord: boolean;
  privacyPolicyContent: string;
  consentVideoContent: string;
  equipment: CreateVisitEquipmentInput[];
};

export type ListVisitsParams = {
  page: number;
  perPage: number;
  status: VisitStatus;
  search?: string;
  hostId?: string;
  sort?: { field: string; direction: "asc" | "desc" } | null;
};
```

**`src/services/visitor.ts`** — new file, per `.claude/rules/service-rules.md` (local `RawX` types,
`mapX` mappers, camelCase returns, `{ count: "exact" }`, throw on error):

- `listVisits(params: ListVisitsParams): Promise<{ rows: Visit[]; count: number }>` — queries
  `_visitor.visitorregister` with a nested `visitorequipment(*)` select (real FK, safe to embed);
  `status: "active"` → `.is("exitdate", null)`, `status: "past"` → `.not("exitdate", "is", null)`;
  `search` → `.ilike("fullname", `%${search}%`)` (full name only — organization/email out of scope
  for this unit); `hostId` → `.eq("hostid", hostId)` when present (U004's optional host filter;
  RLS is what actually restricts visibility, this is a refinement on top of it); `sort` →
  `.order(sort.field, { ascending: sort.direction === "asc" })`; default sort `entrydate desc`.
- `logVisitExit(visitorRegisterId: string, exitLoggedBy: string): Promise<void>` — updates
  `exitdate` (now), `exitloggedby` (the caller's `organizationUserId`), `exitloggeddate` (now) on
  one row.
- `createVisit(payload: CreateVisitPayload): Promise<{ visitorRegisterId: string }>` — inserts one
  `visitorregister` row, then one `visitorequipment` row per `payload.equipment` entry referencing
  it, matching the two-step insert pattern in `platform/src/services/users.ts`'s `addUser`. Does
  **not** send `createdby`/`modifiedby` — the anon path relies on the DB default, which
  `docs/plan/db-setup.md` §2 flags as an open question (`public.current_orguser()` has nothing to
  resolve for an anonymous request). Confirm this actually works when U002 is built and tested end
  to end; if it doesn't, the fix is in `docs/plan/db-setup.md`, not in this function.
- `listVisitHosts(): Promise<VisitHostOption[]>` — calls `public.list_visit_hosts()`.
- `listVisitPurposes(): Promise<VisitPurposeOption[]>` — calls `public.list_visit_purposes()`.
- `listEquipmentItemTypes(): Promise<EquipmentTypeOption[]>` — calls
  `public.list_equipment_item_types()`.
- `getPolicyText(): Promise<{ privacyPolicyText: string; videoConsentText: string }>` — calls
  `public.get_visitor_policy_text()`, which returns two rows keyed by `settingname`
  (`PrivacyPolicyText`/`VideoConsentText`); map them into the two named fields.

**Hooks** — one file per logical unit of data, per `.claude/rules/hooks-rules.md`:

- `src/hooks/visitor/useVisits.ts` — `useVisits(params: ListVisitsParams)`, wrapping `listVisits`.
  `queryKey: ["visits", params]`. `staleTime: STALE_TIMES.FREQUENT` when `params.status ===
  "active"`, `STALE_TIMES.STATIC` when `"past"`.
- `src/hooks/visitor/useVisitLookups.ts` — `useVisitHosts()`, `useVisitPurposes()`,
  `useEquipmentItemTypes()`, `usePolicyText()`, each wrapping its same-named service function.
  `queryKey`s: `["visitHosts"]`, `["visitPurposes"]`, `["equipmentItemTypes"]`, `["policyText"]`.
  All `staleTime: STALE_TIMES.STATIC` — these change rarely.
- `src/hooks/visitor/useVisitMutations.ts` — `useCreateVisit()` wrapping `createVisit`,
  `useLogVisitExit()` wrapping `logVisitExit`. Both invalidate the `["visits"]` queryKey prefix
  (`queryClient.invalidateQueries({ queryKey: ["visits"] })`) `onSuccess`.

## Fields

n/a — foundation unit, no page. See `## Data source` for the full type/function contract.

## Validation

n/a — foundation unit; validation schemas belong to U002's form.

## Layout

n/a — foundation unit, no page.

## Actions

n/a — foundation unit, no page.

## States

n/a — foundation unit, no page.

## Permissions

n/a — foundation unit; enforced by the RLS policies in `docs/plan/db-setup.md` and by each
consuming page's own route guard.

## Files

### Creating

- `src/types/visitor.ts`
- `src/services/visitor.ts`
- `src/hooks/visitor/useVisits.ts`
- `src/hooks/visitor/useVisitLookups.ts`
- `src/hooks/visitor/useVisitMutations.ts`

### Modifying shared files

- `src/lib/constants/roles.ts` — add `STAFF`, `OFFICE_MANAGER`, `USER_ADMIN` to `ROLES`

### Reusing

- `@framework/integrations/supabase/client` — the one Supabase client import
- `@framework/lib/constants/app` — `STALE_TIMES`
- `@tanstack/react-query` — `useQuery`/`useMutation`/`useQueryClient`

### Not doing

- No barrel edits to `src/types/index.ts` or `src/lib/constants/index.ts` — both explicitly say new
  domains import directly rather than through the barrel
- No `src/lib/constants/visitor.ts` — no domain-specific runtime constant is needed; `VisitStatus`
  is a type, not a value, and belongs in `src/types/visitor.ts`
- No embedding of host/purpose names in `listVisits` — see `## Purpose`

## Open questions

(none)

## Deviations

None.
