# Policy decisions

Append-only. One line per change to `CLAUDE.md`, `.claude/rules/*`, or `.claude/skills/*`.
Newest at the bottom. Cite the PR — a squashed diff of a markdown file doesn't say *why*.

- 2026-07-27 — `ARCHITECTURE.md` demoted from "the inventory" to a thin pointer.
  `docs/architecture/inventory.md` (generated, `npm run docs:arch`) is now the inventory;
  `docs/architecture/<area>.md` holds the hand-written "why". Reason: a hand-maintained doc
  cannot track N concurrent branches — `git log` and `docs/wip/` are the ground truth instead.
  (c4b82cb)
- 2026-07-27 — Routes moved from `src/routes/routeConfig.tsx` (one shared file, edited twice per
  page) to `src/routes/modules/<area>.routes.tsx`, auto-discovered via `import.meta.glob` in
  `src/routes/registry.ts`. Reason: worst merge-conflict hotspot in the repo. (c4b82cb)
- 2026-07-27 — Types (`src/types/index.ts`) and constants (`src/lib/constants.ts`) sharded into
  one file per domain, with the original path kept as a compat barrel. Reason: same append-only
  hotspot problem as routes, at smaller scale. (c4b82cb)
- 2026-07-27 — `docs/features/<feature>.md` replaces appending to a shared "what's built" doc —
  one new file per feature. Reason: two developers shipping two features should never touch the
  same doc file. (c4b82cb)
- 2026-07-27 — `docs/wip/<branch>.md` work-claim registry introduced, emitted automatically by
  `plan-new-page`/`plan-new-feature`. Reason: prevent two agents building the same component in
  parallel with no way to see each other's in-flight work. (c4b82cb)
- 2026-07-27 — Layering rules (`architecture-rules.md`'s Pages → Hooks → Services → Supabase, and
  Base UI only through `src/components/ui/`) now machine-checked via `no-restricted-imports` in
  `eslint.config.js`, not just prose. Reason: prose enforcement breaks when a different developer's
  agent session has different context. (c4b82cb)
- 2026-07-27 — `build-form-page/SKILL.md` given YAML frontmatter (`name`/`description`/
  `applies_to`) matching its ten siblings. Reason: it was the only skill missing frontmatter and
  was likely not auto-discoverable by description matching. (uncommitted — this session)
- 2026-07-27 — Service file naming resolved to `src/services/<domain>.ts` everywhere.
  `service-rules.md` and the real files (`src/services/users.ts`) already agreed; six other skills
  (`build-datatable`, `build-form-page`, `call-api`, `add-types`, `plan-new-page`,
  `plan-new-feature`) still said `<domain>Service.ts`. Reason: a live naming contradiction across
  skill docs, caught while auditing for autonomous-build readiness. (uncommitted — this session)
- 2026-07-27 — `staleTime` source of truth resolved to the tiered `STALE_TIMES` constant
  (`src/lib/constants/app.ts`), not `appConfig.config.app.queryStaleTime`. Removed
  `queryStaleTime` from `appConfig.ts`/`app.json`/README; migrated the one consumer
  (`useNavMenu.ts`) to `STALE_TIMES.STATIC`; rewrote `hooks-rules.md`. Reason: two contradictory
  rules existed simultaneously and only one was ever actually used; `STALE_TIMES` is tiered and
  was already referenced by three skills. (uncommitted — this session)
- 2026-07-27 — `docs/plan/` introduced: one file per app-build unit (`docs/plan/units/<NNN>-
  <slug>.md`), a generated roll-up (`docs/plan/ROADMAP.md`, `npm run docs:plan`), blocking in CI
  via `docs:plan -- --check` right after the architecture-inventory check. Reason: same one-
  file-per-unit shape as routes/types/features — the planning ceiling before this was a single
  feature with no durable artifact; whether a unit has shipped is derived from its `[UNNN]`
  squash-merge subject on `main`, never stored, so no branch ever edits another unit's file.
  `guard-generated.mjs` generalised from a single guarded path to a list (also now covers
  `docs/architecture/inventory.md`, previously unguarded despite being generated and CI-blocking).
  (uncommitted — this session)
- 2026-07-27 — `.claude/skills/plan-app/SKILL.md` added: the app-level interview that seeds
  `docs/plan/`. It delegates design entirely to `plan-design` (one-line edit there: skip the "App
  identity" question if `docs/plan/app.md` already exists) and never asks about tokens itself.
  Introduced a third clarifying-question tier, the **app-survey budget** (up to 6 rounds of ≤4
  questions), in `.claude/rules/clarifying-questions.md` — alongside the existing 3-5 planner
  budget, now extracted there from `plan-new-page`/`plan-new-feature`/`plan-debug` (`plan-design`
  never had the shared block; verified before assuming otherwise). Reason: an app-level plan feeds
  every unit's spec, so under-asking here has a much larger blast radius than a single-page plan —
  that's what earns it a bigger ceiling than the existing planner budget. (uncommitted — this
  session)
- 2026-07-27 — `.claude/skills/spec-page/SKILL.md` added: the just-in-time per-page interview that
  fills in a `draft` unit's body right before it's built, using a **spec budget** (up to 6 rounds
  of ≤4 questions plus free text) in `.claude/rules/clarifying-questions.md` — larger than the
  planner budget because these answers are the sole input to an unattended implementation
  subagent, with no human in the room when it builds. Always builds a strawman from real schema
  and the app plan first and has the user correct it, rather than asking open-ended questions.
  Must run in the orchestrator's own session, never a subagent, since subagents cannot call
  `AskUserQuestion`. (uncommitted — this session)
