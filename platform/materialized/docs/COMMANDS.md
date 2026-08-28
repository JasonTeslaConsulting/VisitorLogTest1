# Commands

Reference for this repo's npm scripts. See `CLAUDE.md` for when to use which.

- Dev server: `npm run dev`
- Dev server, signed in as a synthetic user (no real account needed — see
  `docs/architecture/auth.md` § Dev auth bypass): put `VITE_DEV_AUTH=true` (and optionally
  `VITE_DEV_AUTH_ROLES=admin,approver`) in `.env.local`, then `npm run dev`. Never ships to
  production — CI asserts it's absent from every build.
- Type check: `npx tsc --noEmit --project tsconfig.app.json` (a bare `tsc --noEmit` is a silent
  no-op on this repo's project-references `tsconfig.json`)
- Lint: `npm run lint`
- Build: `npm run build`
- Add shadcn component: `npx shadcn@latest add --overwrite <component>`
- Regenerate the app-plan roadmap: `npm run docs:plan` (no-ops if `docs/plan/units/` doesn't exist)
- Next buildable unit in the app plan: `npm run plan:next`

## Starting a new portal

Three ways in. They differ only in what happens to git history, and that alone decides whether you
ever have to touch a framework command. **Prefer the first.**

### 1. Clone the template, push to your own repo — recommended

This is the path to use when the portal's repository already exists on Gitea/GitHub and is **empty**.
You clone the *template*, not your new repo — cloning an empty repo gives you nothing to work with —
then repoint `origin` and push:

```bash
git clone <portal-template> acme-portal && cd acme-portal
npm install
npm run app:init -- --name "Acme Portal" --company "Acme Corp" --origin <your-empty-repo-url>
git push -u origin main
```

That is the whole thing. **Starting a portal this way requires no knowledge of the framework's
plumbing** — no subtree commands, no `framework:link`. If you find yourself needing either,
something upstream is missing; see "Framework boundary" below.

Two things make this the recommended path:

- **The template's history comes with you, and that history is load-bearing.** The git-subtree merge
  base every framework prefix needs lives in it, so `framework:update` works from day one.
- **`git clone` brings the default branch only**, so the template's in-flight branches don't follow
  you into the portal.

Create the destination repo with **no initialising files** — no README, no `.gitignore`, no licence.
Gitea and GitHub both offer to add them, and any one of them puts a commit on `main` that the push
above is not a descendant of, so the push is rejected as non-fast-forward.

### 2. "Use this template" on Gitea/GitHub

The button copies the files into a single fresh `Initial commit`. Convenient, and it costs two
things — both fixed by one extra command and one extra flag:

```bash
git clone <your-new-repo> acme-portal && cd acme-portal
npm install
npm run app:init -- --name "Acme Portal" --company "Acme Corp" --origin <your-new-repo-url>
npm run framework:link
```

- **No history means no subtree base**, so `framework:link` is required before this portal can ever
  receive a framework update. This is the same position `--reset-history` leaves you in (below), just
  arrived at without choosing it. `app:init` detects it and prints the step for you.
- **Pass `--origin` even though `origin` is already correct.** This is the one path where the
  inherited `origin` points at your own new repo rather than at the template — but `app:init` removes
  any `origin` it was not explicitly told to keep, so naming it is what stops it being deleted.
  Forgetting is a nuisance, not a loss: `app:init` prints `git remote add origin <url>` as the first
  remaining step.

Both costs are avoidable — path 1 has neither.

### 3. `--reset-history` — who, when, and what it costs

Discards `.git` and starts a fresh single-commit history. Irreversible.

- **Who:** the framework maintainer, or someone who has confirmed the framework repo exists and
  `platform/framework.json`'s `subtree.remote` is set. Not a default step.
- **When:** only when the portal genuinely must not carry the template's history — e.g. the repo is
  shared with a client who shouldn't see framework development.
- **What it costs:** the git-subtree merge base for every framework prefix lives *in git history*.
  Discarding history destroys it, so `framework:update` cannot pull until `framework:link` has
  rebuilt it — and `framework:link` refuses while `subtree.remote` is null. **Passing this flag
  before the framework repo exists strands the portal with no way to receive updates.** Keeping the
  history costs nothing but a longer `git log` and preserves the base for free.
- **What it does not buy you:** a one-commit history. `framework:link` re-adds each of the three
  prefixes, so you end up with the initial commit plus roughly seven commits of framework plumbing.

### What `app:init` does, on every path

It sets the package name, **flips `framework.role` to `"consumer"`** (which is what arms the
framework boundary — until then nothing is enforced, so a portal will happily edit framework files
and only find out at its first `framework:update`), stamps `public/config/app.json`, resets
`docs/DECISIONS.md` to a fresh log, clears the template's `docs/wip/` claims, redeploys the
materialized files, and deals with `origin`. It refuses to run on a dirty tree. Add `--dry-run` to
print every change and write nothing — worth doing on your first portal.

**`origin` is always dealt with, and that matters.** On path 1 a clone inherits `origin` pointing at
the *template*, so a reflexive `git push -u origin main` would send a client's portal into the
template repo. Pass `--origin <url>` and it is repointed; omit it and the inherited one is
**removed**. A portal with no origin is a nuisance you notice at once; a portal quietly pushing to
the template is an incident you notice much later.

It then prints only the steps that actually remain — pushing, the Supabase values,
`gen-supabase-types`, `docs/OWNERS.md`. `framework:link` appears **only if** this portal really has
no git-subtree base, so on path 1 you never see it.

It deliberately does **not** set `platform/framework.json`'s `subtree.remote` (framework-owned, and
the same for every portal — the maintainer sets it once upstream), does not push, and does not touch
your database.

### Supabase credentials — two flags, or one file, and nothing else

`--supabase-url` and `--supabase-key` are **flags on `app:init`**, not a separate command:

```bash
npm run app:init -- --name "Acme Portal" --company "Acme Corp" --origin <url> --supabase-url https://<project-ref>.supabase.co --supabase-key <publishable-anon-key>
```

**Omit them and both fields are written blank** — not left as the template's — so the app will not
boot until you fill them in. That is deliberate: `public/config/app.json` is tracked, so without the
blanking a new portal would silently read and write the *skeleton's* database.

If you did omit them, the one and only place the values go afterwards is
**`public/config/app.json`**:

```json
{
  "supabase": {
    "supabaseUrl": "https://<project-ref>.supabase.co",
    "supabasePublishableKey": "<publishable-anon-key>"
  }
}
```

Nowhere else. No `.env`, no `import.meta.env`, nothing hardcoded in `src/`, and no edit to
`platform/src/app/appConfig.ts` or `platform/src/integrations/supabase/client.ts` — `appConfig`
fetches `/config/app.json` at startup and the client reads its values from there, and both files are
framework-owned, so the boundary check rejects the edit anyway.

Because that file is fetched over HTTP from `public/`, **it is served to every browser that loads
the portal.** Only the publishable (anon) key ever belongs in it. A service-role key put here is
published, not configured.

## Repositories and branches

Three kinds of repository. `package.json`'s `framework.role` tells you which one you are standing
in, and that decides which commands below apply to you.

| Repository | `framework.role` | What it is |
| --- | --- | --- |
| the **template** (e.g. `portal-app-template`) | `source` | A complete, runnable app. Cloned to start a portal, **and** where all framework work happens. `platform/`, `.claude/` and `.agents/` are ordinary directories here. |
| the **framework repo** (`subtree.remote`) | — | A delivery channel, not a workspace. Nobody clones it to work in it. It has no `platform/` directory of its own. |
| each **portal** | `consumer` | One per client. Receives framework releases; owns everything else. |

The framework repo holds **three branches, one per subtree prefix** — and they are *outputs*, like
`dist/`. There is nothing to check out and nothing to edit there:

| Prefix in the template | Branch in the framework repo |
| --- | --- |
| `platform/` | `main` |
| `.claude/` | `claude-policy` |
| `.agents/` | `agents-policy` |

Each is a separate `git subtree split` history whose **root** is that directory's contents — which
is why the framework repo has no `platform/` folder. The three share no commits and are never
merged with each other.

**You only ever edit the template**, on a branch, through a PR, like any other change. One
`npm run framework:publish` then fans a single set of commits out to all three branches, working out
which commit touched which prefix by itself. A commit that adds a button variant *and* edits a skill
lands on `main` and `claude-policy` respectively with no manual sorting.

## Framework boundary

The framework/app split (`platform/framework.json`, `docs/DECISIONS.md`). Which of these you'll
ever run depends on `package.json`'s `framework.role`:

**In a portal (`role: "consumer"`) — normally just one:**

- Pull the latest framework: `npm run framework:update` takes the branch tip, whatever that
  currently is. `npm run framework:update -- --tag v1.2.0` takes that specific release instead.

  **Pinning works in both directions.** A portal can sit on v1.1.0 while the framework is at
  v1.3.0, advance when it chooses, and move back if a release turns out badly — verified end to end
  across 0.1.0 → 0.2.0 → 0.3.0 → 0.2.0, ordinary framework code and the deployed `materialized`
  copies both tracking the target release. That works *because* of the boundary: a portal has no
  local edits under `platform/` for a backwards merge to conflict with. A forked framework file is
  the case that breaks it, which is why `framework:update` refuses to run against a diverged tree
  at all. Your own `.claude/skills/<name>/` and `.claude/settings.local.json` are untouched in
  either direction.

  `framework:verify` prints the version you are on (`framework v1.2.0, role: consumer`), read from
  `platform/framework.json` — there is no separate pin file to get out of sync.
- `npm run framework:link` — **normally never, and not an app developer's job.** The git-subtree
  merge base that `subtree pull` needs lives in git history, so once the maintainer has linked the
  *template* once, every clone inherits it and `framework:update` just works. You only need this in
  two situations, both of which `app:init` and `framework:update` detect and name for you: a portal
  whose history was discarded (`--reset-history`, or a host's "Use this template" button), or a
  portal linked before the framework gained a new prefix. It links only what's missing.

  It takes `--tag v1.2.0` too. Linking is where a history-less portal gets its *first* framework
  content, so naming the release here starts it on the version you want rather than on whatever the
  branch tip happens to be.

  The framework arrives as **three** subtree prefixes, because subtree can only ever see one
  directory: `platform/` (runtime code), `.claude/` (agent policy — Claude Code reads it from that
  hardcoded path) and `.agents/`. `framework:link` links whichever ones are missing, so it is also
  the upgrade path for a portal linked before a prefix was added. Framework files that can't be in
  any prefix — `DESIGN.md`, the framework `docs/architecture/*`, `vite.config.ts` — travel as
  canonical copies inside `platform/materialized/` and are copied out by `framework:apply`, which
  `framework:update` runs for you.

  You can add your own skill under `.claude/skills/<name>/` even though `.claude/` is a subtree:
  `subtree pull` merges, so your skill survives every update, and it classifies as app-owned so it
  is never hash-checked.

  **`.claude/settings.json` is framework-owned, so put your own Claude Code settings in
  `.claude/settings.local.json` instead.** That file is gitignored and per-developer, and it is
  where a portal's extra permission allowlist entries or `env` overrides belong. Nothing syncs
  it, `framework:verify` never looks at it, and `framework:link` deliberately leaves it alone
  when it relinks `.claude/` — so it survives every framework operation. Settings load at
  session start, so a change takes effect in your next Claude session, not the current one.
- Discard local edits to framework files: `npm run framework:reset` (add `-- --dry-run` to preview).
  Only helps for *uncommitted* edits; a committed fork needs upstreaming or a revert, and the
  command says so.
- Check the boundary: `npm run framework:verify` (`-- --check` to fail, as CI does)

**In the framework's own repo/template (`role: "source"`):**

The release loop, in this order — two of these steps are the ones people forget:

```bash
git checkout -b feat/xx-whatever
# ... edit platform/, .claude/, .agents/ freely ...
npm run framework:apply          # ONLY if you touched a materialized file
# bump platform/framework.json's "version"
npm run framework:lock           # re-pin hashes; before publish, not after
# PR -> squash-merge to main, then:
npm run framework:publish -- --tag vX.Y.Z
```

- Re-pin the hashes after any framework change: `npm run framework:lock`. **Refuses in a portal** —
  re-pinning there would bless whatever is on disk, including the local edit Gate B exists to catch.
- Publish to the framework repo: `npm run framework:publish -- --tag vX.Y.Z` (`-- --dry-run` to
  preview). Refuses unless `subtree.remote` is set.

  **`--tag` is required, and must match `platform/framework.json`'s `version`.** An untagged push is
  a release no portal can pin to; a tag disagreeing with the manifest would make every portal on
  that release misreport its version, since the manifest is what travels and what
  `framework:verify` reads back.

  It creates **one tag per prefix** — `vX.Y.Z-main`, `vX.Y.Z-claude-policy`,
  `vX.Y.Z-agents-policy` — each on that prefix's split head. A release is three histories with no
  commit in common, so there is no single commit a release-wide tag could point at; tagging this
  repo's HEAD instead would push the entire template history into the delivery repo and produce a
  tag no portal could pull.

  Re-runnable: a publish that dies midway (it walks three histories over the network, so it does)
  can just be run again. A tag already on the same content is skipped; a tag pointing at
  *different* content is refused rather than moved.

  Expect minutes on a first run — `git subtree split` walks the full history per prefix. Later runs
  hit the subtree cache.
- Redeploy the `materialized` files from their canonical copies in `platform/materialized/`:
  `npm run framework:apply` (`-- --check` to detect drift; `-- --adopt` only to bootstrap a repo
  whose canonical copies don't exist yet)
