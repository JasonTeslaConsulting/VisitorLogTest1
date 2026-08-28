---
paths:
  - src/index.css
  - src/theme.css
  - platform/src/styles/framework.css
---

# Rules: the design-system stylesheets

## Which file am I editing?

The single stylesheet was split three ways on 2026-08-14 by the framework/app boundary
(`platform/framework.json`). Every rule below still applies — it just matters *which* file it
applies to now:

| File | Owner | Holds |
| --- | --- | --- |
| `src/theme.css` | **app** | Every token *value*: `:root`, `.dark`, the tonal ramps. **This is where token edits go.** |
| `platform/src/styles/framework.css` | **framework** | Structure only: `@import "tailwindcss"`, `@custom-variant dark`, the `@theme inline` mapping, the base layer. Read-only in a portal — change it upstream. |
| `src/index.css` | **app** | A shim: font URLs, then the two imports above. Nothing else belongs here. |

The rule of thumb: **a value goes in `theme.css`, a mapping goes in `framework.css`.** Adding a
brand-new token therefore touches both — the value in the app's file, the `@theme inline` entry in
the framework's — and that pairing is what `npm run docs:check` verifies.

Load order is load-bearing and documented in `src/index.css`'s own header: font `@import url()`
first because CSS demands it, `framework.css` before `theme.css` because it carries
`@import "tailwindcss"` and a `@layer base` block appearing before Tailwind declares its layer
order would silently change the cascade.

## Rules

- All color values must be HSL format without the hsl() wrapper: `215 20% 35%`
- Never add raw hex values or rgb() values
- Exception: `--input` holds a complete CSS color value (`transparent` in `:root`, `hsl(...)` in
  `.dark`) instead of a bare triplet, because it's literally transparent in light mode — see
  `tailwind.md` §1 for why and how the `@theme inline` block passes it through unwrapped. Don't use
  this as precedent for other tokens without the same genuine need.
- --ring must always mirror --primary unless DESIGN.md explicitly specifies otherwise
- Radius is expressed as a scale — --radius-sm / --radius-md / --radius-lg (DESIGN.md §5) — never hardcode radius values elsewhere; if DESIGN.md only gives one radius value, apply it to --radius-md and derive sm/lg proportionally
- **Every semantic role in DESIGN.md §2.3–§2.5 must be reachable from component code as a Tailwind utility** — either mapped onto an existing shadcn token (a row in `tailwind.md` §1) or promoted to a new token added here, in `.dark`, and in `@theme inline`. A role that is documented but has neither is a bug (it happened twice: `--color-highlight` and `--color-primary-hover`) — `npm run docs:check` flags this automatically. This rule is scoped to the §2.3–§2.5 role tables only — it does not apply to the §2.2 tonal ramps, which stay reference-only per the exception below
- New tokens must be added when DESIGN.md defines a role that has no existing equivalent (e.g. --success/--warning/--info/--highlight/--border-dark/--disabled-text/--warning-text/--success-text) — check `tailwind.md` first for the role → existing-token mapping before assuming a new token is needed; most DESIGN.md roles map onto tokens that already exist
- A token that differs between light and dark mode (per DESIGN.md's dark-mode table) must be added to both :root and .dark
- A token that is mode-invariant (radius scale, type scale, font families, --elevation-3) only needs :root — .dark inherits it automatically since both selectors target the same root element. Spacing is the one exception worth naming explicitly: `--space-1`…`--space-16` are inert (never mapped into `@theme inline`, never referenced), but `--spacing` itself is a real, live override of Tailwind's own base unit — see `tailwind.md` §2
- The full `--primary-50`…`--primary-950` / `--neutral-50`…`--neutral-950` tonal ramps (DESIGN.md §2.2) are reference/derivation-only — mode-invariant, `:root` only, never added to the `@theme inline` block, and never referenced directly from component code (no `bg-[hsl(var(--primary-300))]`, no inline `style`). Only semantic tokens (`--primary`, `--accent`, etc.) are used in components
  - Narrow exception: `platform/src/samples/Primitives.tsx` (a dev/QA reference page, not product UI) may render the raw ramp steps as designer-reference swatches via `style={{ backgroundColor: 'hsl(var(--primary-50))' }}` etc. — this is the one sanctioned use of inline `style` for a CSS-var color reference in the whole codebase. It stays live (auto-updates if the seed color changes) and must never be copied into any other component
  - **Promotion procedure:** if `DESIGN.md` ever assigns one of these ramp steps to an actual role instead of just documenting the scale (e.g. a new "icon-hover" color = primary-300), that role gets promoted to a real semantic token — add `--icon-hover: <that ramp step's value>` here, add a matching entry to the `@theme inline` block, then use the new token's utility class (`hover:text-icon-hover`) in the component that needs it. Never reach into the raw ramp from a component just because DESIGN.md happened to mention a step number
- Dark mode overrides live in the .dark {} block only — never in media queries
- Font imports go at the very top of `src/index.css`, before its two `@import`s — CSS requires
  `@import url()` to precede every other statement, and the font *families* they load are brand
  choices, which is why they sit in the app-owned shim rather than the framework's stylesheet
- The `@theme inline { ... }` block lives in the **framework-owned** `platform/src/styles/framework.css`,
  not next to the tokens it maps. Adding a token means editing two files: the value in
  `src/theme.css`, the mapping here. It is where the
  Tailwind-utility mapping lives — it replaces the old "add it to `tailwind.config.ts`" instructions
  from the v3 era. It must mirror the `:root`/`.dark` token list 1:1 (wrapping bare HSL triplets in
  `hsl(var(--x))`, passing `--input` through raw) — never invent a new token directly inside
  `@theme inline` that doesn't already exist in `:root`/`.dark`
- `--container-max` is the app's max content width (DESIGN.md §7), mode-invariant and `:root` only.
  It is **not** in `@theme inline` and doesn't need to be — Tailwind v4's `max-w-(--container-max)`
  shorthand compiles to `max-width: var(--container-max)` and reads any CSS variable directly. It
  has exactly one consumer, `PageLayout`'s inner wrapper; templates and pages never set a page
  width, so changing this one value rewidths the whole app
- The other exception to "tokens only", and it lives in the framework's
  `platform/src/styles/framework.css`: the `[data-sonner-toaster] { ... }` block, which *would*
  re-point sonner's own richColors CSS variables (`--success-bg`, `--error-text`, etc. — a
  third-party stylesheet contract, not a project token) at this repo's
  `--success`/`--warning`/`--info`/`--destructive` tokens using `!important` (sonner's own default
  rule is both more specific and injected later at runtime) — but is currently **commented out**
  (references a nonexistent `--success-light` token), so toast colors today are sonner's own
  defaults, not project tokens. See `tailwind.md` §7. No other `@layer`, `@apply`, or utility
  classes belong in any of the three files — `theme.css` is values only, `index.css` is imports
  only, and `framework.css`'s base layer is already written
- After any edit, verify every mode-dependent token in :root has a corresponding override in .dark