- 2026-07-27 — `.claude/skills/build-app/SKILL.md` added: the resumable, sequential build loop
  over `docs/plan/units/`. Added the `unit/<NNN>-<slug>` branch type (no initials, deliberately —
  makes cross-developer claiming race-free via a `push --force-with-lease=refs/heads/…:` ref
  compare-and-swap) and the `[UNNN]` PR-title-prefix convention to `CONTRIBUTING.md`. Every unit's
  implementation is delegated to a subagent (paths only, no committing) to keep this session's own
  context roughly flat across an arbitrary number of units; verification is local CI parity plus a
  scope gate (`git diff --name-only` must be a subset of the unit's declared `## Files`) since no
  test framework exists yet. Never auto-merges a PR. (uncommitted — this session)
- 2026-07-27 — Multi-developer concurrency layer for the autonomous build loop landed:
  `.claude/skills/resolve-conflicts/SKILL.md` (+ `decision-table.md`) classifying conflicted files
  as auto-resolvable, auto-resolve-and-verify, or human-required, with an unattended-loop
  escalation path (abort, draft PR, leave the claim parked, move to the next unit). Extended
  `.claude/hooks/session-context.mjs` to `git fetch` and read `docs/wip/*` claims and
  `unit/<NNN>-<slug>` refs off *remote* branches, not just the local working tree — fixing the
  flaw where a claim on an unmerged branch was invisible to every other developer until it merged.
  Added a foundation-first gate to `npm run docs:plan -- --check`: a `unit/<NNN>-<slug>` branch's
  PR fails this check if any of its `depends_on` aren't yet merged, catching a human bypassing the
  build loop the same way the loop already gates itself. Added a `concurrency:` group to both CI
  workflow files so a rebase force-push cancels its own superseded run instead of queuing behind
  it (never cancelled for a push to `main` itself). Reason: with no test suite, `typecheck` is the
  only thing standing between two independently-green PRs and a broken `main` — foundation-first
  and the red-main-blocks-new-claims rule (`.claude/skills/build-app/SKILL.md`) are the mitigation.
  (uncommitted — this session)
- 2026-07-27 — Mock-data mode formalised: `src/services/fixtures/<domain>.ts` is the one import
  besides `@/integrations/supabase/client` a service file may have (`.claude/rules/service-
  rules.md`), a mock service returns data through the identical `mapX()` contract the real one
  would, and no runtime toggle exists between the two — a service file is either mock or real,
  never both. Every mock function carries a `// MOCK(U0NN): ...` marker, which
  `scripts/docs-check.mjs`'s new warning-only Check 5 scans for so the debt stays visible instead
  of silently persisting. Reason: `docs/plan/`'s `data_mode: mock` units need pages to be buildable
  before their real tables exist, without a parallel mock/real implementation surviving forever
  once they do. (uncommitted — this session)
- 2026-08-14 — **Framework/app boundary introduced.** A portal built from this skeleton was
  disconnected from it the moment it was cloned: framework and app code interleave *by layer*
  (`src/pages/`, `src/services/`, `src/components/ui/`, `src/routes/modules/`), so no skeleton
  improvement — a router patch, a Button fix, a lint rule — could reach portals already built.
  `platform/framework.json` now declares one owner for every file across five categories, first
  match wins: `framework` (replaced from upstream, hand-edits rejected downstream), `materialized`
  (framework content at a path the toolchain hardcodes — `vite.config.ts`, the tsconfigs — copied
  out and hash-checked in place), `seeded` (written once by `app:init`, the app's forever),
  `app` (the framework never touches), `ignored`. `npm run framework:verify`
  (`scripts/framework-verify.mjs`) classifies every tracked file and reports any with no declared
  owner; `--list framework` prints the move-list phase 2 consumes. Reason: the mechanism for
  shipping framework updates (git subtree, an npm package, a sync script) is interchangeable, but
  every one of them requires that no framework update ever has to merge into a file an app also
  writes. Declaring the boundary is therefore the prerequisite, and it is deliberately landing
  before anything moves. Report-only at this stage — content hashing and CI enforcement are
  phase 3. (uncommitted — this session)
- 2026-08-14 — **i18n layer removed** (`src/contexts/LanguageContext.tsx`,
  `src/components/ui/LanguageSelector.tsx`, its `App.tsx` provider). It held a hardcoded
  `en`/`id`/`zh` dictionary of placeholder HR-portal copy, `t()` was never called anywhere, and
  `LanguageSelector` was never wired into `Navbar`. Reason: as a framework/app seam it was the
  worst possible shape — the provider is framework machinery but the dictionary is per-portal
  content, so every portal would have inherited a split file to maintain for a feature none of
  them used. Deleting a seam beats designing one. Translation gets built when a portal actually
  needs it, alongside the planned login work. (uncommitted — this session)
- 2026-08-14 — **No user-administration page ships; its services stay framework-owned.** Deleted
  `src/pages/admin/UserManagement.tsx` (a five-line `<div>UserManagement</div>` stub) and
  `src/routes/modules/admin.routes.tsx`; replaced `docs/features/user-management.md` with
  `docs/architecture/user-administration.md`. `services/{users,roles,screens}.ts` (~250 lines of
  `_arch`/`_secure` CRUD, zero consumers) are **kept** and framework-owned. Reason: a permission UI
  is what every portal needs *differently* — per screen, per department, or delegated to Entra
  groups — so a framework page would be a guess every portal then forks, which is the drift the
  boundary exists to prevent. Services are safe to share because they mirror a schema that
  genuinely is shared. This is the one place the framework knowingly carries unused code; it
  tree-shakes out of a build that never imports it.
- 2026-08-14 — **`ROLES` is app-owned and ships empty; `PERMISSION_OPTIONS` is framework-owned.**
  `src/lib/constants/roles.ts` keeps only `ROLES` (now `{}`), and `PERMISSION_OPTIONS` moved to a
  new `src/lib/constants/permissions.ts`. Reason: role names are rows in a portal's own database,
  so the framework cannot know them and must never sync them, while the read/write/delete
  permission vocabulary describes the shared `_arch.rolescreen` model. `add-new-route/SKILL.md` now
  requires **asking the user** which role guards a route instead of inheriting the old
  `USER_ADMIN` example, which existed only to guard the deleted admin stub.
- 2026-08-14 — **Framework code no longer imports through the `@/types` and `@/lib/constants`
  barrels**; it imports the domain file directly (`@/types/routing`, `@/lib/constants/app`), which
  those barrels' own header comments already recommended. Reason: both barrel paths become
  *app-owned* after phase 2 — the framework's copies move to `platform/` and are re-exposed as
  `@framework/types` / `@framework/constants`. Repointing now means phase 2's codemod is a pure
  prefix swap on framework-owned files, with no import that silently resolves to the app's barrel.
- 2026-08-14 — **`src/index.css` split three ways by owner.** `src/theme.css` (app-owned) holds
  every token *value* — `:root`, `.dark`, the tonal ramps; `src/styles/framework.css`
  (framework-owned) holds structure — `@import "tailwindcss"`, `@custom-variant dark`, the
  `@theme inline` mapping, the base layer; `src/index.css` shrinks to font URLs plus those two
  imports. Rule of thumb: **a value is app-owned, a mapping is framework-owned.** Reason: brand
  values are per portal and structure is not, so the single file was a seam every framework update
  would have had to merge into — and rebranding a portal must never touch a framework file.
  Load order is load-bearing: font `@import url()` first because CSS requires it, then
  `framework.css` before `theme.css` because it carries `@import "tailwindcss"` and a `@layer base`
  block appearing before Tailwind declares its layer order silently changes the cascade.
  Verified behaviour-preserving: the compiled CSS before and after differ only in the *position* of
  the `*{border-color}` / `body{background-color;color}` chunk (disjoint selectors setting disjoint
  properties from the custom-property blocks it moved past); stripping that one chunk from both
  builds leaves byte-identical remainders, and the generated token list in
  `docs/architecture/inventory.md` is unchanged. `scripts/docs-check.mjs` and
  `scripts/gen-arch-docs.mjs` now resolve the `@theme inline` block by first-existing candidate
  path (`platform/src/styles/`, `src/styles/`, then legacy `src/index.css`) so neither this move nor
  phase 2's silently empties the token manifest — an empty block made all 40 DESIGN.md roles look
  unresolved, noise indistinguishable from real drift. CLAUDE.md's "no new CSS files" became "no
  fourth CSS file". (uncommitted — this session)
- 2026-08-14 — **`eslint.config.js` split into a framework base plus a thin app config.** The
  layering rules and the four design-token rules moved to `platform/config/eslint.base.js`
  (framework-owned, exported as `frameworkConfig`); the root `eslint.config.js` is now 15 lines that
  spread it and leave a marked place for portal-specific rules. Reason: a portal must be able to add
  a lint rule without editing — or conflicting with — the framework's enforcement, and a rule every
  portal should follow has to live somewhere that reaches them all. Verified by resolved-config
  equivalence (identical 13 warnings / 0 errors) plus a deliberate-violation probe confirming all
  four `local/*` rules still fire. That probe also surfaced a **pre-existing** defect, filed
  separately: the page-level `@tanstack/react-query` and Base UI import bans are silently
  unenforced, because flat config *replaces* rather than merges a rule's options and the later
  DataTable-seam block re-sets `no-restricted-imports` for `src/**`. Present on `main` before this
  branch; not fixed here to keep the boundary work reviewable.
- 2026-08-14 — **`DESIGN.md` stays framework-owned and whole; brand *decisions* move to the
  app-owned `docs/brand.md`.** `plan-design` no longer edits `DESIGN.md` at all: Phase 1 records one
  row per divergence-from-default (with a reason) in `docs/brand.md`, Phase 2 writes the values to
  `src/theme.css`. `DESIGN.md` gains a banner stating that its **values are the framework default**
  while its **role list and component specs are authoritative**, and pointing at `theme.css` for
  what a portal actually uses. Reason: `plan-design` used to rewrite `DESIGN.md`'s brand tables per
  project, which would make the file diverge in every portal and be reverted by the next
  `framework:update` — taking the brand with it. Splitting values out of the document entirely was
  considered and rejected: it needs a 41 KB rewrite, leaves two tables that must stay row-aligned
  forever, and `docs-check.mjs`'s Check 6 reads those tables to verify every role resolves to a
  token. Recording deltas keeps structural improvements flowing downstream at a fraction of the
  cost. Accepted trade: `DESIGN.md`'s tables describe the default palette, not the portal in front
  of you — hence the banner, and hence `theme.css` being named the source of truth for values.
- 2026-08-14 — **The framework's dependency on the app's generated `types.ts` is formalized, not
  removed.** The plan called for hand-declaring the `_arch`/`_common` rows so framework code stopped
  importing an app-owned file. That is not implementable: `gen-supabase-types` emits **one**
  `Database` type spanning the framework's schemas (`_arch`, `_secure`) *and* the app's (`public`),
  and `client.ts` exports a **single** `supabase` proxy typed by it — whichever `Database`
  parameterises that client is what every consumer sees, so a framework-declared one would strip the
  app's tables from the shared client and break every app service. A generated description of a
  schema both sides share belongs to both sides. Recorded instead as an `appContracts` entry in
  `platform/framework.json` — the one sanctioned inverted dependency — which `framework:verify`
  enforces by asserting the file exists and still contains `_arch`/`_secure`, so a portal
  regenerating with a narrower `--schema` list fails loudly instead of losing service typing
  silently. Alternatives rejected: two clients (two `createClient` instances sharing one auth
  storage key, plus hand-written types that drift from the real DB) and an untyped framework client
  (the five services that most directly mirror the database lose type safety).
- 2026-08-17 — **Phase 2 of the framework/app split: the mechanical move.** Framework runtime code
  relocated to `platform/src/` (mirroring its old `src/` structure, except `src/pages/sample/` →
  `platform/src/samples/`) and `platform/scripts/`; a `@framework/*` alias added alongside `@/*`
  in `tsconfig.json`/`tsconfig.app.json`/`vite.config.ts`; every crossing import rewritten by a
  one-shot codemod built from the *actual* specifiers in use (grepped, not guessed) rather than a
  blind prefix rewrite — necessary because sibling paths under the same directory sometimes have
  different owners (`src/lib/constants/roles.ts` stays app-owned while its siblings moved). The
  deferred registry two-root glob from phase 1 landed here: `platform/src/routes/registry.ts` now
  runs two `import.meta.glob` calls (`./modules/*.routes.tsx` for its own, `/src/routes/modules/
  *.routes.tsx` project-root-relative for the app's), merged.
  Three real defects surfaced and were fixed, none by any automated check:
  (1) the ESLint base's `files`/`ignores` globs didn't move with the code they governed — a glob
  matching zero files doesn't warn, so this would have silently disabled the layering and
  design-token rules on everything under `platform/src/`, caught only by re-running phase 1's
  deliberate-violation probe;
  (2) both doc generators had hardcoded `src/...` walks for routes/services/hooks/UI
  components/templates/pages/types/constants, needing either a two-root merge or a path update —
  `docs-check.mjs`'s own comment predicted this exact recurrence and it happened anyway;
  (3) `src/index.css`'s and `client.ts`'s relative imports broke when their targets moved out from
  under them, repointed through `@framework` and the phase-1 `appContracts` seam respectively.
  `CLAUDE.md`'s Folder Structure table and all five layering-rules files were rewritten in full —
  their frontmatter `paths:` lists gate which rule surfaces for a file being edited, so a stale
  list is a silent loss of guidance, not just stale prose.
  Process note for the next large move: a running dev server OS-locked four directories mid-move
  (resolved by stopping it), and three directories double-nested because `mkdir -p` (or an earlier
  diagnostic `cp -r`) had pre-created their destination — `git mv <dir> <dir>` treats an existing
  destination as "move into" rather than "rename to". Verified end-to-end in a live browser
  (Login, template gallery, Primitives with dark-mode token flips, a sample page, `/admin/users`
  404) in addition to the full `lint && typecheck && build && format:check && docs:check &&
  docs:arch --check && framework:verify` gate.
- 2026-08-17 — **Phase 3 of the framework/app split: Gate B actually fires now.** Added
  `platform/framework.lock` (SHA-256 per file classified `framework` or `materialized`,
  257 files) and `npm run framework:lock` to regenerate it. `framework:verify` hash-checks
  against the lock, but **only when `platform/framework.json`'s `role` is `"consumer"`** — in
  `role: "source"` (this repo) framework files are supposed to keep changing, so hash-checking on
  every run would be pure noise; `framework:lock` is the deliberate, separate step a maintainer
  runs before tagging a release. Added `.claude/hooks/guard-framework.mjs`, a `PreToolUse` hook in
  the shape of `guard-generated.mjs` that blocks Claude Code's own Edit/Write/MultiEdit on a
  framework-owned path in a consumer repo (not a security boundary — a human's own editor is
  unaffected; the real gate is CI). Extracted the classify/glob logic shared by
  `framework-verify.mjs`, `framework-lock.mjs`, and the guard hook into
  `platform/scripts/framework-lib.mjs` rather than duplicating it a third time — two independently
  maintained copies disagreeing about what counts as framework-owned would be worse than no check
  at all. Added `platform/**` to `.gitea/CODEOWNERS`/`.github/CODEOWNERS`/`docs/OWNERS.md`
  (replacing three narrower rows made redundant by the phase-2 move: shared UI library, AuthContext,
  auth service all live under `platform/` now) and a blocking `npm run framework:verify -- --check`
  step in both CI workflows. All three mechanisms were exercised directly (hash mismatch/deletion/
  unexpected-new-file detection; hook block/allow across categories), not just reviewed as code —
  one hook test round gave false negatives from a shell backslash-escaping artifact in the test
  payload itself, not the hook, caught by writing payloads to files instead of inline strings.
  Deliberately not built: `framework:reset`/`framework:update`/`framework:publish` and Gate A
  (branch protection on the eventual framework repo) — the former need phase 4's subtree
  extraction (something to reset *to* beyond "last commit"), the latter is a repo setting on a
  host that doesn't exist yet, not code.
- 2026-08-17 — **Phase 4 of the framework/app split: `platform/` is extractable via `git subtree`,
  and the publish/update round trip works.** New commands: `framework:publish` (subtree push +
  optional tag), `framework:update` (verify → pull → apply → verify), `framework:link` (one-time
  base), `framework:apply` (deploy materialized), `framework:reset` (discard local framework
  edits). Four problems had to be solved that the plan didn't anticipate — the first two found by
  inspection, the last two only by cloning a real portal and running the loop:
  (1) **`role` was inside the synced prefix.** A `subtree pull` would overwrite
  `platform/framework.json` and flip a portal from `"consumer"` back to `"source"`, silently
  disabling *both* halves of Gate B, since the lock hash-check and the guard hook each key off that
  one field — a portal would look protected and not be. `role` moved to `package.json`'s
  `framework.role`, which is `seeded` and therefore never synced.
  (2) **All 13 `materialized` paths live outside `platform/`**, so `subtree split` cannot carry
  them: an update could never deliver a new `vite.config.ts`, and the incoming lock would hold
  upstream's hash for a file that never changed locally — making verify *falsely accuse the app of
  tampering*. Canonical copies now live at `platform/materialized/<target>` (inside the prefix,
  therefore synced) and `framework:apply` deploys them; verify checks both halves in either role.
  (3) **Lock hashes were not stable across clones.** `.gitattributes` sets `eol=lf`, so a fresh
  clone has LF while a working tree predating that setting has CRLF; hashing raw bytes gave
  different hashes for identical content, and a fresh portal reported ten untouched files as
  modified. Verified (`tsconfig.node.json`: `8dc2fd2a…` CRLF vs `a96b9ba5…` LF, identical once
  normalized). Hashes are now end-of-line agnostic. This one mattered most: day-one false
  accusations would have trained people to ignore Gate B, which is worse than not having it.
  (4) **`git subtree pull` refuses without a merge base**, which is exactly the state of a portal
  cloned from the template (`platform/` as ordinary files) — `--squash` fails "was never added",
  plain fails "refusing to merge unrelated histories". Hence the one-time `framework:link`, and
  `framework:update` detecting the missing base and naming it rather than surfacing git's message.
  CI gains a `framework:apply -- --check` step so materialized drift can't land silently.
  **Still open:** `subtree.remote` is `null` — this repo has no git remote, so the whole loop was
  proven against a throwaway local bare repo (which exercises subtree identically). Pointing at the
  real Gitea/GitHub `portal-framework` repo is a one-line change to that field. Gate A (push
  access/branch protection there) remains a host setting, not code.
- 2026-08-17 — **Phase 5 of the framework/app split: the authoring surface.** Four paths were
  classified `framework` that a portal must be able to write, which made each read-only downstream
  and would have blocked a portal from operating: `docs/DECISIONS.md` and `docs/OWNERS.md` (a portal
  records its own decisions and names its own team — DECISIONS.md is append-only by its own header)
  are now `seeded`; `docs/architecture/inventory.md` is now `app`, because it is **generated per
  repo** by `npm run docs:arch` from that repo's own routes/services/pages and CI *requires* it to be
  regenerated, so Gate B would have rejected the very thing CI demands; and the blanket
  `.claude/skills/**` glob is replaced by the framework's own 19 skills listed individually, so an
  app-authored skill falls through to `app` instead of being reported as an unexpected new framework
  file. Anything a portal adds under `docs/architecture/` falls through to `app` for the same reason.
  Proven rather than assumed: with `framework.role` flipped to `"consumer"`, all three writes now
  pass `framework:verify -- --check`, and the guard hook allows them while still blocking a
  framework skill, a framework component and a materialized config.
  Separately, ~105 references across the 12 non-vendored skills, the 7 rules files and `CLAUDE.md`
  were swept onto the moved paths and the `@framework/*` alias (vendored upstream skills left alone,
  per `docs-check.mjs`'s own VENDORED_SKILLS list), `CLAUDE.md` gained an **"extend, never edit"**
  section spelling out the role check, the one-line import rule and the three sanctioned responses
  when the framework doesn't do what a portal needs (configure → extend → upstream, never fork), and
  `plan-app` Round 3 now asks whether the portal needs user administration and points the resulting
  unit at the existing `_arch`/`_secure` services instead of letting a subagent rebuild ~250 lines of
  CRUD. Deliberately **not** done: relocating `.claude/**` and `.agents/**` into `platform/`, which
  phase 2 had tentatively assigned here. The `materialized` mechanism could carry them, but both
  available shapes are bad trades — tracking the deployed copies duplicates ~90 files and doubles
  every skill diff (the vendored shadcn skills would sit at three paths), while gitignoring them
  means a fresh clone has no skills, rules or hooks until someone runs `framework:apply`, so the
  first Claude session in a new portal would run with no policy at all. The better answer is a second
  subtree prefix publishing `.claude/` as its own branch of the framework repo — no duplication,
  stays committed, still syncs — but that is a design extension, not a path rename, and is left as an
  explicit open decision.
- 2026-08-17 — **Phase 6 of the framework/app split: `npm run app:init` and the loop proven with real
  app code.** `app:init` replaces the copy-rename-remember ritual for starting a portal. The step it
  exists to make unforgettable is flipping `package.json`'s `framework.role` to `"consumer"` — until
  that happens nothing about the boundary is enforced, so a portal edits framework files freely and
  only discovers it at the first `framework:update`. It also stamps `public/config/app.json`, resets
  `docs/DECISIONS.md` to a fresh portal log (the framework's ~45 entries are noise in a portal),
  clears the template's `docs/wip/` claims, redeploys materialized files, and prints the remaining
  manual steps. It deliberately does **not** set `subtree.remote` (framework-owned, read-only once
  the role flips, and not per-portal anyway — every portal pulls the same framework, so the value
  belongs upstream) and does **not** rewrite git history unless `--reset-history` is passed.
  **The Supabase credentials are blanked unless supplied.** That is load-bearing:
  `public/config/app.json` is tracked despite `.gitignore` line 29 saying it shouldn't be (the ignore
  rule was added after the file was already committed), and it carries a real URL and publishable key
  for project `hauccbcyondtbmzscuiw` — so without blanking, every portal would silently read and
  write *the skeleton's database*. The key is publishable/anon, not a service-role secret, so this is
  not an exposed credential; the risk is pointing at the wrong project. **Untracking the file is not
  safe on its own** — `docker/Dockerfile` does `COPY . .` and Vite copies `public/` into `dist/`, so
  the image bakes it in; removing it from git leaves the built image with no `/config/app.json` and
  `appConfig.initialize()` fails at boot. Fixing it properly means deciding how the file reaches a
  deployment (CI injection, mounted volume, or an `app.json.example` + build step) — a deployment
  decision, left open.
  Proven end to end against the throwaway framework repo with a portal containing **real app code**,
  which phase 4's test did not have: `npm ci`, `typecheck` and `build` all pass in a fresh portal
  whose own page imports `@framework/components/ui/*`; after publishing a framework change and
  running `framework:update`, the change arrived, the app page and route were untouched, portal
  identity survived (including the blanked database), the portal still built, and app code could
  immediately use the new framework variant. The variant itself was reverted before merge — the plan
  named it as the test vehicle, not a deliverable.
- 2026-08-17 — **`.claude/**` and `.agents/**` stay at the project root as framework-owned, and phase
  7 makes every hash-checked file deliverable.** The phase-5 open question is closed: a cloned portal
  has those directories and uses them, and they define *how Claude builds the app*, so they are the
  framework's. Nothing moved. But that decision exposed a live bug — **101 framework-owned files were
  hash-checked against `platform/framework.lock` with no delivery mechanism at all**, because they sit
  outside the `platform/` subtree prefix and `subtree pull` only ever sees the one directory it is
  given. The first release touching any of them (phase 5 alone changed 12 skills) would have made
  every portal's `framework:update` report "framework file modified" for files the portal had never
  edited — the incoming lock carries the new hash, the file keeps the old content. Same class as the
  phase-4 `materialized` bug, never generalised beyond those 13 paths.
  **The invariant now: a file may only be hash-checked if one of two mechanisms can deliver it.**
  (1) **Three subtree prefixes instead of one** — `platform`→`main`, `.claude`→`claude-policy`,
  `.agents`→`agents-policy`. This is what finally makes skill and rule improvements reach existing
  portals, which was the original motivation for the whole split. A *mixed* `.claude/` is safe
  because `subtree pull` merges: upstream changing `build-datatable` and a portal having added its
  own skill both survive every future pull, and app skills classify `app` so they are never
  hash-checked. `publish`/`update`/`link` loop the prefixes; `update` and `link` check **every**
  prefix for a base, so a portal linked before `.claude/` existed is told to re-link rather than
  silently half-updating. (2) **20 more `materialized` files** — the 5 root docs plus the framework
  docs living in otherwise app-owned directories. Root files can never be a prefix, and
  `docs/architecture/` was considered as a 4th prefix and rejected: it would save only 9 files
  (`DESIGN.md` is a root file either way) for a 4th `subtree split` per publish, and split walks the
  whole history. Accepted cost ~20 duplicated files including `DESIGN.md` (41 KB); the trade buys
  something phase 1 explicitly gave up — framework *spec* improvements now reach portals — and
  `framework:apply -- --check` in CI stops the copies drifting.
  Proven end to end against a fresh bare repo and a fresh `app:init`'d portal: all three prefixes
  publish and link; a framework **skill** change and a **`DESIGN.md`** change both arrive; an
  app-authored skill inside the subtree'd `.claude/` survives the merge and still classifies `app`;
  `framework:verify -- --check` exits **0** — which is exactly the case that previously produced
  false accusations; and the portal still typechecks and builds.
  Also in this phase: dropped the stale `scripts/**` manifest entry (nothing at root since phase 2),
  rewrote the manifest's now-misleading PHASE NOTE, and **the generated inventory is split by owner**
  — every section lists "This app" before "Framework (reference)", with an Owner column on the routes
  table. `docs/architecture/inventory.md` is what `CLAUDE.md` points agents at to answer "does X
  exist?", and a portal's own 3 services should not sit underneath the framework's 5, nor its
  components under ~54 framework ones.
- 2026-08-17 — **`framework:apply -- --adopt` now copies deployed → canonical when the two differ,
  instead of the reverse.** Found by hitting it: after editing the deployed `docs/COMMANDS.md` (now a
  materialized file), `--adopt` overwrote the edit with the older canonical copy — the exact mistake
  the flag exists to fix, and the realistic way these files get edited, since a maintainer opens
  `DESIGN.md`, not the copy inside `platform/materialized/`. `--adopt` means "the deployed file is
  authoritative", so it now writes canonical←deployed, guarded to `role: "source"` — in a portal the
  deployed copy is never authoritative and promoting it would launder a local fork into the
  framework's canonical content (verified: the guard refuses with an actionable message). `CLAUDE.md`
  gains a "Working in the framework's own repo" section naming both safe routes, because the
  double-copy is genuinely non-obvious and `framework:apply -- --check` in CI is what catches a
  forgotten step.
- 2026-08-21 — **`public/config/app.json` is tracked deployment config, and the `.gitignore` rule
  saying otherwise is gone.** Closes the open question left by the 2026-08-17 phase-6 entry, which
  established that untracking the file is not safe on its own — `appConfig` fetches
  `/config/app.json` at startup and Vite copies `public/` into `dist/`, so a build with the file
  removed from git produces an image with no config and fails at boot in `appConfig.initialize()`.
  Resolved in the tracked direction rather than by inventing a deployment mechanism: the
  `.gitignore` line (which never took effect, having been added after the file was already
  committed) is deleted, and `platform/framework.json` reclassifies the path `ignored` → `seeded`,
  which is what it actually is — written once by `app:init`, owned by the portal afterwards, and
  neither build output, local-only, nor tool scratch. Not hash-checked in either category
  (`HASH_CHECKED_CATEGORIES` is `framework` + `materialized`), so this costs nothing at verify time
  and stops the classification contradicting the repo. **Only the publishable/anon key ever belongs
  in this file** — it is served over HTTP from `public/` to every browser that loads the portal, so
  a service-role key placed here is published, not configured; that is now stated in
  `docs/COMMANDS.md`, `platform/framework.json` and the `.dockerignore`. A portal that wants
  per-environment config instead (CI injection, a mounted volume, an `app.json.example` + build
  step) can still do it — the file being tracked does not foreclose that, it just stops the
  template shipping a rule that pretends the decision was already made. `app:init` still blanks the
  Supabase values unless supplied, which remains the load-bearing protection against a portal
  reading the skeleton's database.
- 2026-08-21 — **Framework releases are pinnable, and release tags now point at the split heads
  instead of the template's HEAD.** `framework:publish` advertised "Portals pin by tag" while
  `framework:update` only ever pulled the branch tip, so no portal could ask for a version. Making
  that real forced a second defect out into the open, because they were the same bug from opposite
  ends: `git tag vX.Y.Z` ran against *this repo's* HEAD, a commit reachable from none of the three
  `subtree split` histories — so pushing it would have dragged the whole template history into the
  delivery repo, and the tag was unpullable anyway (its tree has `platform/` as a subdirectory, so
  a `subtree pull` of it would merge the entire template into `platform/`). Both fixed by tagging
  **one tag per prefix** on that prefix's split head: `vX.Y.Z-main`, `vX.Y.Z-claude-policy`,
  `vX.Y.Z-agents-policy`. A release is three histories with no commit in common, so there is no
  single commit a release-wide tag could ever have pointed at. `--tag` is now **required** on
  publish and must equal `platform/framework.json`'s `version`: an untagged release is unpinnable,
  and a tag disagreeing with the manifest would make every portal on it misreport its version,
  since the manifest is what travels and what `framework:verify` reads back. That readout is the
  single source of truth — no pin file was added, because a second place to record a version is a
  second place for it to be wrong. `framework:update` and `framework:link` both take `--tag`;
  `link` needs it because that is where a history-less portal gets its first framework content.
  Both refuse unless *all three* tags of a release exist, so a half-published version cannot leave
  a portal with runtime code and agent policy on different versions. Publish is re-runnable — it
  walks three histories over the network and does die midway (it did, to a timeout, during this
  work) — skipping tags already on the same content and refusing to move one pointing elsewhere.
  Also in this change: `framework:lock` now **refuses** in a `role: "consumer"` repo instead of
  printing a note after having already rewritten the lock; re-pinning in a portal blesses whatever
  is on disk, including the local edit Gate B exists to catch, so the one ordering that cannot help
  was the one it had. **Pinning turned out to work in BOTH directions**, which the plan for this
  work assumed it would not: with `--squash` each pull records upstream as one squashed commit, so
  the merge base is the previously-squashed version and an older tag is a clean revert. Verified end
  to end against a local bare framework repo — a portal went 0.1.0 → 0.2.0 → 0.3.0 → 0.2.0 with
  `framework.json`'s version, ordinary framework code and the *deployed* materialized copies all
  tracking the target release and `framework.lock` verifying at each step, plus a portal-owned
  `.claude/skills/acme-billing/` and `.claude/settings.local.json` surviving every hop in both
  directions. What makes that safe is the boundary itself: a portal has no local edits under
  `platform/` for a backwards merge to conflict with, and `framework:update` refuses to run against
  a diverged tree. `version` set to `0.1.0` — pre-1.0 while `subtree.remote` is unset, the
  `_arch`/`_secure`/`_common` migrations gap is open, and there is no test layer.
- 2026-08-24 — **Modal action buttons go bottom-right, and a form may live in a modal or a side
  sheet.** Two changes, one of them a correction. (1) DESIGN.md §7 has always said "Forms, side
  sheets, and modals all place their primary action button bottom-right… don't vary placement per
  screen", yet `DialogFooter` and `AlertDialogFooter` used `sm:justify-center`, and the centring was
  defended in four separate places by a claim that modals are "the one deliberate exception to the
  right-aligned default" — a rule that appears nowhere in DESIGN.md. `.claude/skills/build-form-
  page/SKILL.md` asserted the exception at one line and the correct rule at another, contradicting
  itself. All six sites now agree with §7: the two footers, `ConfirmDialog`'s header comment and
  inline comment, `.claude/rules/components-rules.md`, the skill, and
  `docs/architecture/ui.md`. Blast radius is every modal in the app, `ConfirmDialog` included, so
  DataTable row-delete confirmations move centre → right. (2) DESIGN.md §6 said "Modal —
  confirmation and warnings only… Do not use a modal for data entry or editing"; it now permits a
  form in either container, with **no field-count threshold** — a cap was considered and
  deliberately rejected as an arbitrary line. Instead the side-sheet-vs-modal choice becomes the one
  container decision that is **asked, not assumed**: `plan-new-page` and `plan-new-feature` move it
  out of their "decide yourself" lists into "ask the user" (narrowly — every other container,
  spacing and sizing convention stays decided), and `spec-page`'s Actions round records it in the
  unit spec, since the implementing subagent runs unattended and cannot ask. The standing default,
  offered as the pre-selected answer so the question costs one click of the planner budget, is a
  **side sheet for anything opened from a datatable** — the list stays visible behind it. That
  default is scoped to form/edit actions only: destructive confirmations remain `ConfirmDialog`,
  because "prefer a side sheet from a datatable" would otherwise read as overriding
  `components-rules.md`'s requirement that destructive row and bulk actions sit inside an
  AlertDialog. Also folded in: the backdrop in both dialogs moves from `bg-black/10` + a blur to a
  flat `bg-black/55`, which is what §6 (:456) and the side-sheet entry (:449, "No blur") specify;
  and `build-form-page`'s form-styling block, which still described inputs as
  `bg-input border border-input rounded-md`, now matches the components (`bg-card`,
  `border-border-dark`, `rounded-sm`).
- 2026-08-24 — **One opt-in `useUnsavedChangesGuard` covers dialog close, route navigation and page
  unload — enforced by lint, not by prose.** `8c9a80b` made forms legal in modals, which created a
  data-loss path that did not exist before: closing a Dialog/Sheet discards whatever was typed.
  One hook covers it because the triggers are the same shape underneath — "an intent to leave that
  can be held, then released or abandoned". Base UI funnels every exit (backdrop, Esc, the X, a
  Cancel in `DialogClose`) through a single `onOpenChange` carrying `cancel()`; React Router's
  blocker exposes `proceed()`/`reset()`. So the hook is one nullable `{ release, abandon }` slot with
  three producers and one `ConfirmDialog` draining it. **`abandon` is not symmetric decoration:** the
  router path must call `reset()` when the user backs out or the router stays blocked and every later
  navigation silently does nothing, with no error — the dialog path needs no undo. `useBeforeUnload`
  covers leaving the site, where the browser's prompt cannot be styled; that is a platform limit, not
  a gap to design around. **Opt-in over automatic, deliberately.** Automatic was designed and
  rejected: a container cannot read its contents' form state (context flows down, so `DialogContent`
  can't see a `FormProvider` inside it), so it would have meant DOM-diffing `value` against
  `defaultValue` on every close — which works, and covers Base UI's hidden native inputs, but false-
  positives on any form that populates defaults after mount, and would change behaviour for every
  dialog in every portal. **The enforcement is the point, since opt-in without it is opt-forgotten.**
  New `local/require-unsaved-guard` in the framework-owned `platform/config/eslint.base.js` errors on
  a `Dialog`/`Sheet` containing a field primitive **or a `*Form` component** when the file never
  calls the hook. That second half does most of the work: `build-form-page` tells agents to extract
  the form to `<PageName>Form.tsx`, so in the normal case the fields live in another file and a
  same-file check would see nothing. `components/ui/**` and `samples/**` are exempt — the same
  carve-out `no-off-scale-spacing` and `no-raw-anchor` already use, and concretely because
  `FilterSheet` is a Sheet full of fields that must never prompt (draft-then-apply: discarding is
  what closing means). A PostToolUse hook, `.claude/hooks/advise-unsaved-guard.mjs`, flags the same
  shape while an agent is still editing — **PostToolUse and advisory, not PreToolUse and blocking**,
  because unlike the two existing guard hooks this question needs finished content and a dialog is
  legitimately written a few edits before its guard. Both read one shared module so the rule and the
  hook cannot drift. Verified as mechanisms, not assumed: the rule errors on `<Dialog><Input/>`, errors
  on `<Sheet><UserForm/>`, passes once the hook is referenced, stays silent on `FilterSheet`; the
  advisory fires on a violating file, stays silent once the hook is added and on exempt paths, and
  exits 0. Also uses `useBlocker` for the first time — one of the two reasons data mode was adopted
  (`.claude/rules/architecture-rules.md`).
- 2026-08-25 — **Sheet backdrop brought to spec.** `SheetOverlay` was still `bg-black/10` with
  `supports-backdrop-filter:backdrop-blur-xs` — the same off-spec backdrop already corrected in
  `dialog.tsx` and `alert-dialog.tsx` in `2d70b90`, missed because that pass looked only at the two
  modal overlays. DESIGN.md §6:449 has always specified `rgba(0, 0, 0, 0.55)` and "No blur", so this
  is a fix, not a spec change. Verified on all three sheets — the Primitives edit sheet, the
  ManagementTables vendor edit sheet, and `FilterSheet` — as `rgba(0, 0, 0, 0.55)` with
  `backdrop-filter: none`. Same shape of miss as `SheetFooter` in `5a22f0c`: there are **three**
  overlay components and two sweeps in a row caught only the two modal ones, so `sheet.tsx` is the
  file to remember next time something changes "the dialogs".
  **Considered and parked:** removing the sheet's `--radius-lg` leading-edge radius, on the argument
  that a full-height panel flush to the viewport edge reads as a floating card when its leading edge
  is rounded. Implemented, reviewed and reverted the same day — not rejected on the merits, just not
  taken now. Reviving it means changing DESIGN.md §6 plus the four places that restate the rule:
  `docs/architecture/ui.md`, `build-form-page`'s container list, `CLAUDE.md`'s radius summary, and
  the Primitives radius scale's `rounded-lg` role. The 1px `--color-card-border` on the leading edge
  is a separate thing and would stay either way — DESIGN.md §2.3's "side-sheet leading edge"
  reference is about that divider, not the radius.
- 2026-08-25 — **Toasts are custom-rendered from this repo's tokens, and importing `sonner` directly
  is a lint error.** Toasts were the last component still coloured by a third-party palette:
  `richColors` gave each type a solid fill, which is not what the design calls for. The token route
  had been attempted and abandoned — sonner renders its card outside the component tree and colours
  it from CSS custom properties injected at runtime, so matching our tokens needed nine `!important`
  overrides, and the block doing it sat commented out in `framework.css` referencing `--success-light`,
  a token that never existed. `toast.custom` removes the problem entirely: sonner sets
  `"data-styled": !Boolean(toast.jsx || toast.unstyled || unstyled)` and scopes every default card
  style to `[data-styled=true]`, so a custom toast gets no wrapper styling — ordinary utility classes,
  no `!important`, no double card. Verified in the installed source, not assumed. **DESIGN.md §6's
  Toast entry changed rather than being violated:** it specified "branded solid fill per type" but its
  own next line called that "a per-project choice, not a fixed rule — confirm with the client". The
  answer was a third option neither alternative anticipated: the surface never varies by type, the
  icon carries it, and only errors colour their text. That is also where Toast deliberately diverges
  from Alert, which tints success and warning wording with the `-text` tokens from §2.5 — recorded in
  the spec so nobody later "fixes" the inconsistency. **The ban needed a third distinct ESLint rule
  name.** It applies to every file, so its glob overlaps all three per-layer `no-restricted-imports`
  blocks, and flat config REPLACES a rule's options rather than merging them — a fourth block on that
  name would have silently deleted their bans, which has already happened once in this repo and
  disabled three layering rules for months. `@typescript-eslint/no-restricted-imports` was already
  taken by the DataTable seam for exactly the same reason, so this is `local/no-direct-toast`.
  Verified as a mechanism: the probe file errors on a `sonner` import **and still errors on the
  pre-existing react-query ban**, which is the specific regression that would otherwise go unnoticed.
  Also removed: `richColors` and the `icons` map from `sonner.tsx`, and the dead
  `[data-sonner-toaster]` block from `framework.css` — all three only affect `[data-styled=true]`
  toasts, so they were configuration that read as though it were doing something.
- 2026-08-25 — **`CardMedia`: the leading-icon slot, plus a spacing bug it surfaced.** The
  `[icon] [title + description] [chevron]` card row had no home: `CardHeader` offered one or two
  columns (`[1fr auto]` with a `CardAction`) and no leading slot, so building the row from a call
  site meant overriding the header grid *and* re-placing the title, description and action —
  because `CardAction` hardcodes `col-start-2`, which becomes the wrong column the moment anything
  sits to its left. Rather than invent a pattern, `CardMedia` mirrors `AlertDialogMedia`, which has
  solved exactly this for alert dialogs since the Base UI migration: a rounded `bg-muted` square that
  spans both header rows and sizes an unsized child `svg`. Smaller than the dialog's `size-16`
  (`size-10`), because a card row is not a dialog's hero slot. **`CardHeader` now derives its column
  count from the slots present** — `[1fr auto]`, `[auto 1fr]`, or `[auto 1fr auto]` — so callers never
  write grid classes; and `CardAction` moves to `col-start-3` via
  `group-has-data-[slot=card-media]/card-header`, keyed off the header's group rather than `has-`
  because the media is a *sibling*, not a descendant. Verified the collision case specifically: with
  both slots the action's left edge is at or past the title's right edge, and a card with no media is
  bit-identical (still two columns, action at column 2). The clickable variant wraps the whole `Card`
  in a router `Link`, which `components-rules.md` already permits for non-text content.
  **Bug fixed in passing:** `CardFooter`'s divider margin was `calc(1rem - var(--card-spacing))` — a
  literal that does not track `--spacing`, while the `pt-4` on its other side compiles to
  `calc(var(--spacing) * 4)` and does. Under `tailwind.md` §2's documented one-line rebrand lever the
  two sides of the divider would have desynchronised. Now `calc(var(--spacing)*4 - …)`; verified by
  doubling `--spacing` and watching both sides move 16→32 together instead of diverging to 16/32.
  Also labelled `theme.css`'s `--space-1`…`--space-16` block as reference-only and inert — it was
  headed only "4px base spacing scale", so anyone grepping for spacing tokens found eight
  plausible-looking variables that nothing consumes. That confusion is what prompted this.
- 2026-08-25 — **Card composition is taught in the rules, and `--elevation-2` exists at last.**
  `.claude/rules/components-rules.md` § Cards was four bullets that never mentioned the seven parts,
  so an agent had no way to know `CardMedia`/`CardAction`/`CardFooter` existed or that `CardHeader`
  derives its own column count. It now carries a part-by-part table, the three `CardFooter` shapes
  (`justify-end` for actions, nothing for metadata, `justify-between` for both), the clickable-card
  pattern, and the `--card-spacing` and img-first-child behaviours. `build-custom-ui` gains a
  "card layouts are almost never custom" table before its class-name step, since writing
  `grid-cols-*` on a `CardHeader` is the reliable symptom of reaching for custom markup too early.
  One **ask** was added rather than a rule: whether the whole card is the click target or carries its
  own actions changes the markup, the a11y and whether a footer action is even possible, and a page
  spec often will not say — so confirm instead of picking. Deliberately not added to the planner's
  mandatory question list; it is conditional on the spec being silent, and
  `.claude/rules/clarifying-questions.md`'s budgets are a ceiling, not a target.
  **`--elevation-2` implemented.** DESIGN.md §5 has always defined it (a border/outline colour change
  for interactive card hover, explicitly *not* a shadow, since §6 allows cards no shadow at any
  state) and §6:344 required clickable cards to use it — but the token existed nowhere and `Card` had
  no hover state at all, so the clickable card shipped in `d6cb926` looked identical to a static one.
  Now `--elevation-2: var(--border-dark)` in `theme.css` → `--color-elevation-2` in `framework.css`
  (the two-file pairing `index-css-rules.md` requires and `docs:check` verifies), consumed by
  `Card`'s `[a:hover>&]:ring-elevation-2`. Declared by reference so it follows dark mode with no
  `.dark` entry, and given its own name rather than using `--border-dark` directly so interactive
  hover can diverge from field borders later. The trigger is "is a link's direct child" rather than a
  prop, because a card wrapped in a link *is* an interactive card by §6's own definition — nothing to
  opt into, nothing to forget. Verified in the compiled CSS:
  `a:hover>.…{--tw-ring-color:hsl(var(--elevation-2))}`, with resting state unchanged on both linked
  and plain cards. **Fixed in passing:** `docs-check.mjs`'s role regex was `/--color-[a-z-]+/`, which
  truncated `--color-elevation-2` to `--color-elevation-` and then reported it as having no token — a
  false positive indistinguishable from real drift. Widened to `[a-z0-9-]`; `docs:check` still reports
  zero issues, so it added no noise.
- 2026-08-25 — **DESIGN.md §3's type scale actually exists now; it never did.** Every `--type-*` row
  in §3 was missing both its value in `theme.css` and its `@theme inline` passthrough, so
  `text-headline-lg`, `text-title-lg`, `text-body-lg` and the rest resolved to **nothing** and
  silently inherited their parent's size. Measured before fixing: all seven rows of the Primitives
  type-scale sample rendered at an identical 14px/20px — only weight and family varied, because
  `font-bold` and the mapped `font-heading` are real. `calendar.tsx` was affected too, in shipped
  product code: its day labels ask for `text-label-sm` and were rendering 14px instead of 11px.
  What makes this notable is that `tailwind.md` §5 asserted the opposite — *"It is now real tokens …
  so `text-title-lg` is a real Tailwind utility"* — **and in the same paragraph explained the exact
  failure**: "Tailwind's JIT only generates a utility for a theme key it can see, so skipping the
  `@theme inline` passthrough would leave `text-title-lg` resolving to nothing." The documentation
  was written as though the work were done and the work was never done. Now: nine sizes plus their
  `--text-X--line-height` companions in `theme.css`'s `:root` (mode-invariant, like the radius
  scale), passed through `@theme inline`, expressed in rem rather than the spec's px so the scale
  respects a reader's browser font size. `--type-body-emphasis` deliberately has no token — it
  inherits its size by definition. Weight stays a separate concern, paired at the call site, per §3's
  own Weight column. Verified in the browser against the spec table: all nine steps match on size,
  line-height, weight and family. **Guarded, so it cannot silently regress again.** `docs:check`
  already had a check of exactly this shape for the §2.3–§2.5 colour roles — which is precisely why
  those roles have never drifted this way while the type scale did — so the same check now covers §3.
  Verified as a mechanism, not just added: deleting one passthrough makes it report that role, and
  restoring it clears. Also migrated the six arbitrary sizes that map exactly onto the new scale
  (`text-[22px]` → `text-title-lg` in two samples, `text-[11px]` ×4 → `text-label-sm`), and added
  `display-lg` and `button` rows to the sample so all nine steps are exercised — Tailwind only emits
  utilities for classes it can see, so an unused token is an unverifiable one. `--text-button` exists
  for completeness but `button.tsx` was left on `text-sm`, which is already 14px/20px and therefore
  accidentally correct; rewiring it is a separate change.
- 2026-08-28 — **A DEV-gated auth bypass for verifying protected pages, reversing an earlier
  ban.** `.claude/skills/build-app/SKILL.md` previously said outright: "Never add a dev-only auth
  bypass to make this check deeper — that's a security defect that would ship into every app
  built from this skeleton." That line was never itself the subject of a decision here — it read
  as a defensive default, not a deliberated one — while the actual problem it names (an agent has
  no account, so a protected route can only be confirmed as a redirect, never as a rendered page)
  had no other answer. Separately, `.claude/rules/service-rules.md`'s ban on a runtime toggle
  between mock and real data ("keeping both paths alive forever is how a mock silently ships to
  production") reads, by analogy, as an argument against this too.
  Both objections describe the same failure mode: a second code path that coexists with the real
  one in a shipped artifact. `VITE_DEV_AUTH=true` avoids that failure mode by construction rather
  than by discipline: the injection in `platform/src/contexts/AuthContext.tsx` is gated on
  `import.meta.env.DEV`, which Vite replaces with the literal `false` in a production build, so
  the branch is dead-code-eliminated — there is no second path in the shipped bundle, not a path
  that's merely supposed to stay off. The opt-in itself lives in `.env.local`, already excluded by
  this repo's pre-existing `*.local` gitignore rule, so it cannot be committed. CI now greps
  `dist/` for the synthetic user's sentinel email after every build and fails if it's present —
  the elimination is asserted, not assumed.
  The seam is `AuthContext`, not `ProtectedRoute`: `isAuthenticated` is `!!currentUser`, and
  `hasRole`/`hasScreenAccess` both derive from it, so one synthetic `CurrentUser` satisfies both
  guard layers in `AppRouter`, in-page role checks, and `useScreenAccess` at once —
  `docs/architecture/auth.md` already documented this trio as "domain-shaped and IDP-agnostic,
  consumed app-wide," so this sits on an existing boundary rather than a new one. It buys layout,
  token, responsive and route-level verification, not data — Supabase is still unconfigured, so a
  table or form still shows its own empty/error state. Updated: `build-app`'s and
  `build-custom-ui`'s VERIFY steps, `.claude/rules/architecture-rules.md` §Auth, and
  `docs/architecture/auth.md` / `docs/COMMANDS.md` (materialized).
