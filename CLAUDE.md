# CLAUDE.md

## Project Overview

Visitor log for Tesla Consulting's office. Visitors register themselves on arrival via a public
form (host, purpose, brought equipment); Staff see the visits they host, the Office Manager sees
every visit and checks visitors out, and a User Admin manages accounts and roles. Auth is
password-based. Desktop-first for the three internal pages, but the public registration form must
work at 375px since it's reached by a QR code at reception. Single-tenant.

## Before Every Task

**1. Orient in time.** Before reading any doc, run:

```
git log --oneline -20 main
git branch -r --sort=-committerdate | head -10
ls docs/wip/
```

`main`'s history is squash-merged (one commit = one unit of shipped work); on a branch, also run
`git diff --stat main...HEAD` for your own uncommitted context.

**2. Read the docs, knowing what each one is for.**

| Source | Answers | Trust level |
| --- | --- | --- |
| `git log` / `git diff` | What changed recently, on `main` or here | Ground truth |
| `docs/wip/*.md` | What other developers are building right now | Ground truth |
| `docs/architecture/inventory.md` | Does durable shared infrastructure exist? | Generated index — verify before relying |
| `docs/architecture/*.md` | Why something is built the way it is | Hand-written — may lag |
| `ARCHITECTURE.md` | Where do I look for the above? | Thin pointer — rarely changes |
| `CLAUDE.md`, `.claude/rules/*` | What conventions to follow | Policy — follow it |
| `README.md` | Onboarding narrative | Background — may lag |
| `docs/plan/units/*.md` | The agreed spec for one page/unit of an app build | Ground truth (user-approved) once `status: spec-ready` or later |
| `docs/plan/ROADMAP.md` | What's planned for this app, what's next | Generated index — verify before relying |

**3. Reconcile before you trust.** Hand-written docs can lag `main` — if a recent commit
touches an area a doc describes, believe the code, **say so out loud**, and offer to fix the
doc in the same PR. Never silently work around a stale doc: the next agent hits the same wall.

**4. Check for collision.** Read every file in `docs/wip/` — if another branch claims a file or
component you're about to create, STOP and tell the user which branch claims it before writing
anything.

**5. Check for an app build in progress.** If `docs/plan/` exists, read `docs/plan/ROADMAP.md`
(`npm run plan:next` prints the next buildable unit): don't build a page that isn't a unit there,
or build one out of order (see `.claude/skills/build-app/SKILL.md`).

**6. Claim your work.** Once the plan is agreed, write `docs/wip/<branch>.md` (template at
`docs/wip/_TEMPLATE.md`) as your first commit on the branch.

**7. Read the relevant skill from `.claude/skills/` before starting work.**

**8. On completion:**
- Record what you built, in exactly one place — never two, or they drift:
  - Built **manually** (`plan-new-page` / `plan-new-feature`): create
    `docs/features/<feature>.md`. There is no unit spec on this path, so this is the only durable
    record of the page's behaviour. Never append to a shared doc.
  - Built through **`build-app`**: the unit's own `docs/plan/units/NNN-*.md` is the record,
    including its `## Deviations` section. Write a `docs/features/<feature>.md` **only** if the
    feature spans more than one unit, and then only for what a unit file cannot say — the flow
    across pages, state outliving one page, invariants the pages jointly uphold. Link the unit ids;
    don't restate their fields or actions.
- Update `docs/architecture/<area>.md` if you added or changed durable shared infrastructure.
- Update `CLAUDE.md` / `.claude/rules/*` if you changed a convention (this is a `policy/` branch —
  see `CONTRIBUTING.md`).
- Delete `docs/wip/<branch>.md` in your final commit.

## Behaviour Guidelines

**Think before coding.** State assumptions explicitly; ask if uncertain. Present tradeoffs —
don't pick silently among multiple approaches. Push back if a simpler approach exists. Name
what's confusing rather than guessing.

**Minimum code, nothing speculative.** No features beyond what was asked, no abstractions for
single-use code, no unrequested "flexibility." If 200 lines could be 50, rewrite it.

