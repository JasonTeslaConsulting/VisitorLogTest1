# Brand decisions for this portal

**App-owned.** Seeded by `app:init` and never synced afterwards — a framework update will not touch
this file. It records *what this portal decided and why*; the values it decided are implemented in
`src/theme.css`.

| Where | Holds |
| --- | --- |
| `DESIGN.md` (framework, read-only) | The role list, what each role is for, component specs. Its **values are the framework default**, not necessarily this portal's. |
| `src/theme.css` (app) | The values actually in force. The implementation. |
| **this file** (app) | The decisions and their reasons. The record. |

Keep it short. This is a decision log, not a duplicate of the token list — never paste the full
`theme.css` contents here, or the two will drift and neither will be trustworthy.

---

## Status

**This portal has not been rebranded.** It is running the framework default design system
("TC Default Design System" — see `DESIGN.md` §1). There are no overrides yet.

When `.claude/skills/plan-design/SKILL.md` applies a brand, it replaces this section with the
decisions below and deletes this paragraph.

---

## Overrides

One row per deliberate divergence from `DESIGN.md`'s default. If a row's "Why" column is empty,
the decision has no recorded reason, which is itself worth fixing.

| What | Default (DESIGN.md) | This portal | Why |
| --- | --- | --- | --- |
| _(none yet)_ | | | |

## Supplied assets

Logos, favicons and any designer files this brand depends on, and where they came from — so the
next person knows whether a file is authoritative or a placeholder.

| Asset | Path | Source | Placeholder? |
| --- | --- | --- | --- |
| Logo | `public/images/logo.png` | shipped with the skeleton | **yes** — replace per portal |
| Favicon | `public/favicon.ico` | shipped with the skeleton | **yes** — replace per portal |

## Open questions

Anything the client hasn't answered yet. An empty list means the brand is settled.

- _(none)_
