---
name: plan-app
description: >
  Use this skill when the user wants to build a whole application from this
  skeleton, not just one page — starting from a simple idea and working out
  toward a complete, ordered build plan. Triggers: "let's build an app for X",
  "I want to build a whole portal", "plan the whole application", "help me
  plan this app from scratch". This skill runs in plan mode — no files are
  written until the user approves. It is the entry point to the autonomous
  build flow; after this, `.claude/skills/build-app/SKILL.md` drives the
  build, page by page, using `.claude/skills/spec-page/SKILL.md` just before
  each page.
applies_to:
  - plan mode
  - whole application
  - docs/plan/
  - app-level interview
---

# Skill: Plan a Whole Application

This skill runs in **plan mode only**. Do not write any files until the user approves the plan.

It sits *above* `plan-new-feature` — where that skill plans one feature at a time with no durable
artifact, this skill interrogates the user once, up front, and produces a durable plan
(`docs/plan/`) covering the whole application: an entity model, a role/permission matrix, a full
nav map, and one build unit per page or shared foundation, in dependency order. Once approved,
`.claude/skills/build-app/SKILL.md` builds every unit through to a pushed PR with no further
scheduling from the user — only per-page clarifications via `.claude/skills/spec-page/SKILL.md`.

---

## Step 1 — Read context

Read in order:

1. `CLAUDE.md` — its "Before Every Task" section covers orienting via `git log` and `docs/wip/`
   first; do that before this list.
2. `docs/PREFLIGHT.md` — human-side setup (git remote, `gh`/`tea`, DB/auth) this skill and
   `build-app` never do for you. If something on it is clearly unresolved (no remote configured,
   the Supabase project-id still unchanged), surface it before Round 6 asks about it directly.
3. `docs/plan/` — if `docs/plan/app.md` already exists, this application already has a plan. Stop
   and tell the user; offer to extend it (new units) rather than starting over, unless they
   explicitly want to replan.
4. `docs/architecture/inventory.md` — what already exists (routes, services, types, components) so
   the plan reuses instead of recreating.
5. `docs/wip/` — check every claim file for overlap.
6. `src/lib/constants/roles.ts` — existing roles, so the interview can offer them instead of
   inventing new ones by default.
7. `platform/src/components/Login/` — existing auth method implementations (Entra, OTP, password), so Round
   1 offers real choices instead of open text.

---

## Step 2 — Interview

Uses the **app-survey budget** — up to 6 `AskUserQuestion` rounds of ≤4 questions each — see
`.claude/rules/clarifying-questions.md`. This is the one round set re-asked in full for **every**
new application; do not carry answers over from a previous app's plan.

### Round 1 — App identity & auth

What the app does, who uses it, auth method (offer `entra`/`otp`/`password` matching
`platform/src/components/Login/`), desktop-first or mobile-first, single-tenant or multi-tenant.

### Round 2 — Entity / data model

Ask free text first ("what are the main things this app manages?"), then build a **strawman
entity table** (entity, key fields, relationships) from the answer and present it for correction —
don't ask the user to enumerate fields cold. Ask whether the Supabase tables already exist:

- **Yes** → run `npm run gen-supabase-types`, and derive real column names/nullability from
  `src/integrations/supabase/types.ts` for every later strawman. `data_mode: live`.
- **No** → `data_mode: mock` for the affected units. Flag that a "go live" foundation unit will be
  added per domain later (see Step 3) and that mock services live in `src/services/fixtures/` per
  `.claude/rules/service-rules.md`.

### Round 3 — Roles & permissions

`src/lib/constants/roles.ts` is app-owned and **ships empty** — role names are rows in this
portal's own database, so the framework cannot know them and never guesses. Ask for the role list
(don't present a stale one), then a pre-filled entity × role CRUD grid for correction (multiSelect
where useful) rather than asking the user to describe permissions from scratch.

**Also ask in this round: does the portal need a user/role administration screen?** The framework
ships the *service layer* for it and deliberately no page — a permission UI is what every portal
needs differently, so guessing one would be a page every portal then forks. If the answer is yes:

- Don't plan it as ordinary CRUD from scratch. `platform/src/services/{users,roles,screens}.ts`
  already cover the whole `_arch`/`_secure` model (add user, assign/update/remove roles, upsert
  role-screen permissions) — read `docs/architecture/user-administration.md` and make the unit's
  spec *reuse* them, writing only the page, its hooks, and the route.
- Say so explicitly in the unit's `## Reusing` section, or the implementing subagent will rebuild
  ~250 lines of CRUD that already exists.

If the answer is no, add nothing — those services tree-shake out of a build that never imports them.

### Round 4 — Navigation map & page inventory

