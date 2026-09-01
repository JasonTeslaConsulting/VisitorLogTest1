# Framework/skill feedback — handover

Observations from building the Visitor Log app on this skeleton (`docs/plan/app.md`, units
U001–U008). This portal is `framework.role: "consumer"`, so none of these can be fixed here —
each needs applying in the framework's own repo (`framework.role: "source"`), then pulled into
portals via `framework:update`. This file is a **collection point, not a queue** — nothing here
is applied automatically; review and action each item manually (`npm run framework:lock` /
`framework:publish` / `framework:update` per `CLAUDE.md`'s framework-boundary section), then
delete the items you've handled. Add to it; don't let it silently grow stale.

Each item: where the problem is, what happened (with evidence), a suggested fix, and why it
matters beyond this one app.

**⚠ Item 9 is CI-blocking, not just a process gap** — it fails a required (non-`continue-on-error`)
GitHub Actions step on every route-bearing unit's PR, not only this app's. Prioritize it.

---

## 1. `plan-app` never asks about the post-login landing route

**Where:** `.claude/skills/plan-app/SKILL.md` (framework-owned, `platform/framework.json` line
164) — Round 1 ("App identity & auth") or Round 4 ("Navigation map & page inventory").

**What happened:** I ran `plan-app`'s full interview for this app (2 `AskUserQuestion` rounds,
covering identity/auth, entities, roles, navigation, design, gates). Afterward the user asked to
change "the landing page after login" to `/visits` and pointed out they expected to have been
asked this during planning. I re-read the skill file directly: none of its 6 rounds asks what a
signed-in user should land on. This isn't a case of a short prompt skipping a question a longer
interview would have asked — the interview ran in full and the question simply isn't in it.

**Why it's not trivial to answer later:** `AUTH.REDIRECT_PATH` (`platform/src/lib/constants/app.ts`)
is hardcoded to `"/home"` and is **not** exposed via `public/config/app.json` — see item 2. So
"what's the landing page" isn't just a nav-map fact to record, it's a decision that (today)
requires a specific workaround (redirecting the app-owned `/home` stub) if the answer isn't
literally "/home".

**Suggested fix:** Add one question to Round 4, once the page inventory strawman exists: "Which
page should a signed-in user land on? (defaults to `/home`)". If the answer isn't `/home`, either:
(a) record in `app.md`'s Navigation map that `/home` redirects there, and have `plan-app`
generate that redirect page directly instead of leaving it to be discovered later, or (b) fix
item 2 first and have `plan-app` write the config value instead of a redirect page.

---

## 2. `AUTH.REDIRECT_PATH` is hardcoded, not portal-configurable

**Where:** `platform/src/lib/constants/app.ts` (framework-owned). Consumed by `Login.tsx`,
`Navbar.tsx` (home icon), `ProtectedRoute.tsx` (access-denied fallback), `AuthContext.tsx` (Entra
`redirectTo`).

**What happened:** Every one of those four call sites hardcodes the same assumption — "/home" is
where a signed-in user belongs — with no per-portal override. `public/config/app.json`'s `app`
section already carries portal-specific behavior (`authMode`, `homeIcon`, `portalName`,
`paginationOptions`); a landing route fits the same pattern and currently doesn't follow it.

**Workaround shipped in this app:** `src/pages/Home.tsx` (app-owned) now does
`return <Navigate to="/visits" replace />;` instead of rendering content — see
`docs/features/home.md`. This works, but every portal that isn't "/home" pays for an extra
client-side redirect and an extra file that does nothing but redirect.

**Suggested fix:** Add `app.landingPath` (default `"/home"`) to `public/config/app.json`'s schema,
have `AUTH.REDIRECT_PATH` read `appConfig.config.app.landingPath ?? "/home"` instead of a literal,
and update the four call sites' doc comments accordingly. `app:init` could prompt for it the same
way it prompts for other `app.json` fields.

---

## 3. `spec-page` has no guidance for a `kind: infra`/foundation unit with no page

**Where:** `.claude/skills/spec-page/SKILL.md` (framework-owned, line 169).

**What happened:** `plan-app`'s own decomposition rules (Step 3.2) guarantee at least one
`tier: foundation, kind: infra` unit per domain touched by ≥2 pages — this is a *routine* unit
shape, not an edge case, and this app has two of them (U001, U006). But every one of
`spec-page`'s 6 rounds is phrased around a page: "Always settle `template:`" (Round 1), "the real
columns found in Step 1" for a table (Round 2), row/page actions (Round 3), states/permissions
(Round 5) — none of it fits a unit with no route and no UI.

