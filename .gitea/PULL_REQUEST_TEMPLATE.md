## What & why

<!-- One paragraph. Link the plan session if this came from plan-new-feature/plan-new-page. -->

## Claim

<!-- docs/wip/<branch>.md — delete this line if you skipped the claim, but the plan skills
     should have emitted it automatically. See CLAUDE.md's "Before Every Task". -->

## Scope check

- [ ] Every changed line traces to the request (CLAUDE.md "Touch only what you must")
- [ ] No drive-by reformatting, no unrelated refactors, no unrequested abstractions
- [ ] `platform/src/components/ui/` untouched — or, if touched, justified below
- [ ] `src/integrations/supabase/types.ts` regenerated via `npm run gen-supabase-types`, not hand-edited
- [ ] The work is recorded in exactly one place: `docs/plan/units/NNN-*.md` (built via
      `build-app`, including its `## Deviations` section) **or** `docs/features/<feature>.md`
      (built manually). A feature doc alongside a unit spec only if the feature spans >1 unit
- [ ] `docs/architecture/<area>.md` updated if durable shared infrastructure changed
- [ ] `docs/wip/<branch>.md` deleted in the final commit
- [ ] `CLAUDE.md` / `.claude/rules/*` updated if a convention changed (should be its own `policy/` branch — see CONTRIBUTING.md)

## Files touched outside the stated scope

<!-- List them and say why. "Claude also changed X" is a valid answer; -->
<!-- "I don't know why this file is in the diff" means revert it. -->

## Mechanical vs. logic

Mechanical (rename/move/format) commits: <sha list, or "none">
