# Home

**Status:** redirects to the visitor log's landing page — not a page of its own.

- Page: `src/pages/Home.tsx`
- Route: `/home` (protected, no role requirement beyond being signed in)

`platform/src/lib/constants/app.ts`'s `AUTH.REDIRECT_PATH` hardcodes `/home` as the post-login
landing route (also used by `Login.tsx`, `Navbar`'s home icon, and `ProtectedRoute`'s
access-denied fallback) and is framework-owned — not configurable via `public/config/app.json` or
any other portal setting. Since this portal's actual landing page is the visitor log's "My
Visits" table (`/visits`, U003), `Home.tsx` immediately renders `<Navigate to="/visits" replace
/>` rather than any content of its own. This is the sanctioned way to change "the landing page"
without editing the framework constant — see `CLAUDE.md`'s framework-boundary section.

If a future portal built from this skeleton wants a real `/home` page (a dashboard, a welcome
screen), replace this redirect with that page's content instead of adding a second redirect
somewhere else.
