# Theming and runtime config

**Theming** — `ThemeProvider`/`useTheme()` (light/dark/system, persisted to `localStorage`),
`DarkModeToggle` cycles through all three.

**i18n — none.** `LanguageProvider`/`useLanguage()`/`LanguageSelector` were removed on
2026-08-14 (see `docs/DECISIONS.md`). They held a hardcoded placeholder dictionary that
`t()` was never called against, and the selector was never wired into `Navbar` — so the layer
was a framework/app seam with no consumers, which is the worst kind to carry across every
portal. If a portal needs translation, it gets designed then, alongside the planned login work.

**Runtime config** — `appConfig` (`platform/src/app/appConfig.ts`) fetches `public/config/app.json` before
React mounts (see `src/main.tsx`) and deep-merges it into a config object read via
`appConfig.config`. `app.app.authMode` (`"entra" | "otp" | "password"`) switches which login UI
renders. Never hardcode Supabase credentials — they come from this file only, per deployment.
