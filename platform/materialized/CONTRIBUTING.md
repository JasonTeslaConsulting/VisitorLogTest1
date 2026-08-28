# Contributing

This repo is built for 2–4 developers working the same codebase concurrently, each driving their
own Claude Code session. The conventions below exist to keep that low-friction — see
`docs/architecture/*.md` (indexed from `ARCHITECTURE.md`) for what's already built.

## Branching model

Trunk-based development. No `develop` branch, no long-lived feature branches.

- **Branch naming:** `<type>/<initials>-<slug>`, e.g. `feat/jl-user-management-table`,
  `fix/jl-datepicker-blur-parse`, `policy/jl-add-icon-rule`.
  Types: `feat`, `fix`, `chore`, `docs`, `policy`.
  `policy/` is its own type — changes to `CLAUDE.md` or `.claude/**` should never ride inside a
  feature PR where they're unlikely to get read on their own merits.
- **`unit/<NNN>-<slug>` — a sixth type, no initials, for `.claude/skills/build-app/SKILL.md`'s
  autonomous build units only.** Deliberately dropping initials is what makes claiming a unit
  race-free across two developers' build loops: both generate the exact same branch name from the
  unit id, so git's own compare-and-swap on ref creation (`push --force-with-lease=refs/heads/
  unit/NNN-slug:`) is the lock — see `docs/plan/README.md` and `.claude/skills/resolve-conflicts/
  SKILL.md`. Developer identity for a unit branch lives in the commit author and the `docs/wip/`
  claim, not the branch name.
- **PR title prefix `[UNNN]` for unit branches.** Squash-merge carries the PR title into `main`'s
  commit subject, and that's how a unit's merged-ness is derived — never stored, see
  `docs/plan/README.md`. Don't rename a unit PR's title after opening it.
- **Lifetime:** target under 2 days, hard ceiling 5 days. One planning "session" (see
  `.claude/skills/plan-new-feature/SKILL.md`'s own ">5 new files, split it" rule) maps to one
  branch and one PR.
- **Rebase onto `main` before opening a PR**, and again before every re-review round. Never rebase
  silently after review has started — say so, and use `--force-with-lease`, never a bare
  `--force`.
- **Squash-merge into `main`.** Agent sessions produce noisy intermediate commits; squash keeps
  `main` at one commit per shipped unit of work. This matters beyond tidiness — a Claude session
  starting up reads `git log --oneline -20 main` as its first orientation step, and that's only
  useful if history is one line per feature.

Not git-flow (one release line here — a `develop` branch just doubles where docs can go stale) and
not stacked PRs (a review-latency tool for larger teams; Gitea doesn't support it and this team
doesn't have the latency problem it solves).

## Required checks

One CI workflow (`.gitea/workflows/ci.yml` and `.github/workflows/ci.yml` — kept byte-identical,
edit one and copy to the other) runs on every PR and push to `main`:

1. `npm run typecheck` — `tsc --noEmit --project tsconfig.app.json`. **The `--project` flag is
   required**; a bare `tsc --noEmit` silently checks zero files on this repo's project-references
   `tsconfig.json`.
2. `npm run lint`
3. `npm run format:check`
4. `npm run build` — catches import/alias/Tailwind-plugin failures. This does **not** typecheck
   (Vite's transformer strips types without checking them) — that's what step 1 is for.

## Branch protection (configure once, on whichever host you use)

There's no remote configured in this repo yet. Once you push to Gitea or GitHub, turn this on
before a second developer starts:

**GitHub** — *Settings → Branches → Add branch protection rule* for `main`:
- Require a pull request before merging, 1 approval, dismiss stale approvals on push
- Require status checks to pass (`verify`), require branches to be up to date before merging
- Do not allow force pushes; do not allow deletions

**Gitea** — *Settings → Branches → Branch Protection* for `main`:
- Enable protection, require 1 approval
- Enable status check, select `verify`
- Block force push
- Gitea's protection UI does not have GitHub's "require code owner review" toggle — see
  `docs/OWNERS.md` for how ownership degrades gracefully here.

## Pull requests

Use the PR template (`.gitea/PULL_REQUEST_TEMPLATE.md` / `.github/PULL_REQUEST_TEMPLATE.md`).
The most important box on it is **"files touched outside the stated scope"** — agents produce
wider diffs than humans by default; that box is where a reviewer catches it early. See
`CLAUDE.md`'s "Keeping diffs reviewable" section for the full etiquette this is built on.
