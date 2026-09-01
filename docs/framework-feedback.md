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

**⚠ Items 9, 11, 13 and 14 are higher severity than the rest.** Item 9 fails a required
(non-`continue-on-error`) GitHub Actions step on every route-bearing unit's PR, not only this
app's. Item 11 already crashed this app's every page in front of the user before it was found and
fixed — it's fixed here, but nothing stops the same pattern in the next app built from this
skeleton. Item 13 ships every portal's public pages with no page padding at all, and a page cannot
correctly fix it itself. Item 14 is the highest-value one for non-frontend users: the sample
library exists precisely so they never need to know words like `aside-left`, and nothing currently
makes Claude actually show it to them.

**Items 13–18 came from a user feedback pass at the end of the build**, after all seven units had
shipped — they are things that only became visible once someone non-expert looked at the finished
app and the transcript. Several (14, 15, 17, 18) are about *how Claude communicates with a
non-technical user* rather than about code, which is a category the skills currently under-specify
almost entirely.

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

**Reinforced by the end-of-build feedback pass:** the user's position is that **this app should not
have a `/home` route at all** — not a `/home` that redirects. The workaround above still leaves a
real route, a real page file, and a `docs/features/home.md` describing a page that does nothing.
So the fix needs to make `/home` genuinely *deletable* by a portal, not merely retargetable:
`landingPath` must be readable everywhere `/home` is currently assumed, and `src/routes/modules/
home.routes.tsx` + `src/pages/Home.tsx` (both `seeded`, per `platform/framework.json`) must be
safe for a portal to delete outright without breaking `Navbar`'s home icon, `Login`'s
post-auth redirect, or `ProtectedRoute`'s access-denied fallback. Worth confirming `app:init`
doesn't re-seed them either.

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

## 11. ⚠ App-crashing pattern — accessing `supabase.<prop>` at module scope in a service file

**Where:** no rule currently forbids this. Belongs in `.claude/rules/service-rules.md` (the file
that governs every `src/services/**`/`platform/src/services/**` file), and the underlying
mechanism belongs in `docs/architecture/routing.md` or `auth.md` so the *why* is documented
somewhere, not just the *don't*.

**What happened:** U001's implementing subagent added, in `src/services/visitor.ts`:

```ts
const rpc = supabase.rpc.bind(supabase) as unknown as UntypedRpc;
```

at **module top level** (a workaround for four RPCs not yet present in the generated Supabase
types — see item elsewhere in this doc about that gap). `supabase` (`platform/src/integrations/
supabase/client.ts`) is a `Proxy` whose `get` trap calls `getSupabaseClient()`, which **throws**
if `appConfig` hasn't finished loading (`appConfig.config.supabase.supabaseUrl` still empty).
`src/services/visitor.ts` gets imported eagerly by the route registry's `import.meta.glob` (used
to build the whole route tree at module scope — `docs/architecture/routing.md`), which runs
*before* `main.tsx`'s `await appConfig.initialize()` resolves. Net effect: **the entire app crashed
before React could mount, on every route** — not a broken page, a blank white screen with one
uncaught error in the console, reported by the user as "Supabase configuration not loaded" and
initially indistinguishable from an `appConfig` loading-order bug. It reproduced identically on a
completely fresh dev server with zero prior state, ruling out HMR staleness before the real cause
was found by tracing the exact throw site to a module-top-level property access.

Fixed in this app by deferring the property access into the function body:

```ts
const rpc: UntypedRpc = (fn) => (supabase.rpc as unknown as UntypedRpc)(fn);
```

**Why this is a framework-level gap, not just one subagent's mistake:** nothing about this pattern
is specific to `rpc` or to a workaround for missing types. `const x = supabase.auth`,
`const client = supabase.schema("_visitor")`, or any other top-level `const ... = supabase.<...>`
in *any* service file has the identical failure mode, because the danger is the combination of two
framework decisions that are individually reasonable: (a) `supabase` is a **lazy** Proxy so a
missing config produces a clear thrown error instead of `undefined` propagating silently, and
(b) route modules — and everything they transitively import, including every service a page's
components use — are imported **eagerly** at app bootstrap so `createBrowserRouter` can build the
whole tree at module scope. Neither (a) nor (b) is wrong alone; a human author is just as likely to
write a module-scope `supabase` access as an AI one, and nothing currently stops them.

