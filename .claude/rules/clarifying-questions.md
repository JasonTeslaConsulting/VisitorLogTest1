# Rules: clarifying-question budgets

Every planning skill needs a ceiling on how many questions it asks — otherwise a session either
guesses (wrong output) or interrogates forever (nobody finishes planning). The right ceiling
depends on what happens to the answers, so there are three named budgets instead of one universal
number. Each skill states which budget it uses; do not invent a fourth without adding it here.

## Planner budget — 3 to 5 questions

**Used by:** `.claude/skills/plan-new-page/SKILL.md`, `.claude/skills/plan-new-feature/SKILL.md`,
`.claude/skills/plan-debug/SKILL.md`.

The answers are consumed once, in this session, to produce a plan the user approves before any
code exists. If more than 5 questions seem necessary, the scope is too large — split the task and
plan the pieces separately, don't ask more questions of the same plan.

## App-survey budget — up to 6 `AskUserQuestion` rounds of ≤4 questions

**Used by:** `.claude/skills/plan-app/SKILL.md`.

This runs once per application and its answers seed every unit's plan — an entity model, a
permission matrix, or a nav map answered shallowly here produces N wrong page specs later, not one
wrong plan. That is a materially larger blast radius than a single-page plan, which is what earns
it a larger ceiling than the planner budget. It is still a ceiling, not a target: stop as soon as
app identity, entities, roles, nav map, and gates are all answered with no open ambiguity.

## Spec budget — up to 6 rounds of ≤4 questions, plus free text

**Used by:** `.claude/skills/spec-page/SKILL.md` only.

The answers are persisted to a durable per-unit spec file and are the **sole input to an
unattended implementation subagent** — there is no human in the room when that subagent builds the
page. An unasked question here costs a wrong PR, not a longer chat, which is why this budget is
larger than the planner budget and why `spec-page` is exempt from it. It is still a ceiling, not a
target: stop the moment the unit's `## Open questions` section is empty. See
`.claude/skills/spec-page/SKILL.md` for the strawman-first technique that keeps most units well
under the ceiling — a corrected strawman usually resolves in 2 rounds, not 6.