I improvised: skipped the page-shaped rounds, wrote every page-only body section as
`n/a — foundation unit, no page`, and instead ran one `AskUserQuestion` round confirming the
service/type/hook *contract* (function signatures, staleTime tiers, whether to embed related data
via nested select) — the foundation-unit equivalent of "fields/actions/states". It worked, but a
different session could reasonably have skipped asking anything at all for an infra unit, since
nothing in the skill tells it to.

**Suggested fix:** Add an explicit branch near the top of `spec-page`: "If `kind` is `infra` or
`design`, skip Rounds 1's template question and Rounds 2/3/5 entirely; instead confirm the
service's function signatures, the hook file split and staleTime tiers, and any embedding/FK
assumptions, in one round." Document the `## Fields`/`## Actions`/etc. sections as `n/a —
foundation unit, no page` explicitly (this file already does that for `## Validation` on
read-only pages — same pattern, just not extended to infra units).

---

## 4. `.claude/skills/call-api/SKILL.md` is not the call-api skill — it's a different file's content

**Where:** `.claude/skills/call-api/SKILL.md` (framework-owned, `platform/framework.json` line
161).

**What happened:** The skill listing's one-line description for `call-api` is literally
`#!/usr/bin/env node` — a shebang line, not a description. Reading the file confirms why: its full
230 lines are `platform/scripts/gen-supabase-types.mjs`'s source code verbatim (confirmed by line
count: both files are exactly 230 lines), not skill instructions. I could not use this skill when
speccing U001's data-fetching layer and fell back to reading `.claude/rules/service-rules.md` and
`.claude/rules/hooks-rules.md` directly instead, which happened to be sufficient here but won't
always be.

**Suggested fix:** Whatever `call-api`'s actual intended content was got overwritten by a copy of
the types-generation script — restore it from history in the framework's own repo (`git log -p --
.claude/skills/call-api/SKILL.md`) or rewrite it from scratch. Given the skill list's description
("Fetching data / API") and where `CLAUDE.md` points to it (`src/services/` skill index entry),
its content should cover the services→hooks→pages calling convention already documented in
`.claude/rules/service-rules.md`/`hooks-rules.md` — possibly this skill is meant to be a thin
pointer to those two rule files rather than duplicate them. Also worth a repo-wide check for
other skill files with the same accidental-overwrite symptom (a `SKILL.md` whose first line isn't
YAML frontmatter or a `#` heading is a quick smell test).

---

## 5. Barrel files' own header comments contradict themselves on whether to add new domains

