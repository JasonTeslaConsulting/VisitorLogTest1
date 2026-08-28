---
name: spec-page
description: >
  Use this skill to fill in a `draft` build unit's spec, just before that unit
  is built — never far in advance of building it. Triggers: "spec out unit
  U003", "fill in the next page's spec", called automatically by
  `.claude/skills/build-app/SKILL.md` at the SPEC step of its loop. Builds a
  strawman spec from the app plan and real schema, then has the user correct
  it rather than asking open-ended questions. Runs in the orchestrator's own
  session, never in a subagent — a subagent cannot ask the user anything.
applies_to:
  - docs/plan/units/
  - just-in-time page spec
  - AskUserQuestion interrogation
---

# Skill: Spec a Page (just-in-time)

This is where the detailed, per-page "grilling" happens — not at app-planning time (that's
`.claude/skills/plan-app/SKILL.md`, which stays shallow on purpose), and not by asking the user to
write a spec from a blank page. Fill in one `draft` unit's body, in place, right before
`.claude/skills/build-app/SKILL.md` builds it.

**Never run this in a subagent.** Subagents cannot call `AskUserQuestion` — asking the user is the
entire point of this skill.

---

## Step 1 — Read context

1. `docs/plan/app.md` — entity model, permission matrix, nav map, `data_mode`.
2. `docs/architecture/inventory.md` — what already exists; never re-plan a service/hook/component
   that's already there.
3. `src/integrations/supabase/types.ts` — real column names, types, and nullability for this
   unit's `domain`, if `data_mode: live`. If `data_mode: mock`, read the domain's existing fixture
   file in `src/services/fixtures/` if one already exists from an earlier unit in the same domain.
4. The nearest existing page in `src/pages/` of the same `kind` — used as the layout/pattern
   reference for the strawman, not copied wholesale.
5. The relevant build skill for this unit's `kind` (`build-datatable` or `build-form-page`) — its
   fixed defaults (page layout, container widths, Pagination/SearchBar/RefreshButton, validation
   pattern) are never asked about; they're inherited as-is.

---

## Step 2 — Build the strawman, then ask

**Always build a complete strawman spec before asking anything.** The user reacting to real column
names and a concrete proposal produces a better, faster answer than being asked to recall or
invent field lists from scratch — that's the whole reason this skill exists instead of a blank
"describe the page" prompt.

Draft every section of the unit body (`## Fields`/`## Actions` etc. — see
`docs/plan/units/_TEMPLATE.md`) from: the unit's own frontmatter (`kind`, `domain`, `route`,
`required_role`), the app-level entity/permission/nav data, and real schema columns. Then present it
and ask the user to **correct**, not originate.