**Suggested fix:**
1. Add an explicit rule to `.claude/rules/service-rules.md`: never access any property of
   `supabase` outside a function body — only inside an exported function's implementation, never
   in a top-level `const`. State the reason (eager route-module imports run before `appConfig`
   resolves), not just the rule, so it survives being copied into a different context.
2. Consider whether this is mechanically enforceable — an ESLint rule flagging
   `MemberExpression` on an identifier named `supabase` outside a `FunctionDeclaration`/
   `ArrowFunctionExpression` body would catch it at author time instead of at first page load,
   which is exactly the kind of thing this repo's other `local/*` rules already do for comparable
   footguns (`local/no-inline-edit-in-column`, `local/require-unsaved-guard`).
3. Whoever eventually rewrites `.claude/skills/call-api/SKILL.md` (item 4) should include this as
   a worked "don't do this" example — it's the single most likely place an implementing agent
   reaches for a `supabase.<method>` reference to cache.

---

## 12. `db-setup.md` needs an append-only editing convention, stated up front

**Where:** `plan-app`'s Round 6-equivalent, wherever it's decided this app wants "one DB
prerequisites doc" (see item 7, which already flags this doc type as an ad hoc convention this
session invented rather than something `docs/plan/README.md` defines).

**What happened:** across this build, new SQL was discovered three separate times after the
original `db-setup.md` was written and already run once (a fourth RPC while building U001, a fifth
while building U002, plus several corrections to already-written statements). Each new RPC got
spliced into the middle of an existing numbered section's prose rather than appended, because
nothing said not to. The user eventually had to ask directly — "I don't know which ones are the
new ones... reorder them so users just need to find the latest ones at the bottom" — which is a
process fix that should have been the convention from the first line of the doc, not something
retrofitted after confusion. Fixed in this app by moving the two spliced-in RPCs to a new trailing
`## 8.` section and adding an explicit rule at the top: a later addition is always a new numbered
section appended after the last one, never edited into an earlier section once it may have been
run.

**Suggested fix:** whichever skill or template generates a `db-setup.md`-style doc should write
that append-only rule into the doc's own header from the start (the exact wording added to this
app's copy is a reasonable default to copy), the same way `docs/plan/README.md` already documents
the append-only convention for `src/types/index.ts`'s barrel and `docs/architecture/inventory.md`.
A **correction** to already-written SQL (a bug fix, not new SQL) is a different case and can still
edit the section it's fixing — the append-only rule is specifically about *new* statements that
weren't there before, not about leaving a known-wrong statement in place.

---

## 13. ⚠ `layout: "none"` drops ALL page chrome, not just the navbar — public pages have zero padding

**Where:** `platform/src/routes/AppRouter.tsx`'s `withLayout()`, plus `platform/src/types/routing.ts`'s
`RouteLayout` type (`"default" | "none"`).

