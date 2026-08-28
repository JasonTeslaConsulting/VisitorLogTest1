# Auth

**Auth** — `AuthContext`/`AuthProvider` (`platform/src/contexts/AuthContext.tsx`), `useAuth()`,
`ProtectedRoute`. Supports three interchangeable login modes (`entra` | `otp` | `password`)
switched via `appConfig.config.app.authMode` — see `platform/src/components/Login/`. Login/logout/OTP/
password calls live directly in `AuthContext`, not in a separate auth service.

`useAuth()` returns `currentUser`, `hasRole`, `hasScreenAccess`,
`login`/`logout`/`loginWithPassword`/`verifyOtp`, `authMode`.

**Current-user resolution** — `resolveCurrentUser()` in `platform/src/services/auth.ts` loads the
`_secure.organizationuser` profile (matched on `primaryemail`), checks the employment date range,
and builds `roles[]` + a `screenAccess` map from every role assigned to the user. It rejects with
`not_found` or `employment_inactive`, and `AuthContext` signs the Supabase session back out on
either.

**The employment window is the only gate of any kind, and it is enforced client-side.** `_secure`
dropped `applicationuser.access{start,end}date` and `applicationuserrole.{start,end}date`, so
time-bounded access and time-bounded role assignments no longer exist — hence no `access_inactive`
reason. `role.isenabled` is gone too, so **a role can no longer be disabled** and there is nothing
left to filter assignments on: every assigned role counts. There is no database function or RPC
validating any of this; `resolveCurrentUser` is the whole enforcement.

**Ids are uuids in both `_secure` and `_arch`.** `CurrentUser.organizationUserId` is a `string`, and
because `_arch.screen.screenid` is a uuid too, `screenAccess` and `hasScreenAccess`/
`useScreenAccess` are keyed by `string`. `platform/src/lib/constants/sampleNav.ts` uses
`sample-*` sentinel ids for the same reason it used to use negative numbers — they cannot collide
with a uuid.

**`applicationuser` is a to-one embed.** `fk_applicationuser_organizationuser` is unique, so the
nested select resolves to a single object, not an array — no "arbitrary first row" to pick. A user
with no `applicationuser` row still signs in successfully, with no roles and no screen access.

**`role.rolecode` is required** (it replaced `roleuniqueid`), so `insertRole` takes it as a
parameter rather than deriving one; likewise `organizationuser.employmentstartdate` is `NOT NULL`,
so `addUser` requires it.

`applicationuser.authuserid` holds the Supabase `auth.uid()` but is **not** currently used as the
lookup key — the profile is still found by email.

**Audit columns are written by the database, not the client.** `createdby`/`modifiedby` default to
`public.current_orguser()` and the dates to `now()`, so the services omit all four rather than
sending a browser-supplied value. Note a column DEFAULT does not fire on `UPDATE`: keeping
`modifiedby`/`modifieddate` current on an update needs a `BEFORE UPDATE` trigger DB-side.

`useScreenAccess(screenId)` — `canRead`/`canWrite`/`canDelete` shorthand over `hasScreenAccess`.

**Why `AuthContext` is Supabase-coupled, deliberately.** A provider abstraction (`IAuthProvider`)
was considered and rejected: what varies between IDPs is the set of ceremonies (Supabase OTP is
send-then-verify; Entra is a `void` redirect; a self-hosted OAuth is PKCE + callback + code
exchange), not an implementation behind a fixed contract — any interface would have to change with
every provider, which is the wrong seam to abstract. The real boundary is already drawn by usage,
not by a layer: `currentUser`/`hasRole`/`hasScreenAccess` are domain-shaped and IDP-agnostic,
consumed app-wide (`Navbar`, `ProtectedRoute`, `useNavMenu`, `useScreenAccess`); `login`/
`loginWithPassword`/`verifyOtp`/`authMode` are IDP-specific and consumed only by
`platform/src/components/Login/*` — keep it that way, a new page should never call an IDP-specific method
directly. Swapping IDPs means rewriting `AuthContext` internals plus `platform/src/components/Login/*`;
everything else changes zero lines.

## Dev auth bypass

An agent building a page behind `ProtectedRoute` has no real account to log in with, and a fresh
skeleton's Supabase credentials are still placeholders — every guarded route bounces to `/` with no
way to see the page itself. `VITE_DEV_AUTH=true` in a gitignored `.env.local` injects a synthetic
`currentUser` in `AuthContext`, satisfying `isAuthenticated`, `hasRole` and `hasScreenAccess` in one
place — the same seam described above, not a new one. `VITE_DEV_AUTH_ROLES=admin,approver`
(comma-separated) additionally sets `roles[]`, for verifying a `requiredRole` route.

**Why this can't reach production:** the check is `import.meta.env.DEV && ...`, and Vite replaces
`import.meta.env.DEV` with the literal `false` in a production build, so the whole branch —
condition, synthetic user object, toast — is dead-code-eliminated from `npm run build` output. This
is a build-time elimination, not a runtime toggle between two live paths (the pattern
`.claude/rules/service-rules.md` bans for mock data), and CI asserts the elimination actually
happens by grepping `dist/` for the synthetic user's sentinel email after every build. The opt-in
itself lives in `.env.local`, already excluded by this repo's `*.local` gitignore rule, so it also
cannot be committed by accident.

**What it does not give you:** a database. Supabase is still unconfigured, so the nav menu stays
empty and any table or form shows its error/empty state — this verifies layout, tokens, responsive
behaviour and routing, not data. It also can't verify the login flow or `ProtectedRoute`'s redirect
itself; unset the flag for that.