Uses the **spec budget** — up to 6 `AskUserQuestion` rounds of ≤4 questions, plus free text — see
`.claude/rules/clarifying-questions.md`. It's a ceiling, not a target: stop the instant `## Open
questions` is empty. A well-specified read-only table typically resolves in 2 rounds. Skip any
round entirely if the strawman leaves nothing uncertain there.

### Round 1 — Kind, data source, route/role, template, scope ceiling

Pre-filled single-selects confirming what's already implied by the unit's frontmatter and the app
plan (kind, table/RPC/service to use, route + role). Only ask what isn't already settled.

**Always settle `template:` and `template_props:` in this round** for any unit whose `kind` is not
`infra`/`design`. Read `platform/src/templates/registry.ts` and propose a template **plus a value for each of
its `options`** — templates are named by arrangement, not by job, so match on the holes the page
needs rather than on the unit's `kind` (there is no "Form page" template; a form is usually
`single-card` at `width: narrow`). Use each entry's `description` as the option description and its
`commonlyUsedFor` to explain the fit. Mention that live previews exist at `/sample/templates`, where
the props toolbar makes each configuration linkable (`?width=narrow`), if the user wants to look
before choosing.

This is the step that makes templates survive an unattended build: `.claude/skills/build-app/
SKILL.md`'s IMPLEMENT subagent has no one to ask, and reads `template:` to know which shell to
import. A unit that reaches `spec-ready` with `template: null` will get a freehand frame.

### Round 2 — Fields

multiSelect over the real columns found in Step 1: "Here are the N columns on this table —
deselect any you don't want shown/editable." Also ask default sort and page size (offer the
skeleton default, 25, as a one-click accept) and, for a datatable, which fields are filterable.

**If the unit has a confirmation page, its summary rows are a separate question** — propose a set
and confirm it. Do not assume it mirrors the submitted fields: a reference id, a status and a
submitted-at timestamp are server-generated and are usually the rows the reader came for, while
plenty of submitted fields are not worth echoing back.

### Round 3 — Actions

Row and page-level actions (edit, delete, view, custom verbs), which need an `AlertDialog`
confirmation (destructive ones always do — `.claude/rules/components-rules.md`), and where a
successful mutation navigates the user back to.

For any action that opens a **form**, record the container in the spec — a side sheet or a modal,
both valid per DESIGN.md §6. Default to a **side sheet** for anything opened from a datatable and
confirm it; the implementing subagent runs unattended and cannot ask. Destructive confirmations
are unaffected and stay `ConfirmDialog`.

**A confirmation page's actions must be recorded per control, with their destinations.** A
confirmation typically carries a primary ("Done") and a quieter secondary ("Back to home"); where
each one leads is a flow decision the form cannot imply. **Two controls with one destination is a
smell** — if that is what the user wants, record it explicitly so the implementing subagent is not
guessing. Same reasoning as the container question above: the subagent runs unattended and cannot
ask.

Either container discards unsaved input when it closes, so note that the form is guarded with
`useUnsavedChangesGuard` (`.claude/skills/build-form-page/SKILL.md`). Lint enforces it, so a spec
that omits it produces a build failure rather than a silent gap.

### Round 4 — Validation (forms only; skip entirely for a read-only page)

Required vs optional per field, cross-field rules, anything beyond what a `zod` schema derived
from the column types would already enforce.

### Round 5 — States and permissions

Empty-state copy and CTA (if any), error copy, what a lower role sees for this page — hidden
entirely vs visible-but-disabled — and confirm this agrees with the unit's `required_role`.

### Round 6 — Free text

"What did the strawman get wrong?" Always ask this one, even when rounds 1-5 needed nothing —
it's the catch-all for anything the strawman couldn't have known.

Every option in every round carries a one-line consequence ("25/page — skeleton default" vs
"50/page — heavier initial query") so the user is choosing outcomes, not vocabulary.

---

## Step 3 — Write the spec

Rewrite the unit file in place:

- Fill every body section from `docs/plan/units/_TEMPLATE.md` — `## Purpose` through
  `## Permissions`. Write "n/a — read-only view" rather than omitting `## Validation` for a
  non-form unit.
- **Leave `## Deviations` exactly as the template has it.** It is written after the unit is built,
  by `.claude/skills/build-app/SKILL.md`'s COMMIT step, and it is the one section that records
  outcome rather than intent. Filling it here would fabricate a build result for a unit that hasn't
  been built.
- `## Files` — `### Creating` / `### Modifying shared files` / `### Reusing` / `### Not doing`,
  deliberately in the same shape as `docs/wip/_TEMPLATE.md`, because `.claude/skills/build-app/
  SKILL.md` copies this section verbatim into the unit's wip claim. Don't leave anything for that
  copy step to re-derive.
- Recompute `touches` and `estimate_files` in the frontmatter from the final `## Files` list. If it
  now exceeds 5, stop and tell the user this unit needs splitting — same ceiling
  `plan-new-feature` already uses — rather than writing an oversized spec.
- `template:` — must hold a real `id` from `platform/src/templates/registry.ts` (not `null`) unless `kind` is
  `infra`/`design`, and `template_props:` must name a value for each of that entry's `options` keys.
  `## Layout` then records only what *differs* from that template; never re-describe width, header
  placement or card wrapping the shell already owns, or page-edge padding (that's `PageLayout`'s
  job — DESIGN.md §7).
- `## Open questions` — must end **empty**. If something is still unresolved after Round 6, ask a
  direct follow-up rather than leaving it open; an unattended subagent will build from this file
  next with no one to ask.
- Set `status: spec-ready`.
- Set `spec_source` to today's date (informational only — not consumed by tooling).

Do **not** run `npm run docs:plan` yet if this is happening inside `build-app`'s loop — that
regeneration happens once, after the unit's branch and wip claim exist, per
`.claude/skills/build-app/SKILL.md`'s COMMIT step. If this skill is invoked standalone (not from
the loop), regenerate immediately after writing the file.

---

## Rules

- Never ask a question the strawman already answers correctly — if in doubt, propose it and ask
  for correction rather than asking open-ended.
- Never invent a field, action, or role not present in the schema, the app plan, or an explicit
  user answer.
- Never leave `## Open questions` non-empty when setting `status: spec-ready`.
- If the unit's `data_mode` is `mock`, note in `## Data source` that the service reads
  `src/services/fixtures/<domain>.ts` and carries the `// MOCK(U0NN): ...` marker comment — see
  `.claude/rules/service-rules.md`.
- If this unit's `touches.shared_ui` or `touches.tokens` would need to be non-empty/true, stop —
  that's only valid for a `tier: foundation` unit (`docs/plan/README.md`); tell the user the page
  needs a new shared component or token first, as its own foundation unit.