**Touch only what you must.** Don't improve adjacent code/comments/formatting, don't refactor
things that aren't broken, match existing style. Remove imports/variables *your* changes made
unused — leave pre-existing dead code alone.

**Every changed line should trace directly to the request.**

### Keeping diffs reviewable

An agent session touches more files than a human would by default. Prettier + `.editorconfig` +
`.gitattributes` (§Commands) and the ESLint layering rules (`eslint.config.js`) already remove
whitespace-noise and wrong-layer-import diff — what's left is what a formatter can't cover:

- **Separate `mechanical:` commits** (rename/move/format) from logic commits — never mixed; a
  reviewer can't see a behaviour change through a rename.
- **Append, don't reorder** in shared files (`src/types/index.ts`'s barrel,
  `src/lib/constants/index.ts`'s barrel, `docs/architecture/inventory.md`) — alphabetising or
  regrouping turns a small conflict into a whole-file conflict for everyone else in flight.
- **`npx shadcn add --overwrite <component>` resets it to pristine**, wiping this repo's
  customizations (isLoading, radius, `bg-input-background`, `control-disabled*` tokens — see
  `docs/architecture/ui.md`). Make regeneration its own `mechanical:` commit, reapply
  customizations by hand in the same commit, and flag it in the PR — otherwise it silently
  reverts someone else's fix.
- **On a rebase conflict, re-read both sides and `git log -1 <their-sha>` before resolving** — if
  the other side's intent is unclear, stop and ask; you lack their session's context, and taking
  one side wholesale is a guess, not a fix.
- **State your blast radius** at the end: every file touched, one clause each saying why — can't
  justify one, revert it. This is what the PR template's "files touched outside the stated scope"
  box is for.

For a human reviewing an agent's diff: check the PR template's scope box, `git diff --stat`, the
non-mechanical commits, then `.claude/**`. A surprising file list means send it back before reading
code — the scope surprise is usually the real defect; the code underneath is usually fine.

## Tech Stack

React 19 + TypeScript + Vite, Supabase, TanStack Query, Tailwind v4, shadcn/ui (Base UI
primitives), React Router v8 (data mode), react-hook-form + zod, Azure Entra ID, Sonner

## The framework boundary — extend, never edit

This repo is split in two so a portal can keep receiving framework updates forever
(`platform/framework.json` is the manifest; `docs/DECISIONS.md` has the reasoning). **Check
`package.json`'s `framework.role` before you edit anything outside `src/`:**

| `framework.role` | What this repo is | `platform/**` |
| --- | --- | --- |
| `"source"` | The framework's own repo / the template | **Editable** — this is where framework work happens |
| `"consumer"` | A portal built from it | **Read-only.** `npm run framework:verify` fails and `.claude/hooks/guard-framework.mjs` blocks the write |

### The one-line rule

`@framework/*` is what you may not edit. `@/*` is what you write.

### In a portal, when the framework doesn't do what you need

Do **not** edit the framework file. A local fork survives inside every future `framework:update`
merge (subtree *merges*, it does not overwrite), so it silently becomes permanent — that is the
exact failure the boundary exists to prevent. Pick one of these instead, cheapest first:

1. **Configure it.** `public/config/app.json` (auth mode, company/portal name, pagination) and
   `src/theme.css` (every design token value) are app-owned by design.
2. **Extend it from app code.** Wrap the framework component in your own
   `src/components/<PageName>/` component; add a route module under `src/routes/modules/`; add a
   hook or service in your own domain folder.
3. **Upstream it.** If the framework genuinely needs to change, the change belongs in the framework
   repo so *every* portal gets it — not in one portal's copy:
   - Make the change in the framework's own repo (`framework.role: "source"`).
   - `npm run framework:lock` to re-pin, then `npm run framework:publish -- --tag vX.Y.Z`.
   - Back in the portal: `npm run framework:update`.
   - If you're in the portal and can't do that now, say so and stop. Don't fork as a workaround.

If you already edited a framework file and haven't committed: `npm run framework:reset`. If you
committed it, `framework:update` will refuse to run and tell you — upstream the change or revert it.