Derive a strawman from the entity model: per entity, propose list / detail / create-edit pages.
Ask which to keep, merge, or drop, plus any non-entity pages (dashboards, settings). multiSelect.

### Round 5 — Design

**Do not ask about colors, fonts, or tokens here — `.claude/skills/plan-design/SKILL.md` already
owns that interview.** This round only confirms whether the design system needs to change at all
(new brand, or does the org default already fit). The decomposition in Step 3 emits a `kind:
design` unit that runs `plan-design` — with its Step 1 "App identity" question already answered by
this skill's Round 1, so the user is never asked what the app is twice.

### Round 6 — Gates & delivery

**This round is re-asked in full at the start of every new application build — never inherited
from a previous app.**

- Approval granularity: every page's spec gated before code / foundation units only / none.
- Branch-name initials for this app's units.
- Is a git remote configured, and is `gh` or `tea` installed and authenticated? If neither, tell
  the user plainly that the build loop will stop at pushed branches rather than opening PRs — see
  `.claude/skills/build-app/SKILL.md` §Push and PR.

Store all of Round 6's answers in `app.md`'s frontmatter, and copy `gate:` into every unit created
in Step 3 so each unit is self-describing — a unit's gate should never require reading `app.md` to
interpret.

---

## Step 3 — Decompose into units

Deterministic, not a judgment call — apply in this order:

1. **Unit 001 — design tokens**, `kind: design`, `tier: foundation`, unless the user confirmed in
   Round 5 that the org default already fits the app.
2. **One `tier: foundation, kind: infra` unit per domain touched by ≥2 pages** — its types,
   constants, service, and hooks. This is `plan-new-feature`'s "Session 0 — shared foundation" made
   durable as its own unit instead of a plan-only section.
3. **One unit per page** from the Round 4 inventory, `depends_on` its domain's foundation unit plus
   any page it navigates from (e.g. a detail page depends on the list page that links to it, if
   that dependency is meaningful — don't invent dependencies that don't matter to build order).
4. **Topologically sort** all units; break ties by nav order (so the app becomes walkable
   end-to-end as early as possible), then by id.
5. **Enforce `estimate_files <= 5` per unit** (same ceiling `plan-new-feature` already uses) —
   split before writing files if a page unit would exceed it.
6. If any domain is `data_mode: mock`, append one `kind: infra` "go live" unit per such domain,
   `depends_on` every page unit that reads that domain, so it's clearly the last thing to build
   for that domain rather than an afterthought with no place in the order.

Write each unit from `docs/plan/units/_TEMPLATE.md`'s frontmatter schema — `status: draft`, `##
Purpose` filled from what's known so far, everything else left for `.claude/skills/spec-page/
SKILL.md` to fill in just before that unit is built.

---

## Step 4 — Present the plan and wait for approval

Show: the entity model, the permission matrix, the nav map, and the unit list in build order with
dependencies — not each unit's full body (that doesn't exist yet; only `spec-page` fills it).

Ask: "Does this plan look right? Any entities, roles, pages, or ordering to change before I write
it to disk?"

Only proceed to Step 5 after explicit approval.

---

## Step 5 — Write the plan

On one branch, `docs/<initials>-plan-<app-slug>`:

1. Write `docs/plan/app.md` (frontmatter: `app_name`, `auth_method`, `viewport`, `multi_tenant`,
   `gates`, `owner_initials`, `remote_configured`, `planned_on`, `unit_count`; body: `## Overview`,
   `## Entities`, `## Roles`, `## Permission matrix`, `## Navigation map`, `## Page inventory`, `##
   Out of scope`, `## Assumptions`).
2. Write each `draft` unit file under `docs/plan/units/`.
3. Replace CLAUDE.md's `<!-- [PROJECT] ... -->` placeholder in `## Project Overview` with the
   Round 1 answers — this is the one time this skill touches CLAUDE.md, and only if the
   placeholder is still unfilled.
4. Run `npm run docs:plan` and commit the regenerated `docs/plan/ROADMAP.md`.
5. One PR. This is a planning artifact, not implementation — nothing here should trip
   `docs:arch -- --check` or the layering ESLint rules.

Do not create `docs/wip/<branch>.md` for this branch — that registry is for build units; a planning
branch has nothing for another developer to collide with here.

---

## Rules

- Never write files before Step 4's approval.
- Never ask about design tokens — always delegate to `plan-design`.
- Never invent roles not confirmed in Round 3, even if the entity model suggests an obvious one.
- If `docs/architecture/inventory.md` already lists a service/hook/component the entity model would
  need, mark it "reuse" in the relevant unit — do not plan to recreate it.
- Gate policy and remote/PR-CLI availability from Round 6 must be re-asked for every application,
  never inherited or assumed from a previous `app.md`.
