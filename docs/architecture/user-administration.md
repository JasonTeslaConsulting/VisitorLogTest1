# User administration: services without a page

The framework ships the **service layer** for user/role/screen administration and deliberately
ships **no page**. If your portal needs an admin screen, you build the UI; the CRUD is already
here and receives framework fixes.

## Why no page

There used to be `src/pages/admin/UserManagement.tsx` and an `/admin/users` route with a
`ROLES.USER_ADMIN` guard. The page was a five-line stub (`<div>UserManagement</div>`) that never
grew a UI, and it was deleted on 2026-08-14 along with its route module.

The reason is the framework/app boundary (`platform/framework.json`): a permission UI is exactly
the kind of thing every portal needs *differently*. One portal grants roles per screen, another
per department, another delegates to Entra groups entirely. A framework page would have had to
guess, and every portal would then have forked it — which is the drift the boundary exists to
prevent. Services are safe to share because they mirror the database, and the database schema
genuinely is shared.

## What already exists — reuse, don't recreate

All three operate on the `_arch` / `_secure` schemas and are framework-owned:

| Service | Functions |
| --- | --- |
| `platform/src/services/users.ts` | `getUsers`, `getRoles`, `addUser`, `updateApplicationUser`, `addRoleToUser`, `updateRoleAssignment`, `removeRoleFromUser` |
| `platform/src/services/roles.ts` | `getRoles`, `insertRole`, `updateRole`, `deleteRole`, `upsertRoleScreen`, `deleteRoleScreen` |
| `platform/src/services/screens.ts` | `getScreens` |

Supporting types are in `platform/src/types/roles.ts` (`Role`, `RoleScreen`, `Screen`, `PermissionDraft`,
`RoleDateDraft`) and `platform/src/types/users.ts`. The permission vocabulary — "No Access" / "Read Only" /
"Read, Write & Delete" — is `PERMISSION_OPTIONS` in `platform/src/lib/constants/permissions.ts`, which is
framework-owned because it describes the `_arch` role-screen model rather than any one portal's
policy.

**These services currently have no consumers.** That is intentional, and it is the one place the
framework knowingly carries unused code: it tree-shakes out of a build that doesn't import it, so
a portal that never builds an admin screen pays nothing.

## Building the page

Normal route + page work — nothing special:

1. `.claude/skills/build-datatable/SKILL.md` for the user list, `build-form-page` for add/edit.
2. `.claude/skills/add-new-route/SKILL.md` for the route module and its `requiredRole` guard.
3. Wrap the services in hooks under `src/hooks/<domain>/` — pages never call a service directly
   (`.claude/rules/architecture-rules.md`).

## Roles are per portal

`ROLES` in `src/lib/constants/roles.ts` is **app-owned and starts empty**. Role names are rows in
your database, so the framework cannot know them. Generation must ask which roles a portal has
rather than inherit an example — the previous `USER_ADMIN` entry existed only to guard the deleted
admin route.

`requiredRole` on `AppRoute` is typed `string | string[]`, so it accepts a `ROLES` member or a bare
string; using the constant is what keeps a typo from silently disabling a guard.

## Known gap

Nothing in this repo creates the `_arch` / `_secure` / `_common` schemas these services query, so a
brand-new Supabase project cannot run this skeleton — a portal must point at a project that already
has them. The table shapes are readable from `src/integrations/supabase/types.ts`. Recorded in
`platform/framework.json`'s `knownGaps`.
