---
id: U005
slug: on-site-today
title: On site today
status: spec-ready
kind: dashboard
tier: leaf
area: visitor
route: /visits/today
access: protected
required_role: ROLES.OFFICE_MANAGER
layout: default
template: split-card
template_props: { ratio: aside-left }
domain: visitor
data_mode: live
entities: [visitorregister]
depends_on: [U003]
gate: required
owner: null
branch: null
estimate_files: 2
blocked_reason: null
spec_source: 2026-09-01
touches:
  routes: [src/routes/modules/visits.routes.tsx]
  types: []
  constants: []
  services: []
  hooks: []
  pages: [src/pages/VisitsToday.tsx]
  components: [src/components/Visits/OnSiteSummary.tsx]
  shared_ui: []
  tokens: false
---

## Purpose

A reception-facing snapshot for the Office Manager: who is currently on site right now
(`exitdate is null`, regardless of host — RLS's `is_visitor_admin()` already returns everyone for
this role), a headcount, and an overdue count. Matches
`platform/src/samples/samples/DashboardPage.tsx`'s exact shape (`SplitCardTemplate`, `ratio:
"equal"`, stats in the main area separated by `Separator`, a compact list in the aside) —
main area holds headcount + overdue, aside holds the on-site list.

No new service or hook. `useVisits({ status: "active", page: 1, perPage: 200, sort: { field:
"entrydate", direction: "asc" } })` (U001, already exists — the same hook `VisitTables` uses)
returns every currently-active visit; headcount is `rows.length`, the on-site list is `rows`
itself sorted oldest-first, and "overdue" is derived client-side, not a separate query. 200 is a
generous practical ceiling for "everyone on site in one office at once," not a real pagination
limit — flagged as an assumption, not a hard product decision.

**Overdue definition** (there is no "closing time" anywhere in this schema, so this needed a
concrete rule rather than the vague "past closing" from the original app plan): a row is overdue
when its `entryDate`'s calendar date is before today's **and** `exitDate` is still null — i.e.
someone who was never checked out from a previous day. Purely derived, no new config.

`src/components/Visits/OnSiteSummary.tsx` exports two small components, each independently calling
`useVisits(...)` with the identical params object — `OnSiteStats` (the two stat blocks) and
`OnSiteList` (the aside list). Two calls, not one, because they render into `SplitCardTemplate`'s
two non-adjacent slots (`children` and `aside`) from the page; TanStack Query dedupes identical
query keys into a single network request regardless of how many components call it.

## Data source

`useVisits` from `src/hooks/visitor/useVisits.ts` (U001) — no changes to it. `staleTime` is already
`STALE_TIMES.FREQUENT` for `status: "active"`, which is what this page wants (a "right now" view).

## Fields

**Stats (main area, `OnSiteStats`):**

| Stat | Derivation | Notes |
| --- | --- | --- |
| Currently on site | `rows.length` | large number, "People currently on site" caption — matches `DashboardPage`'s stat-block style exactly |
| Overdue | count of rows where `entryDate`'s date < today | same style, below a `Separator` |

**On-site list (aside, `OnSiteList`)**, one row per visit, oldest entry first:

| Field | Source column | Display | Notes |
| --- | --- | --- | --- |
| Full name | `visitorregister.fullname` | plain text | — |
| Duration | `visitorregister.entrydate` | `DateTimeUtils.calcDurationText(entryDate)` | e.g. "3 hours, 20 minutes" |
| Overdue flag | derived (see above) | `Badge variant="warning"` reading "Overdue", inline next to the name | omitted entirely for a non-overdue row, not shown as "On time" |

No search, sort, filter, or pagination controls on this list — it's a glance view, not a managed
table (that's `/visits/manager`'s job).

## Validation

n/a — read-only dashboard.

## Layout

`split-card`, `ratio: "aside-left"`, title "On Site Today" — changed twice from the
originally-approved `ratio: "equal"` after seeing it built. Final arrangement: **aside (narrow,
left)** holds the "Summary" heading and `OnSiteStats` (headcount, a `Separator`, then overdue) —
the compact content fits a narrow column fine. **Main (wide, right, `children`)** holds the "On
site now" heading and `OnSiteList` — the list needs the width for name, duration, and the overdue
badge to sit comfortably on one line. This is the reverse of the DashboardPage sample's own
placement (stats in `children`, list in `aside`) — the sample's `ratio: "equal"` made either side's
width equally suitable, but `aside-left`'s asymmetry means the wider slot should hold whichever
content actually needs the room, not just mirror the sample. No subtitle.

## Actions

None — read-only, no row actions, no page-level actions.

## States

- **Empty:** headcount and overdue both show `0`; the aside list shows `EmptyState` with title "No
  one is currently on site", no CTA.
- **Loading:** `Skeleton` (`platform/src/components/ui/skeleton.tsx`) in place of each stat number
  and in place of the list rows — no full-page spinner.
- **Error:** if `useVisits` errors, both the stats area and the list show "Unable to load" in place
  of their content (not a silent `0`, which would misrepresent an unknown count as an empty one),
  plus one `toast.error`.
- **Permission-limited:** n/a on this page itself — a non-`Office Manager` user never reaches
  `/visits/today` (`ProtectedRoute` bounces them before render).
- **Post-mutation:** n/a — no mutations on this page.

## Permissions

`access: protected`, `required_role: ROLES.OFFICE_MANAGER`.

## Files

### Creating

- `src/pages/VisitsToday.tsx`
- `src/components/Visits/OnSiteSummary.tsx`

### Modifying shared files

- `src/routes/modules/visits.routes.tsx` — append the `/visits/today` route

### Reusing

- `useVisits` from U001 — unchanged
- `platform/src/templates/SplitCardTemplate`, `Separator`, `Skeleton`, `EmptyState`, `Badge`
- `DateTimeUtils.calcDurationText` (`platform/src/lib/dateTimeUtils.ts`)

### Not doing

- No new service or hook file
- No "office closing time" config — overdue is purely derived (see `## Purpose`)
- No search/sort/filter/pagination on the on-site list
- No real pagination on the underlying query — `perPage: 200` is a practical ceiling, not a
  designed limit