**What a portal owns and the framework never touches:** everything under `src/` except the
framework's own subtree, plus `docs/features/`, `docs/plan/units/`, `docs/wip/`, `docs/brand.md`,
`docs/DECISIONS.md`, `docs/OWNERS.md`, `CLAUDE.md`, `README.md`, and any skill you add under
`.claude/skills/`. Adding a *new* file in app-owned territory is always fine.

### Working in the framework's own repo (`role: "source"`)

Some framework files exist **twice**: a canonical copy inside `platform/materialized/` (which is
what a framework update actually delivers) and a deployed copy at the path tools read it from.
`DESIGN.md`, `tailwind.md`, `vite.config.ts`, the tsconfigs and the framework's
`docs/architecture/*.md` all work this way — see `platform/framework.json`'s `materialized` block
for why they can't just live in a subtree prefix.

Editing one of them the obvious way — open `DESIGN.md`, change it — leaves the canonical copy stale,
and `npm run framework:apply` would then overwrite your edit with the older version. Two safe
routes:

- Edit `platform/materialized/<path>`, then `npm run framework:apply` to deploy it. Preferred.
- Or edit the deployed file and run `npm run framework:apply -- --adopt` to promote it into the
  canonical copy. Only works in `role: "source"` — a portal's deployed copy is never authoritative.

Either way finish with `npm run framework:lock`. `framework:apply -- --check` runs in CI, so a
forgotten step fails the build rather than shipping a silently stale framework.

## Folder Structure

`src/` is app-owned; `platform/src/` is the framework, read-only in a portal
(`platform/framework.json`). Reach framework code as `@framework/<path>`, app code as `@/<path>`.

- `src/pages/` — one file per route, composition only, no data logic. The framework's own system
  pages (`Login`, `NotFound`) live at `platform/src/pages/`; its sample gallery at
  `platform/src/samples/`
