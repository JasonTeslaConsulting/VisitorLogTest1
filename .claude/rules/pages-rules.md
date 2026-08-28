---
paths:
  - src/pages/**
---

# Rules: src/pages/

Files in this directory must follow these rules without exception.

- Allowed to create folders to group pages by related functions or module.
- One file per route — filename matches the route concept (ManageUsers.tsx, not Users.tsx)
- Named exports only — no `export default`
- Pages are composition only — no business logic, no data transformation
- No direct supabase calls — use hooks
- No direct `useQuery` or `useMutation` imports — use custom hooks from src/hooks/
- No layout components imported or rendered — route chrome is applied at the router level
- Page structure comes from a template in `platform/src/templates/` — import the shell named by the unit's
  `template:` field (or picked from `platform/src/templates/registry.ts`) rather than hand-rolling header
  placement or card wrapping. Never set page-edge padding or a max content width at the page level
  either — both are `PageLayout`'s job (DESIGN.md §7); the app's width lives in one place,
  `--container-max` in `index.css`. See `docs/architecture/templates.md`
- filtering and search logic via `useMemo` is acceptable in pages
- State allowed in pages: UI state (modals open/closed, selected row), table state via useTableState
- State not allowed in pages: server data, auth state — these come from hooks and context
- A page header's one-line subtitle is optional and usually omitted — add one only when the title
  alone doesn't convey what the screen is for (DESIGN.md §8). When you do, describe what the user
  can *do*, not just what the page *is* ("Manage your team's access and permissions", not "Team
  settings overview"). Never restate the title.
- A link is a `Button` rendered as a router `Link`, never a bare `<a>` tag — see
  `components-rules.md`'s Button usage section.
