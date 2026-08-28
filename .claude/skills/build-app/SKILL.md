---
name: build-app
description: >
  Use this skill to drive the autonomous build loop for a planned application
  — one unit (page or foundation) at a time, through to a pushed branch and,
  where possible, an opened PR — with minimal human involvement beyond
  per-unit spec corrections and approval gates. Triggers: "build the app",
  "continue the build", "keep going with the plan", "resume the build loop".
  Requires `docs/plan/app.md` and at least one unit under `docs/plan/units/`
  — run `.claude/skills/plan-app/SKILL.md` first if neither exists. Fully
  resumable from on-disk state: a crashed, compacted, or deliberately
  restarted session picks up exactly where it left off by re-running this
  skill, with no in-memory state to lose.
applies_to:
  - docs/plan/
  - autonomous build loop
  - orchestrator
  - unit branches
  - PR automation
---

# Skill: Build the App (orchestrator loop)

Drives `docs/plan/` to completion, one unit at a time: pick the next buildable unit, spec it if
needed, gate it if the app requires that, branch, implement (via a subagent), verify, commit, push,
open a PR if possible, then move on — without waiting for that PR to merge, because the next
unit's own `depends_on` check is what actually enforces build order.

**Read `docs/plan/README.md` before this file** if you haven't already — it explains why `status`
in a unit's frontmatter is local resume state, not a cross-developer signal, and why "merged" is
always derived from `git log`, never stored.

---

## Context budget — the constraint everything else here serves

Building 15+ pages in one session exhausts context unless three things hold, and nothing in this
skill may violate them:

1. **This session never reads implementation files.** Not `src/`, not another skill's body beyond
   what's quoted here, not a unit's full spec body beyond what's needed for the gate digest. Per
   iteration: one line from `npm run plan:next`, the unit's frontmatter (~20 lines), a subagent's
   return summary (~15 lines). That's roughly flat, not growing, across units.
2. **Every unit's implementation is delegated to a subagent** (see IMPLEMENT below). All the
   expensive reading — inventory, rules, skills, existing pages, the code itself — lives and dies
   in the subagent's context, not this one.
3. **Nothing here may depend on in-memory state surviving.** Every loop iteration re-derives what
   to do from `npm run plan:next`, the unit files, and `git log` — never from something decided
   earlier in this conversation and not written to disk. This is what makes "continue the build"
   tomorrow, in a fresh session, work with zero loss.

---

## RECOVER — run this before iteration 1, every session

| Observed | Action |
| --- | --- |
| Unit `approved`, no local branch matching its slug | Start at CLAIM |
| Unit `building`, working tree dirty | `git status`; finish the in-flight change or reset to the last commit, then resume at IMPLEMENT |
| Unit `building`, tree clean, `docs/wip/unit-NNN-*.md` present | Resume at IMPLEMENT |
| Unit `building`, wip claim already deleted, branch unpushed | Resume at PUSH+PR |
| Unit `pr-open`, and `git log origin/main --grep '^\[UNNN\]'` finds it | Nothing to do — `plan:next` already skips it |
| Unit `building`, no origin configured, branch gone, `git log main --grep '^\[UNNN\]'` finds it on local `main` | Already merged locally last session (see PUSH AND PR, branch B) — nothing to do |
| Unit `blocked` | Report it; never auto-retry a blocked unit |

---

## The loop

