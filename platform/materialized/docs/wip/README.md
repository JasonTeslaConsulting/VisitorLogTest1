# Work-in-progress claims

One file per branch: `docs/wip/<branch-with-slashes-as-dashes>.md`

e.g. branch `feat/jl-user-management-table` → `docs/wip/feat-jl-user-management-table.md`

**Why one file per branch:** two branches never edit the same file, so this directory never
produces a merge conflict — unlike appending to a shared doc.

## Lifecycle

1. The first commit on the branch creates it.
2. Update it if scope changes materially.
3. **The final commit on the branch deletes it.** A file here on `main` means either a live branch
   or an abandoned one — both are worth noticing.

## Every Claude session must read this directory before planning

`ls docs/wip/` and read every file. If a claim overlaps your intended work, stop and tell the user
before creating anything. See `CLAUDE.md`'s "Before Every Task" section.

## Where the claim file comes from

Don't hand-write this. `.claude/skills/plan-new-page/SKILL.md` and
`.claude/skills/plan-new-feature/SKILL.md` both emit it directly from the "Files to create" /
"Files to modify" list they already produce — the claim can't drift from the plan because it *is*
the plan.
