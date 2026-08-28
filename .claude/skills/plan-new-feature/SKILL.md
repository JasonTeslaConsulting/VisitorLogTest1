---
name: plan-new-feature
description: >
  Use this skill when planning a feature that spans multiple pages, services,
  or significant new infrastructure. Triggers: "plan the guest registration
  feature", "plan the admin section", "I want to build X from scratch".
  This skill runs in plan mode — no files are written until the user approves.
applies_to:
  - plan mode
  - multi-page feature
  - new domain
---

# Skill: Plan a New Feature

This skill runs in **plan mode only**. Do not write any files.
Features that span multiple pages should be planned as a whole first,
then broken into per-page implementation sessions.

---

## Step 1 — Read context

Read in order:

1. `CLAUDE.md` — its "Before Every Task" section covers orienting via `git log` and `docs/wip/`
   first; do that before this list
2. `docs/architecture/inventory.md` — generated inventory of what exists; read the relevant
   `docs/architecture/<area>.md` too if one exists
3. `docs/wip/` — check every claim file for overlap with the feature you're about to plan
4. `src/types/` — understand existing domain types to avoid duplication
5. `src/lib/constants/` — understand existing constants
6. Any existing similar feature in `src/pages/` or `src/services/`

---

## Step 2 — Ask clarifying questions

**Scope:**

- How many pages does this feature involve?
- What roles can access which pages?
- Is there shared data between pages (e.g. same service called by multiple pages)?

**Data:**

- Which DB tables are involved? Do they exist yet?
- Are there existing services or hooks that overlap with this feature?
- Any RPCs needed, or can everything be done via the Data API?

**Integration:**

- Does this feature interact with existing features? (e.g. guest registration
  creating records that the staff dashboard reads)
- Are there any external integrations? (SMS, email, etc.)

**Constraints:**

- Any pages that must be built before others (dependencies)?
- Any types or services that are shared and should be built first?

---

## Step 3 — Produce the feature plan

Structure the plan in two parts:

### Part A — Shared foundation (build first, in one session)

Everything shared across the feature:

- New types to add — new domain file(s) in `src/types/`, or additions to an existing one
- New constants to add — new domain file(s) in `src/lib/constants/`, or additions to an existing one
- Shared service file(s) with all functions listed
- Shared hooks

### Part B — Implementation sessions (one session per page/group)

Break the feature into sessions of ~30 minutes each:

```
## Feature Plan: [Feature Name]

### Shared foundation (Session 0 — optional, only if needed)
Types:
  - TypeName: { field: type, ... }
Constants:
  - CONSTANT_NAME = "value"
Services:
  - src/services/domain.ts
    - functionA(params): ReturnType
    - functionB(params): ReturnType

### Session 1 — [Page Name]
Route: /path (protected, requiredRole: ROLES.X)
Pages: src/pages/PageName.tsx
Components: src/components/PageName/...
Services: [list — new or reuse from foundation]
Hooks: src/hooks/domain/useHookName.ts
Types: [new types needed just for this page]
Depends on: [Session 0 / none]

### Session 2 — [Page Name]
...

### Suggested order
Session 0 → Session 1 → Session 2 → ...
Reason: [explain why this order]
```

---

## Step 4 — Recommend starting point

After presenting the plan, tell the user:

"To start implementing, switch out of plan mode and say:
'Read docs/architecture/inventory.md and docs/wip/ first. Read .claude/skills/[relevant-skill]/SKILL.md.
Implement Session 1: [Page Name]. [paste any relevant spec inline]'"

---

## Step 5 — Wait for approval

Stop after presenting the plan. Do not start implementing.
Ask: "Does this breakdown look right? Should any sessions be merged or split differently?"

---

## Step 6 — Claim the work

Once approved, write `docs/wip/<branch-name>.md` (template at `docs/wip/_TEMPLATE.md`) as the
first commit on the branch — one claim file per feature, even if it spans several sessions.
Update it if a later session's scope changes materially. See `CLAUDE.md`'s "Before Every Task"
step 5. Each session maps to exactly one branch and one PR (see `CONTRIBUTING.md`) — don't let a
5+ file session ride inside another session's branch.

---

## Rules

- Never write files in plan mode
- If a service already exists, note "reuse" — never plan to recreate it
- Sessions must be small enough to complete in ~30 minutes
- A session with more than 5 new files is probably too large — split it
- Shared types and services should always be in Session 0 if multiple pages use them
- Always check `docs/architecture/inventory.md` before listing new services/hooks — they may
  already exist

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