```
BOOTSTRAP
  git fetch --prune origin              (no-ops cleanly if there is no origin configured yet)
  npm run plan:next                     → U0NN, its file path, its status
  read docs/plan/app.md frontmatter     → gates, owner_initials (remote_configured here is only
                                           what was true at plan time — PUSH AND PR always re-checks
                                           `git remote -v` live, since a remote can be added mid-build)
  run RECOVER above

LOOP, per unit:
 1 PICK       npm run plan:next again (never trust a value from an earlier iteration — see
              context-budget rule 3). If it reports nothing ready, see STOPPING CONDITIONS.
              Before claiming, check RED-MAIN GATE below.
 2 SPEC       if the unit's status is draft: run `.claude/skills/spec-page/SKILL.md` in THIS
              session (never a subagent — it calls AskUserQuestion). Unit becomes spec-ready.
 3 GATE       if the unit's gate is required: show a digest (≤20 lines: title, route, fields,
              actions, files) and AskUserQuestion with options
              [Approve as-is / Change something / Skip this unit / Stop the build].
              "Change something" loops back into spec-page for the specific section, not a full
              re-interview. "Skip" sets status: blocked with a reason and continues to the next
              unit. "Stop" ends the session cleanly — nothing is left half-done because CLAIM
              hasn't happened yet.
 4 CLAIM      see CLAIMING below. On failure (another developer already owns this unit), do not
              retry — go back to PICK.
 5 WIP        write docs/wip/unit-NNN-slug.md, copying the unit's own `## Files` section verbatim
              into Creating/Modifying/Reusing/Not doing (same shape as docs/wip/_TEMPLATE.md — see
              spec-page's Step 3). First commit on the branch. Push.
 6 IMPLEMENT  delegate to a subagent — see IMPLEMENT below. This session does not read src/.
 7 VERIFY     see VERIFY below. On failure, hand the failure output back to the same subagent
              (max 2 retries) before marking the unit blocked.
 8 COMMIT     write the unit's `## Deviations` section FIRST, while the subagent's report is still
              in context — see DEVIATIONS below. Then logic commits; separate `mechanical:` commits
              per CLAUDE.md if any renames/moves happened. Regenerate:
              `npm run docs:arch && npm run docs:plan`, commit the results. If this unit completes a
              feature spanning more than one unit, write `docs/features/<feature>.md` — see
              CROSS-UNIT FEATURES below. Final commit on the branch deletes
              docs/wip/unit-NNN-slug.md.
 9 PUSH+PR    see PUSH AND PR below. With an origin, status becomes pr-open. With no origin, the
              unit is squash-merged straight into local main and gone — there's no pr-open state
              to hold.
10 NEXT       git checkout main (or the default branch); loop back to PICK.
```

Step 10 does **not** wait for the PR to merge. `npm run plan:next` won't offer a unit whose
`depends_on` isn't yet on `origin/main` (or local `main`, if no remote — see `docs/plan/README.md`
on the merge-detection fallback), so the loop runs freely across independent leaves and **pauses
naturally** the moment the next unit needs a dependency reviewed and merged. That pause is the
review checkpoint — it's why a 15-page build doesn't produce 15 unreviewed branches stacked on
each other.

---

## RED-MAIN GATE

With no test framework, `npm run typecheck` on `main`'s own CI run is the only thing standing
between two independently-green PRs merging and their *combination* breaking `main` (two leaf units
each inventing a compatible-looking but different shape for a not-yet-merged foundation type is the
concrete failure mode — foundation-first, in CLAIMING and `plan:next`'s own dependency check,
exists to prevent it in the first place; this gate catches it if it happens anyway).

**Do not claim a new unit while `main`'s latest CI run is red.** Check, when `gh`/`tea` is
available:

```bash
gh run list --branch main --limit 1 --json conclusion,status,headSha   # or: tea's equivalent
```

If neither CLI is available, this check can't run — proceed, but say so rather than silently
skipping it. If red: **the loop whose PR merged second owns the fix**, deterministically, with no
negotiation needed between two developers' loops. Fix it on `fix/<initials>-main-red`, never a
`unit/` branch, and do not claim any new unit until `main` is green again.

---

## CLAIMING

Branch name is the unit id alone, no initials: `unit/<NNN>-<slug>` (`CONTRIBUTING.md`). This is
what makes two developers' independent build loops race-free without any shared lock file — see
`.claude/skills/resolve-conflicts/SKILL.md` for the full multi-developer picture.

```bash
git fetch --prune origin
# Compare-and-swap: an empty <expect> after the colon means "this ref must NOT already exist" —
# the receiving end checks this atomically under its own ref lock. Do not simplify this to a
# plain `git push origin origin/main:refs/heads/X` — if the ref already exists at an older main,
# that form fast-forwards and silently steals another developer's claim.
git push --force-with-lease=refs/heads/unit/003-user-directory: \
    origin origin/main:refs/heads/unit/003-user-directory
```

Exit 0 → this session owns the unit; proceed to WIP. Non-zero → someone else already claimed it;
go back to PICK, do not retry this unit.

If there's no `origin` configured (`git remote -v` empty — true of a fresh skeleton clone), skip
the push and just branch locally; there's nothing to race against yet, and PUSH+PR degrades to
"local commits only" (see below).

```bash
git checkout -B unit/003-user-directory origin/main   # or `main` if no origin
```

Deliberately **no draft PR at claim time** — it would double the CI run count (once at claim, once
at PR) for information the branch ref already carries.

### Sync points — exactly two per unit, both late

Exploit the sequential shape: a unit starts from a freshly fetched `main` and is small (the same
≤5-file ceiling `plan-new-feature` uses), so mid-unit divergence is rare. Never fetch between CLAIM
and IMPLEMENT — that only tempts a rebase of a half-written tree.

- **Before VERIFY:** `git fetch origin main 2>/dev/null; git rev-list --count HEAD..origin/main` —
  if origin/main moved, `git rebase origin/main` (never `git pull`), regenerate `docs:arch` and
  `docs:plan` unconditionally, then verify.
- **Before PUSH+PR:** same check again. If a rebase is needed and this branch's PR (if one already
  exists from a retry) has any review or comment on it, do **not** force-push — comment that a
  rebase is needed, mark the unit `blocked`, and move to the next unit instead of silently
  rewriting reviewed history.

Any rebase conflict → `.claude/skills/resolve-conflicts/SKILL.md`. If that skill says ASK rather
than resolving automatically, follow its escalation procedure (draft PR describing the conflict,
leave the claim ref in place, move on) rather than blocking this session indefinitely.

---

## IMPLEMENT

Delegate to a subagent with **paths, not pasted content** — this session never pays the token cost
of the files it hands off, and the subagent reads current disk state instead of a stale copy:

> Read in order: `CLAUDE.md`, the `.claude/rules/*` files for the layers this unit touches,
> `docs/architecture/inventory.md`, `docs/plan/units/003-user-directory.md`, and
> `.claude/skills/build-datatable/SKILL.md` (or `build-form-page`, matching the unit's `kind`).
> Implement exactly that unit's `## Files` section — create nothing not listed there. **Do not
> commit. Do not push.** Return: files created, files modified, and anything you could not do and
> why.

**Default this subagent call to `model: sonnet`.** The judgment-heavy step in this loop is
`spec-page`'s interview — it runs in this session, not a subagent, precisely because an unasked
question there becomes an unattended wrong page with no one to catch it (see
`.claude/skills/spec-page/SKILL.md`); that's what earns the orchestrating session itself a stronger
reasoning model. IMPLEMENT, by contrast, is executing already-fully-specified instructions from a
prescriptive build skill against a spec that's already been corrected and gated — a good fit for a
cheaper, faster model instead. If a unit's spec flags unusual complexity, or both VERIFY retries
fail on Sonnet, escalate that retry to the orchestrator's own model rather than continuing to retry
on Sonnet.

No committing inside the subagent — commit hygiene (the `mechanical:` split, the blast-radius
statement, deleting the wip claim as the *last* commit) is this session's policy, and a subagent
that commits on its own can leave the tree in a state RECOVER doesn't expect.

The third thing the subagent returns — "anything you could not do and why" — is **not** disposable
progress chatter. It is the only record of the gap between the agreed spec and what shipped, and
step 8 writes it to disk. Do not discard it when compacting; if it is lost, say so in `## Deviations`
rather than writing `None.`

If the unit's `data_mode` is `mock`, the subagent's instructions also point at
`.claude/rules/service-rules.md`'s fixture convention and the unit's `## Data source` section,
which `spec-page` already wrote with the fixture path and the `// MOCK(U0NN): ...` marker.

---

## VERIFY

No test framework exists in this repo — don't invent one here; that's its own future decision (see
`docs/DECISIONS.md`). Run exactly what CI runs, in CI's order, so green locally means green on the
PR:

```bash
npx tsc --noEmit --project tsconfig.app.json   # --project is load-bearing — CI comments why
npm run lint
npm run format:check
npm run docs:arch -- --check
npm run docs:plan -- --check
npm run build
```

**Plus a scope gate:** `git diff --name-only main...HEAD` must be a subset of the unit's `##
Files`. This is CLAUDE.md's blast-radius rule and the PR template's "files touched outside the
stated scope" box, made mechanical — it's the main defence against a subagent that reports "done"
having quietly touched something else. A failure here is not one of the 2 retryable failures below;
tell the subagent exactly which extra file to remove or justify, and only retry once.

On any failure: send the exact failure output back to the same subagent from IMPLEMENT. Max 2
retries total. If still failing, mark the unit `blocked` with the failure as `blocked_reason`,
leave the branch and claim as-is, and move to the next eligible unit — don't leave the loop stuck
on one broken unit while other independent units are ready.

**Optional, per-app opt-in, off by default** (the user chose local CI parity as the default
verification level): a browser smoke check via the preview MCP — `preview_start {name: "dev"}`
(port 8080 per `.claude/launch.json`), navigate to the unit's `route`, `read_console_messages
{onlyErrors: true}` must be empty. This catches `platform/src/routes/registry.ts`'s dev-mode "duplicate
path" / "no exported routes array" console errors. If the unit's route is protected, set
`VITE_DEV_AUTH=true` (plus `VITE_DEV_AUTH_ROLES` if the route has a `requiredRole`) in `.env.local`
and restart the dev server first — see `docs/architecture/auth.md` § Dev auth bypass. It renders
the actual page, not just the redirect, but there is still no database behind it, so a data table
or form will show its own error/empty state rather than real rows.

---

## DEVIATIONS — record what shipped, not only what was agreed

Everything above `## Deviations` in a unit file is **intent**, agreed at the GATE before any code
existed. That section is the only part written after the fact, and it exists because the whole plan
is meant to survive a wholesale regeneration: when the framework changes substantially enough that
re-generating the app beats patching it, these specs are the input. A unit that quietly shipped a
workaround reads as if it shipped clean, and the regeneration walks into the same wall.

Write it at the start of step 8, from the IMPLEMENT subagent's third return value plus what VERIFY
saw. One bullet each:

- anything in `## Files` that could not be done, and why
- any shape the spec assumed that the real schema or a framework component didn't support
- any workaround left in place, and what it would take to remove
- if a VERIFY retry was needed, what failed the first time

Write `None.` when the unit built exactly as specified — an empty section is ambiguous between "no
deviations" and "nobody looked", and only one of those is safe to regenerate from.

Do **not** edit any other section to match reality. If the spec turned out wrong, that fact belongs
here; silently rewriting `## Fields` to match the code destroys the record of the disagreement and
leaves the next reader unable to tell an agreed decision from an after-the-fact patch.

---

## CROSS-UNIT FEATURES — `docs/features/<feature>.md`

A unit file documents one page. It cannot document a flow that spans pages, which is the gap
`docs/features/` fills: **write one only when a feature spans more than one unit**, at the COMMIT
step of the unit that completes it.

Keep it short and strictly about what the unit files cannot say — the flow across pages (which page
hands off to which, and with what), state that outlives a single page, and any invariant the pages
must jointly uphold. Link the unit ids rather than restating their fields, actions or validation:
duplicating a unit's own spec is what CLAUDE.md's "never append to a shared doc" warning is about, and
the copy is guaranteed to rot.

Single-unit features get **no** feature doc. Their unit file already is the record, and a second file
saying the same thing is drift waiting to happen.

---

## PUSH AND PR — host-agnostic

**Check `git remote -v` live, every time this step runs** — not a value cached from `app.md`'s
`remote_configured` or from an earlier iteration this session. A remote can be added mid-build, and
the very next unit must take the other branch below with no manual reconfiguration.

### A. Origin configured

```bash
git push -u origin HEAD
```

Then, in order of preference:

1. `gh` present and authenticated → `gh pr create --title "[U003] <unit title>" --body-file <tmp>`,
   body built from the repo's PR template with the scope box filled from the unit's `## Files`.
2. `tea` present and authenticated → `tea pr create --title "[U003] <unit title>" ...`, same body.
3. Neither available → print the branch's compare URL and record it in the unit under a short
   `## Delivery` note. Tell the user plainly that a PR needs to be opened by hand for this unit —
   don't silently treat "pushed" as "delivered".

The `[UNNN]` title prefix is load-bearing (`CONTRIBUTING.md`): squash-merge carries it into the
commit subject, which is how every unit's merged-ness is derived, never stored. Don't rename a unit
PR's title after opening it.

**Never auto-merge.** That deletes the one human review checkpoint the whole gate design depends
on, and defeats branch protection where it's configured.

### B. No origin configured

There is no PR to bypass a reviewer on here — the GATE step already served as the review, before
any code was written, and nothing has been pushed anywhere for a second developer to see. So this
session merges the unit directly into local `main`, using the same `[U0NN] <unit title>` commit
subject a real squash-merge PR would produce, so `scripts/gen-plan-docs.mjs`'s `isMerged()` picks it
up immediately with no special-casing:

```bash
git checkout main
git merge --squash unit/003-user-directory
git commit -m "[U003] <unit title>"
git branch -D unit/003-user-directory
```

Regenerate `docs:arch`/`docs:plan` and re-run VERIFY on `main` after the merge if the squash pulled
in anything not already checked on the unit branch (it shouldn't, if VERIFY already passed there).
The moment a real `origin` gets configured, the *next* unit's PUSH AND PR takes branch A instead —
this is a live check, not a mode you switch out of by hand.

---

## STOPPING CONDITIONS

- `npm run plan:next` reports all units merged → tell the user the app is complete, stop cleanly.
- It reports units exist but none are ready (all blocked or waiting on unmerged dependencies) →
  report which, and why, then stop — don't poll in a loop burning context waiting for a human to
  merge a PR.
- The user answers "Stop the build" at a GATE → stop immediately; nothing is claimed yet at that
  point in the loop, so there's nothing to clean up.
- Two units in a row end up `blocked`, or a single `blocked` unit sits untouched for 4 hours of
  wall-clock build time → stop and report rather than accumulating parked work silently.

---

## Rules

- Never read a unit's full spec body in this session beyond the ≤20-line gate digest — that
  reading happens inside the IMPLEMENT subagent.
- Never skip the CLAIM push, even solo — it's one round-trip and it's what makes a later second
  developer's build loop safe without this session having to change anything.
- Never wait-poll for a PR to merge. The next unit's `depends_on` check is the wait; if nothing is
  ready, stop and say so.
- Never commit inside the IMPLEMENT subagent.
- Never force-push over a branch whose PR already has a review or comment — mark it `blocked`
  instead (see Sync points above).
- Never auto-merge a PR. When there's no origin at all, PUSH AND PR's branch B merges locally
  because there is no PR and no reviewer being bypassed — that's a different situation, not an
  exception to this rule.
