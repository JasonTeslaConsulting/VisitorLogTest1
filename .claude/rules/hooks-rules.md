---
paths:
  - src/hooks/**
  - platform/src/hooks/**
---

# Rules: hooks (`src/hooks/` app-owned, `platform/src/hooks/` framework-owned)

Files in either directory must follow these rules without exception. The framework's own hooks
(`useNavMenu`, `useFilterDraft`, `useScreenAccess`, `useTableState`) live at
`platform/src/hooks/`; an app's hooks live at `src/hooks/<domain>/`.

- Hooks are the only files allowed to import from `@tanstack/react-query`
- Each hook wraps exactly one service function or one logical unit of data
- Hook files named camelCase: `useNavMenu.ts`, `useUsers.ts`
- Named exports only — no `export default`
- Always set a meaningful `staleTime` — never leave it at 0 unless data must always be fresh
- `queryKey` arrays must be specific enough to avoid cache collisions:
  - Include entity name: `["users"]`
  - Include filters if query varies: `["users", organizationId]`
  - Include id for single-item queries: `["user", userId]`
- Mutation hooks (`useMutation`) live in a separate file: `use<Entity>Mutations.ts`
- Hooks must not contain UI logic, JSX, or direct supabase calls
- If `npx shadcn add` ever emits a hook it lands in `platform/src/hooks/shadcn/`
  (`components.json`'s `aliases.hooks`) — framework-owned, do not modify. That directory does not
  exist today; no shadcn component this repo uses ships a hook
- For API calls with React Query useQuery, staleTime must use the `STALE_TIMES` constant
  (`@framework/lib/constants/app`, framework-owned) — never hardcode ms values. Pick the tier
  (STATIC/STANDARD/FREQUENT/REALTIME) per `.claude/skills/call-api/SKILL.md`
