---
name: resolve-conflicts
description: >
  Use this skill when a rebase (or merge) hits a conflict in this repo —
  especially during `.claude/skills/build-app/SKILL.md`'s autonomous build
  loop, but equally for any manual rebase-before-PR. Triggers: "rebase
  conflict", "merge conflict", "resolve this conflict", "CONFLICT (content)".
  Classifies the conflicted file and tells you whether it's safe to
  auto-resolve or must stop and ask a human — see `decision-table.md` for the
  full per-file-class table.
applies_to:
  - git rebase
  - merge conflicts
  - docs/architecture/inventory.md
  - docs/plan/
  - src/routes/modules/
---

# Skill: Resolve a Git Conflict

Read `decision-table.md` in this same directory for the full per-file-class table. This file is
the procedure that wraps it.

---

## Orientation — read this before touching any hunk

`CLAUDE.md` already says: "On a rebase conflict, re-read both sides and `git log -1 <their-sha>`
before resolving. If the other side's intent is unclear, stop and ask." Do that first:

```bash
git status --short                                    # the conflicted set (UU/AA/DU/UD)
git log -1 --format='%h %an%n%n%B' REBASE_HEAD         # your own commit, mid-rebase
git log -1 --format='%h %an%n%n%B' HEAD                # the tip you're replaying onto
git log --oneline HEAD~5..HEAD                         # what landed while you were working
```

**This repo's workflow is rebase-before-PR, squash-merge (`CONTRIBUTING.md`) — every conflict this
skill sees is a rebase conflict, never a merge conflict.** That matters because rebase inverts the
usual meaning of `--ours`/`--theirs`:

> **During a rebase, `--ours` is the upstream you are replaying onto (`origin/main`'s tip), and
> `--theirs` is your own commit.** This is backwards from a merge. Getting it right matters most
> on files where taking the wrong side silently drops content — `src/types/<domain>.ts` loses
> someone's types; getting it wrong on a generated file like `docs/architecture/inventory.md` is
> harmless because it's regenerated anyway (see the decision table).

Every command in `decision-table.md` is written for this rebase convention. If you are ever
resolving an actual merge (not a rebase) instead, invert every `--ours`/`--theirs` reference below.

---

## Procedure

1. Run the orientation commands above.
2. For each conflicted file, look up its class in `decision-table.md`.
3. **AUTO** rows: resolve using the exact commands given, no confirmation needed.
4. **AUTO + VERIFY** rows: resolve, then run the named verify command before trusting the
   resolution — if it fails, treat the file as **ASK** instead of retrying blindly.
5. **ASK** rows: do not resolve. Follow "When this skill is running unattended" below.
6. Once every file is staged, always run, in order, before `git rebase --continue`:
   ```bash
   npm run docs:arch && npm run docs:plan
   npm run format
   npm run typecheck && npm run lint && npm run format:check && npm run build
   git add -A && git rebase --continue
   ```
   Never skip straight to `--continue` after resolving hunks by hand — a conflict resolution that
   compiles in isolation can still break `typecheck` across the two sides' combined changes, which
   is exactly the failure mode foundation-first units exist to prevent.

---

## When this skill is running unattended (inside `build-app`'s loop)

An autonomous loop cannot block forever on an **ASK** row, and it must not guess. On hitting one:

```bash
git rebase --abort                     # leaves the branch self-consistent, pre-rebase
git push --force-with-lease origin unit/NNN-slug
```

Then open a **draft** PR (draft is fine here — this is a terminal state, one CI run, and the PR
*is* the notification channel, unlike at claim time where a draft would double CI for no reason):

- Title: `[UNNN] <unit title> [BLOCKED: rebase conflict]`
- Body: which file(s) conflicted, the other side's commit sha + subject + author, and one sentence
  naming the actual decision a human needs to make (not just "there was a conflict").

Write a `## BLOCKED` section into the unit's `docs/wip/<branch>.md` claim, set the unit's
`blocked_reason`, and **leave the claim ref in place** — the unit is still owned, just parked, not
released back for another developer to claim. Then move on to the next eligible unit rather than
stalling the whole loop on one conflict.

Bounds, so parked work doesn't accumulate silently: after **2** units end up blocked, or a single
blocked unit sits untouched for **4 hours** of wall-clock build time, stop the loop entirely and
report — don't keep parking more work behind an unresolved decision.

---

## Rules

- Never resolve an **ASK** row automatically, even if the resolution looks obvious from the diff —
  the row exists because an agent reading only the diff is missing context a human has (design
  intent, review state, which customization is at risk).
- Never skip the closing verify sequence in step 6, even for an **AUTO** row.
- Never treat a merge-conflict resolution technique as valid for a genuine (non-rebase) merge
  without inverting `--ours`/`--theirs` first.
- Never silently drop a hunk to make `--continue` succeed — an **ASK** row that gets "resolved" by
  discarding one side is a data-loss bug wearing a green checkmark.