- `platform/src/templates/` — page shells (the frame a page's content drops into) plus
  `registry.ts`, one entry per shell describing its holes and arrangement props. Templates are
  named by arrangement, never by job ("Single card", not "Form page"). Structure only: no data,
  no hooks, no Base UI — `docs/architecture/templates.md`. Framework-owned only; no app-side
  equivalent
- `platform/src/components/ui/` — the shared component library: shadcn-derived primitives
  (kebab-case, e.g. `button.tsx`) and custom/composed components (PascalCase, e.g.
  `DatePicker.tsx`) live here together — see `.claude/rules/architecture-rules.md` for the
  edit-freedom split
- `src/components/<PageName>/` — page-scoped components (forms, filters, tables), app-owned
- `src/services/` — all Supabase/API calls, nothing else. Framework's own services
  (`auth`, `menu`, `roles`, `screens`, `users`) live at `platform/src/services/` —
  `docs/architecture/user-administration.md`
- `platform/src/hooks/shadcn/` — where `npx shadcn add` writes a generated hook
  (`components.json`'s `aliases.hooks`), framework-owned. **Does not exist today** — no shadcn
  component this repo uses ships a hook, so don't expect to find one there
- `src/hooks/<domain>/` — TanStack Query wrappers, co-located by domain, app-owned
- `src/lib/` — utilities and helpers, app-owned; framework's own at `platform/src/lib/`
- `src/lib/constants/` — ALL constants, one file per domain, never inside components or pages.
  App owns `roles.ts` (`ROLES`, starts empty); framework owns `app.ts`/`permissions.ts`/
  `sampleNav.ts` at `platform/src/lib/constants/`
- `platform/src/lib/shadcn/shadcn-utils.ts` — shadcn utils (cn() etc.), framework-owned
- `src/types/` — all TypeScript types, one file per domain, re-exported from `index.ts`. All
  current type domains are framework-owned at `platform/src/types/`; add this portal's own here
- `platform/src/routes/` — AppRouter.tsx, registry.ts, ProtectedRoute.tsx,
  `modules/<area>.routes.tsx` for framework-owned areas (`auth`, `samples`). App route modules
  (`home.routes.tsx`, and any new area) stay at `src/routes/modules/` — the registry globs both
  roots, auto-discovered — never add a route anywhere else
- `platform/src/app/layout/` — layout components, framework-owned

## Naming

| Type                             | Convention | Example             |
| --------------------------------- | ---------- | ------------------- |
| Components                        | PascalCase | `UserTable.tsx`     |
| Hooks                              | camelCase  | `useNavMenu.ts`     |
| Services                           | camelCase  | `menu.ts`           |
| `ui/` shadcn-derived primitives    | kebab-case | `dropdown-menu.tsx` |

Use `type` not `interface`. No `export default` — named exports only.

## Architecture

**Component layers:** Pages → Templates (`platform/src/templates/`) → UI base components
(`platform/src/components/ui/`) → Base UI primitives. A template owns a page's frame (width, header
placement, card wrapping) and nothing about fields, columns, or data. Page-edge padding is
`PageLayout`'s job, not a template's (DESIGN.md §7). It renders *inside* `PageLayout`'s
`<Outlet />` — "layout" means route chrome, never page structure.
**Data layers:** Pages → Hooks (useQuery/useMutation) → Services (Supabase) —
never skip a layer. Never add a route `loader`/`action` (React Router v8 data mode supports them)
— this is the only sanctioned data path.

Full rules (component edit-freedom, DB column mapping, Supabase types regen, routing conventions,
auth, storage conventions) → `.claude/rules/architecture-rules.md`. Read it before touching
routing, auth, or wiring a new service+hook+page together.

## Design System

- Read `DESIGN.md` before generating any UI; read `tailwind.md` before touching any stylesheet
- **`DESIGN.md` is framework-owned and describes the *default* system — never edit it per portal.**
  Trust its role list and component specs; for the values *this* portal actually uses read
  `src/theme.css`, and for why they differ read `docs/brand.md` (app-owned decision log)
- **Three stylesheets, split by owner** — a token *value* goes in `src/theme.css` (app-owned), a
  Tailwind *mapping* goes in `platform/src/styles/framework.css` (framework-owned, read-only in a portal),
  and `src/index.css` is a shim holding font URLs plus the two imports. Adding a token touches the
  first two. See `.claude/rules/index-css-rules.md` for which file and why the load order matters
- **The legal token list is generated** into `docs/architecture/inventory.md` § Design tokens (from
  the framework CSS's `@theme inline`) — read it rather than recalling it
- Use shadcn semantic tokens only (`bg-background`, `text-foreground`) — never raw hex, Tailwind
  palette classes (`bg-blue-500`), or `bg-white`/`text-black`. **`npm run lint` errors on all of
  these** (`local/no-raw-colors`), plus off-4px-scale spacing outside `platform/src/components/ui/`
  (`local/no-off-scale-spacing`) and `style={{}}` props (`local/no-inline-style`) — see
  `platform/scripts/eslint-rules/design-tokens.js`
- Fonts: `font-sans` (Inter) is the default body typeface; `font-heading` (Poppins) is applied
  explicitly on headings/subtitles per `DESIGN.md` §3 — not automatic
- Dark mode via `ThemeProvider` — never toggle `.dark` class manually
- Icons: `react-icons` (Phosphor, `react-icons/pi`) only — `size-4` default, `size-5` for
  standalone icon buttons — `DESIGN.md` §4
- Radius: `rounded-sm` (buttons/inputs/chips), `rounded-md` (cards), `rounded-lg` (modals; sheets are square),
  `rounded-full` (avatars/pills/switches) — `DESIGN.md` §5
- No shadow outside dropdowns/modals/popovers — use `border` instead; no animation/transitions on
  data-heavy views
- No `style={{}}` props, no raw `--primary-*`/`--neutral-*` ramp steps in components, and **no
  fourth CSS file** — the three above are the whole stylesheet surface — full token rules (format,
  exceptions, promotion procedure) in `.claude/rules/index-css-rules.md`, read before editing any
  of them
- Building UI no template or component covers → `.claude/skills/build-custom-ui/SKILL.md`. Lint
  catches the wrong *vocabulary*; it cannot see *composition* (competing heading sizes, cluttered
  internals), which is what that skill's screenshot step is for
- Run the `plan-design` skill before setting up or changing the design

## UX Principles

These are internal tools — users repeat the same tasks many times a day.

- Destructive actions need confirmation; routine actions do not
- Every async action needs three states handled: loading, success, error
- Loading skeletons for data; spinner inside button for actions
- Toast on success · inline error on form fields · toast on network failure
- Pre-populate fields from context where possible (current tenant, today's date)
- After a successful mutation, return the user to where they were
- Default page size: 25 rows
- Don't over-engineer: if a task needs 3 steps, don't build a 5-step wizard

**Every page must work on a phone.** Not "eventually" — as it is built. Internal tools get opened on
phones more than their designs admit, and a public form reached by link is *usually* opened on one.

- Check it at 375px before calling a page done. The common failures are a fixed width or a
  `min-w-*` that cannot shrink, a flex child without `min-w-0` overflowing the screen, a table
  that widens its container instead of scrolling inside it, and padding that does not step down
- The layers already handle the basics — `PageLayout` owns page-edge padding, the templates own
  width, `Card` steps its own inset down below `sm`. Hand-rolling any of those is what breaks
  mobile, not the absence of extra classes
- **If something genuinely cannot be made to work at 375px, say so and ask** — a dense
  many-column table, a side-by-side diff, a wide chart. Omitting it on mobile, or replacing it with
  a different affordance there, is a legitimate answer; silently shipping something unusable is not

## Commands

See `docs/COMMANDS.md`.

## Skills

Read the relevant skill before starting these tasks:

**Planning (run in plan mode first)**

- Planning a whole application from scratch → `.claude/skills/plan-app/SKILL.md`
- Building/continuing an app plan autonomously, unit by unit → `.claude/skills/build-app/SKILL.md`
- Filling in one page's spec just before building it → `.claude/skills/spec-page/SKILL.md`
- Planning a single page → `.claude/skills/plan-new-page/SKILL.md`
- Planning a multi-page feature → `.claude/skills/plan-new-feature/SKILL.md`
- Debugging a bug or error → `.claude/skills/plan-debug/SKILL.md`
- Setting up or changing design → `.claude/skills/plan-design/SKILL.md`

**Implementation**

- Data table page → `.claude/skills/build-datatable/SKILL.md`
- New route → `.claude/skills/add-new-route/SKILL.md`
- Form page → `.claude/skills/build-form-page/SKILL.md`
- "Build it like <sample page>" → `.claude/skills/build-from-sample/SKILL.md`
- New UI component → `.claude/skills/add-ui-component/SKILL.md`
- New page template / designer layout sample → `.claude/skills/add-page-template/SKILL.md`
- Custom UI no template or component covers → `.claude/skills/build-custom-ui/SKILL.md`
- Adding types → `.claude/skills/add-types/SKILL.md`
- Fetching data / API → `.claude/skills/call-api/SKILL.md`
- Generating DB types → `.claude/skills/gen-supabase-types/SKILL.md`
- Resolving a rebase/merge conflict → `.claude/skills/resolve-conflicts/SKILL.md`

## Rules

Read when working in these areas:

- `src/services/` → `.claude/rules/service-rules.md`
- `src/hooks/` → `.claude/rules/hooks-rules.md`
- `src/components/` → `.claude/rules/components-rules.md`
- `src/pages/` → `.claude/rules/pages-rules.md`
- `src/index.css`, `src/theme.css`, `platform/src/styles/framework.css` →
  `.claude/rules/index-css-rules.md`
- `platform/src/lib/dateTimeUtils.ts`, `numericUtils.ts`, `layoutUtils.ts`, `functions.js` →
  `.claude/rules/utils-rules.md`
- Cross-layer work (data fetching, DB mapping, routing, auth, storage) →
  `.claude/rules/architecture-rules.md`
- Any planning skill's clarifying questions → `.claude/rules/clarifying-questions.md`
