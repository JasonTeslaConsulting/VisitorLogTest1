---
name: plan-new-page
description: >
  Use this skill when planning a single new page before generating code.
  Triggers: "plan a page", "I want to build a page", "plan the X page".
  This skill runs in plan mode — no files are written until the user approves.
applies_to:
  - plan mode
  - new page
  - single route
---

# Skill: Plan a New Page

This skill runs in **plan mode only**. Do not write any files.
Read the codebase, ask clarifying questions, produce a plan, then wait for approval.

---

## Step 1 — Read context (do this before anything else)

Read these files in order:

1. `CLAUDE.md` — architecture rules and conventions (its "Before Every Task" section covers
   orienting via `git log` and `docs/wip/` — do that first, not this list)
2. `docs/architecture/inventory.md` — generated; what services/hooks/components/routes exist.
   Read the relevant `docs/architecture/<area>.md` too if one exists for this area
3. `docs/wip/` — check every claim file for overlap with what you're about to plan
4. The relevant skill for the page type:
   - Data table page → `.claude/skills/build-datatable/SKILL.md`
   - Form page → `.claude/skills/build-form-page/SKILL.md`
   - Dashboard/stats → check `docs/architecture/inventory.md` for existing patterns
5. Any existing similar page in `src/pages/` — use it as a reference for patterns

---

## Step 2 — Ask clarifying questions

Before producing a plan, ask the user these questions if not already answered:

**Data:**

- What is the data source? (which table, RPC, or existing service?)
- Does the table/RPC exist in the DB already?
- Are there existing service functions or hooks for this data, or do they need to be created?

**Page type:**

- Is this a data table page, form page, or a combination?
- Are there filters? If yes, what fields?
- Are there row actions? (edit, delete, checkout, etc.)

**Access:**

- Is this public or protected?
- If protected, which role(s) can access it?
- What is the route path?

**UI:**

- Which template, and at which prop values? Read `platform/src/templates/registry.ts` and match on the
  **holes** this page needs — templates are named by arrangement, not by job, so there is no "Form
  page" entry (a form is usually `single-card` at `width: narrow`). Offer them with each entry's
  `description` as the option description, and use `commonlyUsedFor` to explain the fit. Offer the
  live preview too: `preview_start {name:"dev"}` then
  `http://localhost:8080/sample/templates`, where the props toolbar switches each configuration live
  and every one is linkable (`?width=narrow`). You can also screenshot two variants for a
  side-by-side in chat.
  This **replaces** the older "any specific layout requirements beyond the skeleton defaults?"
  question rather than adding to it — the planner budget stays net-zero.
- Any edge cases to handle (empty state, loading, errors)?

Do not assume answers. Ask before proceeding.

---

## Step 3 — Produce the plan

After answers are received, produce a plan in this format:

```
## Plan: [Page Name]

### Route
- Path: /path
- Access: public | protected (requiredRole: ROLES.X)
- Layout: default | none          (route chrome)
- Template: <registry id>          (page frame — from platform/src/templates/registry.ts)

### Files to create
- src/pages/PageName.tsx
- src/components/PageName/PageNameTable.tsx  (if datatable)
- src/components/PageName/PageNameForm.tsx   (if form)
- src/components/PageName/PageNameFilterPanel.tsx (if filters)
- src/services/domain.ts  (or note if already exists)
- src/hooks/domain/useEntityName.ts (or note if already exists)
- src/hooks/domain/useEntityMutations.ts (if mutations needed)

### Files to modify
- src/routes/modules/<area>.routes.tsx — add route (create the module if the nav area doesn't
  have one yet; see `.claude/skills/add-new-route/SKILL.md` for the split trigger if it does)
- src/types/<domain>.ts — add types (list them; create the domain file if new)
- src/lib/constants/<domain>.ts — add any new constants
- docs/features/<feature>.md — create after completion (never append to a shared doc). On this
  manual path it is the only durable record of the page's behaviour, since there is no
  `docs/plan/units/NNN-*.md`. A page built through `.claude/skills/build-app/SKILL.md` is recorded
  by its unit spec instead — don't write both for one page
- docs/architecture/<area>.md — update after completion, only if durable shared infra changed

### Types needed
[List each new type and its key fields]

### Service functions needed
[List each function, its params, return type, and whether it's new or existing]

### Hook(s) needed
[List each hook and which service function it wraps]

### Key implementation notes
[Any non-obvious decisions, edge cases, or things to watch out for]

### What NOT to create
[Explicitly list anything that might be tempting to create but shouldn't be —
e.g. "do not create a generic DataTable", "do not add new shadcn components"]
```

---

## Step 4 — Wait for approval

Present the plan and stop. Do not start implementing.
Ask: "Does this plan look right? Any changes before I start?"

Only proceed to implementation after explicit approval.

---

## Step 5 — Claim the work

Once approved, write `docs/wip/<branch-name>.md` (template at `docs/wip/_TEMPLATE.md`) as the
first commit on the branch, using the "Files to create" / "Files to modify" sections from Step 3
verbatim under "Creating" / "Modifying shared files". Don't re-derive it — the claim file is the
plan, just filed. See `CLAUDE.md`'s "Before Every Task" step 5.

---

## Rules

- Never write files in plan mode
- If a service or hook already exists in `docs/architecture/inventory.md`, note "reuse existing" —
  do not recreate
- If the DB table doesn't exist yet, note service functions as placeholder stubs
- Keep the plan scoped to 30 minutes of implementation or less
- If the request is too large for one plan, split it and propose the split to the user

## What to ask vs what to decide

**Decide yourself (do not ask):**

- Any implementation detail covered by CLAUDE.md or a skill file
- File locations, naming, export style, component structure
- Which shared components to use (Pagination, SearchBar, etc.)
- staleTime values, query key structure, hook patterns
- Styling decisions covered by DESIGN.md, and layout/dimension/container conventions (button
  sizing, container types, spacing scale, composition patterns) — these are fixed skeleton
  behavior baked into the shared components and other build skills, not a per-page choice.
  **One narrow exception:** whether a form opens in a side sheet or a modal is asked, not decided
  (below). Everything else in this bullet stays yours to settle
- Everything the chosen template already owns: header placement, card wrapping. Pick the
  template; never re-specify its frame. Page-edge padding and max content width are `PageLayout`'s
  job, not the template's or the page's (DESIGN.md §7)

**Ask the user (product decisions only):**

- Page content: what data, what columns, what actions
- Access control: which roles, which route path
- Business rules: what happens on submit, what triggers what
- **Side sheet or modal**, for any form the page opens. Both are valid containers (DESIGN.md §6),
  so this is asked rather than assumed — offer the standing default as the pre-selected answer:
  **side sheet for anything opened from a datatable**. Destructive confirmations are not part of
  this question; they stay `ConfirmDialog`. See `.claude/skills/build-form-page/SKILL.md`
- UX choices with no clear skeleton default

**Recommend and confirm (one yes/no, not a discussion):**

- Layout choices not covered by skills: "I'd suggest tabs — OK?"
- Default values: "I'll use the skeleton default of 25 rows — OK?"
- Ambiguous requirements: "I'll treat this as optional — OK?"

This skill uses the **planner budget** (3-5 questions) — see `.claude/rules/clarifying-questions.md`.
If you have more than 5 questions, the scope is too large — suggest splitting the task first.
