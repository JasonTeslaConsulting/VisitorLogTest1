# Policy decisions

Append-only. One line per change to `CLAUDE.md`, `.claude/rules/*`, or `.claude/skills/*`.
Newest at the bottom. Cite the PR — a squashed diff of a markdown file doesn't say *why*.

- 2026-08-31 — Visitor Log initialised from the portal template
  via `npm run app:init`. The framework's own decision history lives in the framework repo, not
  here; this log is for decisions made *by this portal*. See `platform/framework.json` for what
  this portal owns versus what the framework owns, and `CLAUDE.md`'s “extend, never edit”
  section before changing anything under `platform/`.
