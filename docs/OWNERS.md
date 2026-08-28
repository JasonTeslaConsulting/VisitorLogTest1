# Ownership

Ownership means: you are the default reviewer, and the person to ask before changing the shape of
this area. It does **not** mean exclusive write access — anyone may change anything; the owner
should see the PR.

Ownership is by folder, matching the skeleton's structure (see `CLAUDE.md`). Add a row when you
create a new `src/pages/<Feature>/` area. `<unassigned>` means: add a name once a second developer
joins — don't invent one now.

| Area | Path(s) | Owner | Backup |
| --- | --- | --- | --- |
| Framework boundary (Gate B — see below) | `platform/**` | @jason | `<unassigned>` |
| Shared UI library | `platform/src/components/ui/**` | @jason | `<unassigned>` |
| Design tokens | `src/theme.css`, `platform/src/styles/framework.css`, `DESIGN.md`, `docs/brand.md`, `tailwind.md` | @jason | `<unassigned>` |
| Auth & RBAC | `platform/src/contexts/AuthContext.tsx`, `platform/src/services/auth.ts`, `platform/src/routes/ProtectedRoute.tsx` | @jason | `<unassigned>` |
| Routing | `src/routes/**`, `platform/src/routes/**` | @jason | `<unassigned>` |
| Runtime config | `platform/src/app/appConfig.ts`, `public/config/**` | @jason | `<unassigned>` |
| Supabase types & services | `platform/src/services/**`, `platform/src/integrations/**`, `src/integrations/supabase/types.ts` | @jason | `<unassigned>` |
| Agent policy | `.claude/**`, `CLAUDE.md`, `ARCHITECTURE.md`, `docs/architecture/**` | @jason | `<unassigned>` |
| Build & CI | `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `platform/config/eslint.base.js`, `.gitea/**`, `.github/**`, `docker/**` | @jason | `<unassigned>` |
| Feature: Home | `src/pages/Home.tsx`, `src/components/Home/**` | @jason | `<unassigned>` |

## Convention

- A new feature area = one row. Path pattern is the triple:
  `src/pages/<Feature>.tsx` + `src/components/<Feature>/**` + `src/hooks/<domain>/**`.
- Unlisted paths: no owner. Any reviewer is fine.
- **High-friction areas** — shared UI library, design tokens, auth, agent policy — need the
  owner's approval, not just any approval. These are the areas where a wrong change silently
  breaks every other developer's session. See `.gitea/CODEOWNERS` / `.github/CODEOWNERS`, which
  cover only these five (kept short on purpose — see that file's own note on Gitea vs. GitHub
  enforcement differences).
- **Framework boundary is Gate B**, not just another high-friction area: it's the mechanism, not
  only the convention, that keeps a portal able to receive framework updates
  (`platform/framework.json`). `npm run framework:verify` hash-checks `platform/**` (plus the
  handful of `materialized` paths outside it, e.g. `vite.config.ts`) against
  `platform/framework.lock` whenever this repo's role is `"consumer"`, and CI runs that check on
  every PR. `.claude/hooks/guard-framework.mjs` additionally stops an agent editing those paths by
  accident. In this repo (`role: "source"`) none of that fires — editing `platform/**` here is the
  normal way framework work happens; a framework maintainer runs `npm run framework:lock` after a
  change, before tagging a release. See `docs/DECISIONS.md`.