## Open questions

(none)

## Deviations

- **`DateTimeUtils.calcDurationText`'s `end` param does not default to "now" when omitted** — the
  spec's `## Data source`/`## Fields` sections assumed it would. Traced into `__calcDuration`
  (`platform/src/lib/dateTimeUtils.ts`): it returns `null` (rendering as an empty string) whenever
  either `start` or `end` is empty, and `undefined` counts as empty. Fixed by passing `new Date()`
  explicitly — `DateTimeUtils.calcDurationText(row.entryDate, new Date())` — which is what the spec
  actually intended ("e.g. '3 hours, 20 minutes'"). Caught by the implementing subagent tracing the
  utility's real behavior rather than trusting the spec's assumption; no framework file was
  touched, only how this unit's own code calls it.
- Everything else shipped exactly as specified: two independent `useVisits` calls sharing one
  query key (TanStack Query dedupes them into one request), overdue derived via calendar-date
  comparison with no new config, one-toast-per-mount owned solely by `OnSiteStats` (confirmed live
  — only one toast fired, not two), `split-card` matching `DashboardPage.tsx`'s exact shape. VERIFY
  passed clean on the first attempt (typecheck, lint, format, build); no retry was needed. Verified
  live in the browser via `VITE_DEV_AUTH` — heading, both stat/list areas, and the error state
  ("Unable to load" in both slots, exactly one toast) all render correctly. Dev-auth bypass has no
  real Supabase session, so the populated (non-error) rendering path could not be visually
  confirmed in this environment — only the error path was actually exercised.