**Where:** `src/types/index.ts` and `src/lib/constants/index.ts` (app-owned content, but the
confusing wording originates from the framework's `app:init` seed template — see
`platform/framework.json`'s `seeded` block).

**What happened:** `src/types/index.ts`'s header says, in the same comment:

> Add a domain's line here **only if** it needs to stay reachable via the barrel for existing
> imports — new code should import from the domain file directly [...] **Add this portal's own
> type domains here as they're created.**

The first sentence says "don't add new domains, only add for back-compat"; the last sentence says
the opposite ("add domains as they're created"). `src/lib/constants/index.ts` has the identical
first-sentence wording, but *also* already does `export * from "./roles"` — pre-existing proof
that a portal domain (`roles.ts`) **is** barrel-exported, undercutting "new code should import
directly" as the actual practice.

I resolved this for U001 by choosing not to add `visitor.ts` to either barrel, reasoning that "new
code should import directly" was the intended rule and the last sentence / the `roles` export were
both artifacts of the barrel's pre-skeleton history. This was a judgment call, not something the
file itself resolves — a different session could reasonably have appended `visitor.ts` to both
barrels instead, and neither choice would be "wrong" per the current wording.

**Suggested fix:** Pick one policy and make both barrels' comments (and CLAUDE.md's "Keeping
diffs reviewable" section, which lists both barrels as places to "append, don't reorder" — implying
they *do* get appended to) say the same thing. If the policy is "import directly, the barrel is
legacy-only," fix `types/index.ts`'s contradictory last sentence and consider removing `roles`'s
export from `constants/index.ts` (or leave it and note it's intentionally grandfathered). If the
policy is "yes, append new domains," fix the first sentence in both files instead.

---

## 6. `docs/plan/units/_TEMPLATE.md`'s `estimate_files` doesn't say what counts

**Where:** `docs/plan/units/_TEMPLATE.md`'s frontmatter comment: `estimate_files: 0 # >5 files
means split this unit`. Enforced by `platform/scripts/gen-plan-docs.mjs` (hard error over 5) and
referenced by `plan-app`/`spec-page`.

**What happened:** U001 needed 5 *new* files plus one *modified* existing file
(`src/lib/constants/roles.ts`) plus two barrel files it explicitly chose not to touch (item 5).
Nothing in `_TEMPLATE.md`, `plan-app`, or `spec-page` says whether a modified file (or a barrel
append) counts toward the cap — I had to infer "new files only" from a sentence in a *different*
skill, `.claude/skills/plan-new-feature/SKILL.md`'s sizing note ("A session with more than 5 new
files is probably too large"), which isn't cross-referenced from either `plan-app` or `spec-page`.

**Suggested fix:** State explicitly in `_TEMPLATE.md`'s `estimate_files` comment: "counts newly
created files only — modifying an existing file (including a barrel append) does not count." Cross-
reference `plan-new-feature`'s sizing rule from `spec-page`'s "Recompute `touches` and
`estimate_files`" step instead of leaving it implicit.

---

## 7. `db-setup.md`-style hand-run SQL needs explicit audit columns — not documented anywhere

**Where:** No skill currently generates or reviews hand-run SQL against `_arch`/`_secure`/
`_common`/`_sysconfig`/a portal's own schema (`docs/plan/README.md` doesn't mention a
`db-setup.md` convention at all — this app introduced the pattern ad hoc when `plan-app`'s
"one DB prerequisites doc" interview answer asked for it).

**What happened:** `docs/architecture/auth.md` documents that `createdby`/`modifiedby` default to
`public.current_orguser()`, which resolves from an authenticated PostgREST session. Every insert I
first wrote into `db-setup.md` omitted those columns (matching how a *service* correctly omits
them, per `.claude/rules/service-rules.md`) — but hand-run SQL via DBeaver/`psql` has no
`auth.uid()` to resolve, so the user hit real failures running it. I fixed it by naming both
columns explicitly (literal `'setup'`) on every insert from that point on, and saved this as a
personal memory, but nothing in the framework documents it — the next AI-authored `db-setup.md`
(for this app or a different portal) will make the same mistake.

**Suggested fix:** If `db-setup.md`-as-a-deliverable becomes a standing `plan-app` convention
(worth deciding — see the "one DB prerequisites doc" option in `plan-app`'s Round 6-equivalent),
document this rule directly in whatever skill/template produces it: "hand-run SQL against an
audited schema must set `createdby`/`modifiedby` explicitly (e.g. `'setup'`) — the column default
only resolves inside an authenticated PostgREST request."

---

## 8. No systematic check for exposed-schema/grant/RLS gaps before writing seed SQL

**Where:** `plan-app`'s Round 2 (entity/data model) and Round 6-equivalent (DB work granularity) —
neither prompts to verify anon/authenticated access to a schema before generating SQL that assumes
it.

**What happened:** This app's public registration form needs anonymous read access to host/purpose
lookups and a way to snapshot policy text. I discovered, by manually `curl`-ing the PostgREST
endpoint rather than through any skill-guided check, that: (a) the app's custom `_visitor` schema
wasn't in Supabase's exposed-schema list at all, (b) anon had zero grants on `_common`/`_secure`,
and (c) `_sysconfig` wasn't exposed either — the last one only surfaced *after* `db-setup.md` had
already been written and partially run once, requiring a follow-up fix (a fourth
`SECURITY DEFINER` RPC) discovered mid-build, not during planning.

**Suggested fix:** When a `data_mode: live` domain has a `public`-access page in its plan (per
`app.md`'s permission matrix), have `plan-app` explicitly prompt: "does `anon` need to reach
[schema]? If so, confirm via a probe query (or ask the user to) that the schema is exposed and
what's granted, before generating `db-setup.md`" — turning what was three rounds of user-reported
SQL bugs into one upfront check.

---

## 9. ⚠ CRITICAL — `docs:plan`'s duplicate-route check fails on a unit's own route, blocking CI

**Where:** `platform/scripts/gen-plan-docs.mjs`, the duplicate-route-vs-inventory check:

```js
const inventory = read(INVENTORY_MD) ?? "";
for (const { file, fm } of units) {
  if (!fm.route) continue;
  if (inventory.includes(`\`${fm.route}\``)) {
    errors.push(`${rel(file)}: route \`${fm.route}\` already exists in docs/architecture/inventory.md`);
  }
}
```

Consumed by `npm run docs:plan -- --check`, which is a **required, blocking** step in
`.github/workflows/ci.yml` (`- name: Plan roadmap up to date`) — unlike `docs:check` a few steps
later, which is explicitly `continue-on-error: true`. This one is not.

**What happened, concretely:** Building U002 (`route: /register`), I created
`src/routes/modules/register.routes.tsx` per the unit's own spec, then ran the required
`npm run docs:arch` (regenerates `docs/architecture/inventory.md`'s Routes table from the routes
that actually exist on disk — itself required, since `docs:arch -- --check` fails on a stale
inventory). The regenerated inventory now correctly lists:

```
| `/register` | **app** | public | — | none | src/routes/modules/register.routes.tsx |
```

Immediately after, `npm run docs:plan -- --check` failed:
`docs/plan/units/002-public-visitor-registration.md: route \`/register\` already exists in
docs/architecture/inventory.md` — flagging **U002's own frontmatter `route:` field against the
inventory row that U002's own just-built code produced.**

**Why this isn't a one-off:** the check has no exemption for "this route's inventory entry came
from the very unit declaring it." Every future unit with a non-null `route:` will hit this the
moment its route file exists and `docs:arch` regenerates the inventory — which the COMMIT step of
`.claude/skills/build-app/SKILL.md` requires for every unit, not an edge case. Since CI checks out
the exact same committed files, **this will fail the real GitHub Actions run on this PR**, and on
U003/U004/U005/U007/U008's PRs too, all for the same reason. I could not find a wording workaround
this time (unlike the false positive fixed in `docs/features/home.md`'s status line) because the
collision is against the unit's *own* legitimate route entry, not an unrelated string.

**Suggested fix:** the check needs to recognize "this route belongs to this same unit" and skip it.
Concretely: parse the inventory's Routes table (the check currently searches the *whole file's*
text, not even scoped to that table) to get each row's Module column, and skip flagging when that
Module path is already present in the same unit's own `touches.routes` list. Only flag when the
route exists in the inventory attributed to a *different* module path than any this unit declares.

**What I did instead:** proceeded with the unit — the code itself is correct, only this one CI
check is broken — and recorded the expected `docs:plan -- --check` failure in U002's own
`## Deviations` section so it's visible at review time, not silently hidden. The PR's CI will show
red on this one step; that's expected until this fix lands, not a sign the unit itself is broken.

---

## 10. `platform/framework.json`'s ownership manifest is missing `docs/plan/*.md`

**Where:** `platform/framework.json`'s `"app"` array. It lists `"docs/plan/units/**"` and
`"docs/wip/**"`, but the file's own comment two sections up says: "docs/wip/ + docs/plan/ are
otherwise app-owned, so only their framework files are listed" — the `"app"` array doesn't
actually carry a pattern matching that claim for anything in `docs/plan/` above the `units/`
subdirectory.

**What happened:** `npm run framework:verify -- --check` — the same command CI runs as its
"Framework boundary intact" step — fails with "4 file(s) have no declared owner":
`docs/plan/app.md`, `docs/plan/db-setup.md`, `docs/plan/ROADMAP.md` (all created by `plan-app` in
this app's very first PR, so **this has likely been failing on `main` since before this session's
work started**, not something introduced today), plus `docs/framework-feedback.md` (this file —
new, and not matched by any existing pattern either, being outside every established `docs/`
convention).

**Suggested fix:** add a pattern covering the rest of `docs/plan/` to the `"app"` array —
`"docs/plan/*.md"` (or `"docs/plan/**"` if `units/**`'s already-explicit entry is considered
redundant then and removed) — matching what the comment already claims. Separately, decide where
an ad hoc top-level handover/notes doc like this one is supposed to live and how it gets
classified — `docs/DECISIONS.md`/`docs/OWNERS.md` got individually `seeded` entries; either this
file should join them, or `plan-app`/`build-app` should define a standing convention (with its own
pattern) for this exact "collect framework feedback for later batch review" use case, since it's a
generalizable need for any app built from this skeleton, not specific to Visitor Log.

---

## Not included here (app-specific, not framework/skill gaps)

- The `_visitor` schema's missing FKs (`visitorregister.hostid`/`visitpurposeid` have no declared
  foreign key, unlike `visitorequipment`) is this app's own database design, not a framework
  artifact — recorded instead in `docs/plan/app.md`'s Assumptions section.
- `docs/architecture/user-administration.md` documents two `platform/src/services/users.ts`
  functions (`updateApplicationUser`, `updateRoleAssignment`) that don't exist in the file. This
  **is** a framework doc bug (materialized, `platform/materialized/docs/architecture/
  user-administration.md`) and belongs in a framework fix pass too — noting it here since it was
  found during this app's build but not re-detailing it: the fix is simply removing those two
  names from the function list.
