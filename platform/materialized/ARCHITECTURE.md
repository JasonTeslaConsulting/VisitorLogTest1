# ARCHITECTURE.md

> This file is a pointer, not the inventory. It changes rarely. See `CLAUDE.md`'s
> "Before Every Task" for how to use it alongside `git log` and `docs/wip/`.

- **What exists, generated:** `docs/architecture/inventory.md` (run `npm run docs:arch` to
  regenerate — never hand-edit it).
- **Why it's built the way it is, hand-written:** `docs/architecture/auth.md`,
  `docs/architecture/routing.md`, `docs/architecture/navigation.md`, `docs/architecture/ui.md`,
  `docs/architecture/config.md`, `docs/architecture/storage.md`.
- **What a specific feature does:** `docs/features/<feature>.md` — one file per feature, created
  by whoever builds it. Never append feature notes to a shared doc.
- **What's in flight right now:** `docs/wip/*.md`.
- **Before starting a new app build:** `docs/PREFLIGHT.md` — the human-side setup
  `.claude/skills/plan-app/SKILL.md`/`build-app` deliberately never does for you (git hosting, DB/
  auth, local tooling, team alignment).

Rule of thumb: generated answers "does X exist and what's it called?"; hand-written answers
"why is it like that, and what will bite me?"
