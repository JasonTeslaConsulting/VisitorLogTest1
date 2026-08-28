# Pre-flight checklist — before starting a new app build

`.claude/skills/plan-app/SKILL.md` and `.claude/skills/build-app/SKILL.md` don't do any of this for
you, by design: no auto-applied DB migrations, no auto-provisioned auth, no auto-merge. This is the
human-side setup that leaves — work through it before the first "build the app" session, not
during it.

This assumes the portal repo already exists and `npm run app:init` has run. If it hasn't, start
at `docs/COMMANDS.md` § "Starting a new portal" and come back here.

## Git hosting & delivery

- [ ] Push this repo to a remote (GitHub, Gitea, or both) — `git remote -v` is empty until you do.
- [ ] Install and authenticate `gh` and/or `tea` on whichever machine(s) will run
      `.claude/skills/build-app/SKILL.md` — without one, the build loop stops at pushed branches
      and never opens a PR (see that skill's "PUSH AND PR" section).
- [ ] Turn on branch protection for `main` per `CONTRIBUTING.md`'s documented steps (1 approval,
      required status check, no force-push, no deletion) — the gate design assumes `main` can't be
      pushed to directly.
- [ ] Confirm GitHub Actions / Gitea Actions is actually enabled on the host — the workflow files
      already exist in this repo, but some orgs disable Actions by default.
- [ ] Enable "delete branch on merge" — keeps merged `unit/<NNN>-<slug>` refs from lingering as
      false-positive "still claimed" signals.

## Database & auth

- [ ] Decide live vs. mock per domain before or during `plan-app`'s Round 2. The skeleton only
      *reads* an existing Supabase schema or falls back to fixtures — it never designs and applies
      schema on its own.
  - **Live:** create the Supabase project and tables for that domain before its foundation unit
    runs `gen-supabase-types` against it.
  - **Mock:** nothing needed yet, but the debt comes due at the "go-live" unit `plan-app` appends
    per mock domain.
- [ ] Replace the `--project-id` placeholder (`[SUPABASE-PROJECT-ID]`) in `package.json`'s
      `gen-supabase-types` script with your own project's ref. `package.json` is seeded, so this
      is yours to edit.
- [ ] Run `supabase login` (or otherwise authenticate the Supabase CLI) on the machine that will
      run `gen-supabase-types`.
- [ ] Fill in `supabaseUrl`/`supabasePublishableKey` in `public/config/app.json` — and nowhere
      else. `app:init` blanks them unless you passed `--supabase-url`/`--supabase-key`, so the
      app will not boot until this is done. Only the publishable (anon) key belongs here: the
      file is served over HTTP from `public/`. See `docs/COMMANDS.md` § "Supabase credentials".
- [ ] Set up the actual auth provider for whichever `authMode` you choose in `plan-app`'s Round 1 —
      Entra ID needs an Azure app registration (client ID, tenant, redirect URI); OTP/password need
      that method enabled in the Supabase dashboard. None of this happens inside a Claude session.

## Local tooling

- [ ] Node ≥24 and npm on whatever machine runs the loop — `build-app`'s VERIFY step runs
      typecheck/lint/build locally, not just in CI.
- [ ] `npm install`.
- [ ] Git identity (`user.name`/`user.email`) and push credentials to origin configured on that
      machine.

## Team alignment

- [ ] Agree who runs `plan-app` — it's a single interview producing one `docs/plan/app.md`; better
      one person drives it than two people's answers merge awkwardly.
- [ ] Agree on initials for `<type>/<initials>-<slug>` branches before more than one person starts
      (unit branches don't need this — they're id-only by design, see `CONTRIBUTING.md`).
- [ ] Agree the gate policy up front if you already know it — `plan-app`'s Round 6 asks per-app,
      but it's worth the team deciding together rather than defaulting to whoever answers that
      prompt.