**What happened:** the user reported the public registration form (`/register`, `layout: "none"`)
has no padding. Confirmed visually at both desktop and 375px: **the page title sits flush against
the top edge of the viewport, and at 375px the card runs edge-to-edge with no side gutter at all.**
(The card's *inner* padding still works — `Card` owns that — so fields aren't touching glass; it's
the page gutter that's entirely missing.)

The cause is structural, not a page bug:

```js
const withLayout = (r: AppRoute): RouteObject => {
  const leaf: RouteObject = { path: r.path, element: r.element };
  return r.layout === "none" ? leaf : { element: <PageLayout />, children: [leaf] };
};
```

`layout: "none"` returns the bare leaf, skipping `PageLayout` **entirely**. But `PageLayout` owns
four separate things, and its own comment calls itself "the single owner of page-edge padding
(DESIGN.md §7) and max content width":

1. `<Navbar />` — the only one a public page actually wants gone
2. `px-4 sm:px-6 py-6 sm:py-8` — page-edge padding
3. `min-h-screen bg-background` — the page surface
4. `max-w-(--container-max)` — content width cap

So `layout` conflates "no navbar" with "no page chrome whatsoever," and there is no third option.

**Why every portal hits this, not just this app:** the framework's own sample tells public pages to
route this way — `platform/src/samples/samples/FormPagePublic.tsx`'s header comment says *"A real
copy renders with **no navbar** (`realLayout: "none"`, `realAccess: "public"` …)"*, and
`build-from-sample`'s step 4 says to use `realLayout` verbatim. Any portal following that guidance
produces an unpadded public page. DESIGN.md §7 assigns page-edge padding to `PageLayout` and
`pages-rules.md` forbids a page setting its own, so a page **cannot** correctly compensate — the
fix has to be in the framework.

**Suggested fix:** split the two concerns. Either add a third `RouteLayout` value (e.g. `"bare"` —
padding, background and width cap, but no navbar) and point the public samples at it, or keep
`layout` for the navbar only and always wrap in the padding/background/width shell. The second is
cleaner but changes existing `layout: "none"` behavior, so it needs a deliberate call. Whichever
way, update `FormPagePublic.tsx`/`ConfirmationPageSimple.tsx`'s `realLayout` guidance to match, or
portals will keep copying the broken value.

---

## 14. Nothing tells Claude to *show* the user the sample/template gallery and let them choose

**Where:** `.claude/skills/spec-page/SKILL.md` Round 1, and `.claude/skills/build-from-sample/SKILL.md`.

**What happened:** across seven units, Claude picked every template by silent reasoning ("split-card
fits a stats+list dashboard") and never once showed the user what the options looked like. The user
had to discover the problem themselves and ask for `ratio: "aside-left"` **by name** — which is
exactly the framework-internal vocabulary the sample library exists so that users never need. Their
words: *"others believe that other users/developers may not know/should not know that level of
detail, that's why we make so many samples to begin with."*

Two separate failures here, and the framework should fix both:

**(a) The existing instruction is too weak, and was not followed.** `spec-page` Round 1 says
*"Mention that live previews exist at `/sample/templates` … if the user wants to look before
choosing."* Claude never mentioned it, in any round, for any unit. A soft "mention if they want" is
easy to skip; it should be a required step with a concrete action.

**(b) `build-from-sample` was never invoked at all**, even though `build-datatable` § "The three
table samples" points straight at it and it owns the "no sample matches" ladder — including
*"say which rung you are on."* Nothing in `spec-page`'s flow routes into it, so it only fires if
the user names a sample first, which a user who doesn't know the samples exist will never do.

**Suggested fix:** make Round 1 of `spec-page` actually *show* the options rather than reason about
them privately:

1. Start the dev server (`preview_start`) and give the user real URLs — "have a look at
   `localhost:8080/sample` and `localhost:8080/sample/templates`, tell me which is closest to what
   you want." The gallery's props toolbar makes each configuration linkable (`?width=narrow`), so
   the user can compare arrangements without knowing any prop names.
2. Propose a default with reasoning, but **ask them to confirm or pick a different one** — never
   settle it silently. Frame the options by what they look like and are for, not by prop values.
3. Route into `build-from-sample`'s ladder explicitly and state the rung out loud, as that skill
   already requires.

This is the single highest-value fix in this document for non-frontend users: it converts a
decision Claude currently makes invisibly into one the user makes by looking at pictures.

---

## 15. Nothing tells Claude to escalate database work to whoever administers Supabase

**Where:** `plan-app`, `build-app`, and whatever produces a `db-setup.md`-style doc (see items 7
and 12).

**What happened:** across this build Claude repeatedly wrote things like *"a human must add
`_visitor` to Supabase's exposed schemas"* or *"anon needs INSERT granted"* — factually correct,
but never saying **who that human is**. The user pointed out that someone using Claude to generate
an app "may not understand what's happening underneath with Supabase at all." They may not know
what a schema, a grant, an RPC, or RLS is, may not have dashboard access, and may not realize this
is a task to hand to someone else rather than something Claude forgot to do.

**Suggested fix:** wherever a skill emits a DB prerequisite, require phrasing that names the
escalation path and the reason, in plain language — e.g. *"This needs someone with admin access to
your Supabase project. Send them `docs/plan/db-setup.md` §1. Neither you nor I can do this from the
app — it's a database permission setting."* Same for new RPCs, grants, and exposed schemas. The
existing `docs/PREFLIGHT.md` has a "Team alignment" section that could carry a standing "who owns
the database" line the plan then refers back to by name.

---

## 16. The PR flow has no "solo developer with a remote" mode, and its human/Claude split is undocumented

**Where:** `.claude/skills/build-app/SKILL.md` § "PUSH AND PR", and `docs/plan/README.md`'s
"No remote configured yet" section.

**What happened:** the user asked, reasonably, *"are humans still expected to accept the PR and
merge into main ourselves? Or are you going to do it?"* — and noted the real cost: with work spread
across unmerged branches, running the app locally on `main` shows none of it, which is confusing
for anyone who doesn't think in branches. Mid-session they asked Claude to merge everything
directly, and the rest of the build ran that way instead.

The skill only distinguishes **two** worlds: origin configured (open a PR, never auto-merge) and no
origin at all (squash-merge to local `main`). There is no mode for the common real case: *a remote
exists, but one person is building, and they want to see their app work locally right now.* The
"never auto-merge" rule is a sensible default for a team — it preserves the one human review
checkpoint — but it is a **policy** choice, not a capability limit, and the skill never says so.

Also undocumented anywhere a user would find it: what Claude can and cannot actually do.

| Step | Claude | Needs |
| --- | --- | --- |
| Create/commit/push a branch | ✅ | git + remote |
| Merge a branch into `main` and push | ✅ | git + remote (policy currently discourages) |
| Create a **PR object** | ❌ | `gh` or `tea` installed **and** authenticated |
| Merge a PR | ❌ | same, and `build-app` forbids it regardless |

**Suggested fix:** add a third delivery mode, chosen at `plan-app`'s Round 6 alongside the gate
policy — something like `delivery: pr | direct-to-main`. `direct-to-main` merges each verified unit
straight to `main` even with a remote configured (the GATE step already served as the review, which
is the same argument `docs/plan/README.md` already makes for the no-remote case). Document the
capability table above in `docs/PREFLIGHT.md` so a user knows before starting whether they need to
install `gh`, and state plainly that PRs exist to let **multiple developers** build concurrently —
so a solo user can knowingly opt out instead of inheriting branch overhead they never wanted.

---

## 17. Claude's questions to the user use frontend jargon

**Where:** `.claude/rules/clarifying-questions.md` (which governs question *budgets* but says
nothing about question *language*), and every planning skill that calls `AskUserQuestion`.

**What happened:** the user flagged phrasing like *"inline zod errors"* — understandable to them,
but not to "someone who didn't build this framework or doesn't know frontend development." The same
applies to plenty else Claude used in questions and summaries this session: RLS, queryKey
invalidation, camelCase mapping, `staleTime` tiers, `expandMode`, side sheet vs modal, client-mode
vs server-mode tables.

The person answering these questions is often the one who knows the *business* (who hosts visitors,
what reception needs) — not the stack. A question they can't parse gets a guessed answer, which is
worse than no question.

**Suggested fix:** add a "how to phrase a question" section to
`.claude/rules/clarifying-questions.md`, since every planning skill already cites that file for
budgets:

- Describe the **outcome the user would see**, not the mechanism —
  *"red error messages appear under each field"*, not *"inline zod errors"*;
  *"a panel slides in from the right"*, not *"a side sheet"*;
  *"only people you're hosting"*, not *"RLS scopes it by `is_current_host`"*.
- Keep the technical term in parentheses **after** the plain description when it's useful for a
  developer skimming — plain first, jargon second, never jargon alone.
- Close every question set with an explicit invitation: *"ask me to explain anything that isn't
  clear."* Currently the ceiling rules encourage wrapping up fast, with nothing balancing that
  toward comprehension.

---

## 18. "the U003 spec" is ambiguous shorthand to anyone who hasn't read `docs/plan/README.md`

**Where:** `.claude/skills/build-app/SKILL.md`'s GATE step, which tells Claude to show a "digest"
of the spec but never to say where the spec lives.

**What happened:** the user asked *"When you say e.g. 'U003 spec', which spec are you referring to?
The docs inside docs/plan/units…?"* — correct, but they had to ask. Claude used the shorthand
dozens of times without once naming the file.

**Suggested fix:** have the GATE step name the path the first time per unit — *"Here's the spec I
wrote to `docs/plan/units/003-my-visits.md`"* — so the user knows the artifact exists, where to
read it in full, and what they're approving. Cheap, one clause, removes the guesswork.

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
