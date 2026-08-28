# Tailwind Implementation — Design System Bridge

> Framework-specific companion to `DESIGN.md`. That file defines platform-agnostic roles/tokens;
> this file maps them onto this repo's actual Tailwind + shadcn/ui setup.
>
> **Decision (this repo):** the new design system's M3 role names (`--color-primary`,
> `--color-surface`, etc.) are **not** introduced as new CSS variables. Instead they're mapped
> onto the **existing shadcn token names** already wired through every shadcn/ui primitive and
> the framework CSS's `@theme inline` block (`--primary`, `--card`, `--background`, etc.). This keeps
> every existing component working with zero renames — only the *values* behind those tokens
> change.

---

## 1. Color role → existing token mapping

All values are HSL bare triplets in **`src/theme.css`** (no `hsl()` wrapper, no hex — per
`.claude/rules/index-css-rules.md`). Tailwind consumes them via the `@theme inline` block in
**`platform/src/styles/framework.css`**, which wraps each one as `--color-x: hsl(var(--x));` so utilities
like `bg-primary` resolve.

> **Two files, one pair.** Values are app-owned (`theme.css`), the mapping is framework-owned
> (`styles/framework.css`) — that split is what lets a portal be rebranded without touching a
> framework file. Wherever this document says "the token", the value is in `theme.css`; wherever it
> says `@theme inline`, that is `framework.css`. See `platform/framework.json`.

| DESIGN.md role | Repo token (`theme.css` `:root`/`.dark` + `@theme inline`) | Notes |
|---|---|---|
| `--color-primary` | `--primary`, `--ring` | Ring mirrors primary per `index-css-rules.md` |
| `--color-primary-hover` | `--primary-hover` | Promoted to its own token (equals the `primary-600` ramp step in light mode, darker than `--primary`; lighter than `--primary` in dark mode) — see `index-css-rules.md`'s promotion procedure. Consumed by `button.tsx`'s primary variant hover |
| `--color-on-primary` | `--primary-foreground` | |
| `--color-primary-container` | `--accent` | Pale primary-tint container |
| `--color-on-primary-container` | `--accent-foreground` | |
| `--color-secondary` | `--secondary` | Black in light mode, near-white in dark — per DESIGN.md §2.4 |
| `--color-on-secondary` | `--secondary-foreground` | |
| `--color-app-background` | `--background` | Page canvas — gray-blue, not white |
| `--color-surface` | `--card`, `--popover` | Cards/popovers sit one step lighter/whiter than the page |
| `--color-on-surface` | `--foreground`, `--card-foreground`, `--popover-foreground` | |
| `--color-surface-variant` | `--muted`, `--input-background` | Subdued backgrounds (sidebars, table headers) and filled input fields |
| `--color-on-surface-variant` | `--muted-foreground` | |
| `--color-border-dark` | `--border-dark` | Real token, added for Input/Textarea/Select/InputGroup's resting-state border — see the note below the Input exception, which supersedes the old "not used for inputs" pattern |
| `--color-card-border` | `--border` | All hairline borders/dividers, including functional dividers (nav divider, table lines, side-sheet edge, form footer divider) — previously split into a separate `--line` token, merged back since the two never diverged (DESIGN.md §2.3) |
| `--color-highlight` | `--highlight` | New token, no existing shadcn equivalent — see Additive tokens below. Also used for table row hover/selection (DESIGN.md §2.3). Dark value is extrapolated (DESIGN.md §2.3 ⚠) |
| `--color-error` | `--destructive` | |
| `--color-on-error` | `--destructive-foreground` | |
| `--color-info` | `--info` | Doubles as Link Blue — anchor links in prose (DESIGN.md §2.5) |

**Correction (validated against the actual reference CSS, not DESIGN.md's prose):** `--input` is
**not** the outline/border color. The reference sets it to literally `transparent` in light mode
and the muted/surface-variant color in dark mode, with a separate `--input-background` token
(muted color) for the field's fill — inputs are a *filled* pattern, not an *outlined* one.
`--secondary-foreground` in dark mode is the dark `--background` navy (`221 39% 11%`), not black —
DESIGN.md's "flips from black to near-white, inverted literal color" (§2.4) turned out to mean the
background hue, not a flat black/white swap.

**Format exception:** `--input` breaks the bare-HSL-triplet convention. Because it's literally
`transparent` in light mode (not expressible as an HSL triplet), the `@theme inline` block
passes it through raw (`--color-input: var(--input);`, `--color-input-background: hsl(var(--input-background));`)
instead of the usual `hsl(var(--x))` wrapper — so `--input` itself must hold a complete CSS color
value in both `:root` (`transparent`) and `.dark` (`hsl(222 28% 20%)`, parens included), unlike
every other token. `--input-background` is a normal bare-triplet token, wrapped as usual.

**Fixed:** shadcn's `Input`/`Textarea`/`Select` primitives generate with `bg-background` for their
fill, not `bg-input-background`. With `--input: transparent` also removing the border, every
input/textarea/select rendered as a box the *exact* same color as whatever was behind it, reported
as "light splashes that blend into the background... changing every token doesn't match it" (a
correct symptom, since the fill literally *was* `--background`). Fixed by editing
`bg-input-background` directly into `platform/src/components/ui/input.tsx`, `textarea.tsx`, and
`select.tsx`'s `SelectTrigger` — these files are the shared component library now (see
`.claude/rules/components-rules.md`), not read-only shadcn output, so the fix lives in the
primitive itself rather than a wrapper.

**Same bug, different components:** `checkbox.tsx`, `radio-group.tsx`, and `switch.tsx` also
reused `border-input`/`bg-input`-style classes for their *unchecked* outline — these controls have
no separate fill token to compensate the way Input/Textarea/Select do, so with `--input:
transparent` they rendered with a genuinely invisible border/track. Fixed by pointing the outline
at `border-border` instead (a token that's never transparent in either mode), and by giving the
*disabled* state its own explicit neutral-ramp treatment (`--control-disabled`/
`--control-disabled-icon`/`--control-disabled-knob`, per DESIGN.md's Selection Controls section)
instead of an `opacity-50` dim. See `plan-design/SKILL.md` Step 7 for the full checklist — worth
re-checking any time a new `DESIGN.md` sets `--input` to transparent or a near-surface color, since
a future shadcn-regenerated component could reintroduce the same pattern.

**Superseded for Input/Textarea/Select/InputGroup specifically:** the filled/borderless pattern
above solved the light-splashes bug but left these four primitives with no visible resting-state
border at all in either mode (`--input` is `transparent` in light, and equals `--input-background`
exactly in dark). DESIGN.md's Forms section now defines a real resting border, and a `--color-error`
focus ring hard-mirrored to `--color-primary` (via `--ring`, per `index-css-rules.md`) turned out to
read as an error state with nothing else on the field to contrast against. Fixed by adding a real
`--border-dark` token (see the mapping row above) and pointing these four files' border at `border-border-dark`
/ `bg-card` at rest, with a genuine CSS `outline-secondary` (not a `ring-*` box-shadow) on focus,
instead of the shared `--ring`. `--input`/`--input-background` are unchanged and still accurate for
any other consumer — don't reintroduce `border-input` on these four components thinking it's still
the documented pattern.

**Related but distinct bug — arbitrary color-function classes referencing bare tokens:**
`button.tsx`'s `secondary` variant hover shipped as
`hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`. Since `--secondary` is a
bare HSL triplet (no `hsl()` wrapper), that's not a valid `<color>` argument to `color-mix()` — the
whole `background-color` computed to its CSS initial value (`transparent`), which read as "the
button turns white/blank on hover," not the subtle darken DESIGN.md §6 actually specifies
(`hsl(0, 0%, 20%)`). Different failure mode than the `--input` case (CSS-invalid-value fallback vs.
semantic mismatch), same root cause (registry code assuming complete color values). Fixed by adding
a dedicated `--secondary-hover` token and using it directly instead of a color-mix formula. See
`plan-design/SKILL.md` Step 7 for the general check (any arbitrary-value color-function class is
worth grepping the built CSS for after a regen).

**Note:** every primitive in `platform/src/components/ui/` now runs on `@base-ui/react`, not Radix — see
`docs/architecture/ui.md` for the migration's lasting effects. `components.json`'s `style` field
is now `"base-vega"` (flipped from the legacy `"default"`
style during the shadcn v4 regen), so `npx shadcn@latest add <component> --overwrite` for a
genuinely new or existing component generates real Base UI code directly — no hand-migration from
Radix needed anymore. It *will* reset any hand-authored DESIGN.md/bug-fix customizations on that
file back to pristine, though (see `docs/architecture/ui.md`'s Baseline note for the current list
to reapply).

**Additive tokens** (genuinely new — no existing equivalent, added to both `:root` and `.dark`):
`--success` / `--success-foreground` / `--success-text`, `--warning` / `--warning-foreground` /
`--warning-text`, `--info` / `--info-foreground`, `--disabled-text`, `--primary-hover` (promoted
from the primary ramp, DESIGN.md §2.3), and `--highlight` (DESIGN.md §2.3, no `-foreground`
partner — text on it uses `--foreground`). These need a matching `--color-success` /
`--color-success-foreground` (etc.) entry in the `@theme inline` block — matching the existing
`--color-primary` / `--color-secondary` / `--color-destructive` pattern — so `bg-success`,
`text-warning`, `hover:bg-primary-hover`, `bg-highlight`, `text-disabled-text`, etc. work.

**Reference-only tokens (deliberately not mapped):** `theme.css` also defines the full
`--primary-50`…`--primary-950` / `--neutral-50`…`--neutral-950` tonal ramps from DESIGN.md §2.2.
These are **intentionally absent** from this mapping table and from the `@theme inline` block — no
`bg-primary-300` class exists. They exist purely so a future semantic token can be derived from a
specific ramp step (e.g. a new `--icon-hover` role) without re-deriving hex→HSL by hand each time.
See `index-css-rules.md` and `components-rules.md` for the "never reference these directly from
components" rule.

## 2. Spacing

DESIGN.md's `--space-*` scale (4px base unit) maps directly onto Tailwind's default spacing
scale, which is already 4px-based (`space-1` = 4px = Tailwind's `1`, `space-2` = 8px = Tailwind's
`2`, etc.) — **no config change needed**. Use Tailwind's built-in `gap-*`/`p-*`/`m-*` utilities
directly; `--space-*` in DESIGN.md is documentation of *which* steps are meaningful (1, 2, 3, 4,
6, 8, 12, 16), not a new token set to wire up. **`theme.css`'s own `--space-1`…`--space-16`
declarations (`:root`) are correspondingly inert** — never mapped into `@theme inline`, never
referenced by any component. Don't "fix" spacing by editing them; see the rebrand lever below for
what actually moves.

**The real spacing lever is `--spacing` itself.** `theme.css` declares `--spacing: 0.25rem`
inside `@layer base { :root }`, which sits *after* Tailwind's own `@layer theme` in the compiled
output — so this one override wins the cascade over Tailwind's built-in base unit. Every utility
Tailwind expresses as `calc(var(--spacing) * N)` — `p-*`, `gap-*`, `m-*`, `size-*`, and, less
obviously, every fixed control height (`h-10` **is** `calc(var(--spacing) * 10)`, not a literal
40px) — rescales from that single line. Verified against the compiled CSS: 260 utilities read
`var(--spacing)`. This is a genuine one-file "make it more spacious" lever, with one caveat: it
scales icons and badges by the same ratio, so the result is uniformly roomier, not roomier
*relative to type* (type doesn't use this scale at all — see §5).

**Page width** is the one sizing value that *does* need a token. DESIGN.md §7's max content width
maps to `--container-max` in `theme.css`'s `:root`:

```css
/* theme.css :root — mode-invariant, :root only */
--container-max: 80rem; /* 1280px — DESIGN.md §7 */
```

Consumed as `max-w-(--container-max)` — Tailwind v4's CSS-var shorthand compiles straight to
`max-width: var(--container-max)`, so this token is deliberately **not** in `@theme inline` and
needs no entry there. Its only consumer is `PageLayout`'s inner wrapper; templates and pages never
set a page width of their own, so changing this single value rewidths every page.

Do not reintroduce Tailwind's `container` class for this. Its built-in per-breakpoint max-widths
(`xl:1280`, `2xl:1536`) stack with any custom `@utility container` block rather than replacing it,
which produced a three-way interaction between the built-in breakpoints, the custom override and
per-template caps — different ones binding at different viewports. A single token on one element is
the whole mechanism now.

A template may still cap itself *narrower* when that's an arrangement decision — `single-card` at
`width: "narrow"` uses `max-w-2xl` for readability (§3's ~70–75 character line length). Such a width
must never reference `--container-max`; if it should track the app's width, it shouldn't be set at
the template at all.

## 3. Radius

Three independent radius tokens, not a single `--radius` derived via `calc()`:

```css
/* theme.css :root and .dark */
--radius-sm: 0.25rem;  /* 4px  — inputs, chips, buttons */
--radius-md: 0.5rem;   /* 8px  — cards */
--radius-lg: 1rem;     /* 16px — modals, sheets */
```

```css
/* styles/framework.css — @theme inline block, passthrough so rounded-sm/md/lg resolve to the above */
--radius-lg: var(--radius-lg);
--radius-md: var(--radius-md);
--radius-sm: var(--radius-sm);
```

`rounded-full` is unaffected (Tailwind's built-in `9999px`, used as-is for avatars/pills/switches
per DESIGN.md §5).

**Fixed:** `Button`, `Dialog`/`AlertDialog`, `Drawer`, `Badge`, `Checkbox` and `Tooltip`'s arrow
each had a class that ignored one of the three tokens above — most damagingly `Button`'s
`rounded-[min(var(--radius-md),8px|10px)]` clamps on its `xs`/`sm`/`icon-xs`/`icon-sm` sizes, which
hard-capped small buttons at 8/10px while `default`/`lg` rounded freely with `--radius-md`. A
rebrand that widened `--radius-md` would make large buttons rounder while small ones stayed
capped — sizes visibly disagreeing with each other. All six now use `rounded-sm`/`rounded-lg`/
`rounded-full` directly, matching DESIGN.md §6's own "height and radius must never vary between
buttons" rule. `Card` (`rounded-md`) was already correct — the file comment above previously
misdescribed it as `rounded-lg`.

`rounded-none` (Calendar, InputGroup, Tabs, ToggleGroup — corner suppression in segmented/joined
controls) and `rounded-full` (avatars, pills, switches, radio controls, per DESIGN.md §5) are left
as literals on purpose; see the `--radius-full` note in DESIGN.md §5 for why the latter can't be
tokenised at all.

## 4. Elevation / shadows

The `@theme inline` block's `--shadow-*` entries are set so the existing shadcn shadow
classes naturally collapse to the new system without touching primitive component files:

```css
/* styles/framework.css — @theme inline block */
--shadow-2xs: none;
--shadow-xs: none;
--shadow-sm: none;        /* strips card.tsx's default shadow-sm automatically */
--shadow: none;
--shadow-md: var(--elevation-3);   /* dropdowns, popovers, selects, tooltips */
--shadow-lg: var(--elevation-3);   /* dialogs, sheets, command palette */
--shadow-xl: var(--elevation-3);   /* any remaining large-shadow usage */
--shadow-2xl: var(--elevation-3);
```

```css
/* theme.css — single overlay shadow, both :root and .dark */
--elevation-3: 0 8px 24px rgba(0, 0, 0, 0.12);
```

This means every `shadow-sm`/`shadow-xs`/`shadow-2xs` usage in the codebase (Card, Tabs active
state, Calendar, InputGroup) goes flat automatically — no shadow. Every `shadow-md`/`lg`/`xl`
usage (DropdownMenu, Popover, Dialog, AlertDialog, Sheet, ContextMenu, Menubar, HoverCard,
NavigationMenu, Command, Select, Tooltip, Sonner/Toaster) resolves to the one permitted
`--elevation-3` box-shadow — matching DESIGN.md §5/§6's "dropdowns, modals, popovers only" rule.

**Not covered by this remap** (explicit inline shadow classes outside the `shadow-*` scale, or
components that should lose their shadow but aren't part of the scale swap) — stripped directly
in their own files: `components/ui/BackToTop.tsx` (`shadow-lg hover:shadow-xl` on a floating
button — floating action buttons aren't in DESIGN.md's permitted list, replaced with a border for
definition) and `app/layout/MobileSidebar.tsx`'s drawer (`shadow-xl` — already has `border-r` for
separation).

**Fixed:** the `Switch` thumb (`components/ui/switch.tsx`) previously carried a `shadow-lg` class
that DESIGN.md §6 calls out as a violation ("no shadow, flat fill only"). Removed during the
Radix→Base UI migration, since that file was already open for the primitive swap.

## 5. Typography

```css
/* theme.css :root — the actual font stacks */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-heading: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

```css
/* styles/framework.css — @theme inline block, passthrough so font-sans/heading/mono resolve to the above */
--font-sans: var(--font-sans);
--font-heading: var(--font-heading);
--font-mono: var(--font-mono);
```

- `serif` is removed — DESIGN.md has no serif role and the repo's prior `Lora` entry was unused
  outside the token declaration itself.
- `font-sans` (Inter) remains the default body typeface via `body { @apply font-sans }` in
  `index.css`'s font URLs — unchanged mechanism, new font.
- `font-heading` (Poppins) is a **new** Tailwind font utility — apply via `className="font-heading"`
  on headings/subtitles per DESIGN.md §3's type scale. There is no automatic "all `h1`-`h6` use
  Poppins" CSS rule; this repo has no global heading-element styling today, so headings must
  explicitly opt in with `font-heading` (or via a future shared heading component — Phase 2).
- **Reversed:** the `--type-*` scale in DESIGN.md §3 used to be documentation only, expressed
  per-component as arbitrary values (`text-[32px] leading-[40px]`). It is now real tokens —
  `--text-display-lg`, `--text-headline-lg`, `--text-headline-md`, `--text-title-lg`,
  `--text-subtitle`, `--text-body-lg`, `--text-body-md`, `--text-button`, `--text-label-sm` — each
  with a `--text-X--line-height` companion, defined once in `theme.css`'s `:root` (mode-invariant,
  same as the radius scale) and passed through `@theme inline` so `text-title-lg` is a real
  Tailwind utility bundling both size and line-height. Font-weight stays a separate concern, same
  as before — apply `font-bold`/`font-semibold`/etc. alongside the scale class, matching DESIGN.md
  §3's own Weight column. `--type-body-emphasis` has no token: it inherits its size from
  surrounding text by definition, so there's nothing to name.

  Unlike `--radius-xl`/`--container-*` (existing Tailwind theme keys we override), these are
  **wholly new** utility names with no Tailwind default to fall back on — Tailwind's JIT only
  generates a utility for a theme key it can see, so skipping the `@theme inline` passthrough
  would leave `text-title-lg` resolving to nothing. This is the same reason `--space-1…16` (§2
  below) don't work as classes: they were never added to `@theme inline` at all.

## 6. Class-name conventions

- Colors: always the semantic Tailwind class bound to a token (`bg-primary`, `text-muted-foreground`,
  `border-border`) — never `bg-[#E34F1C]` or an arbitrary hex value, per `index-css-rules.md`.
- Radius: `rounded-sm` / `rounded-md` / `rounded-lg` / `rounded-full` only — no arbitrary
  `rounded-[Npx]` outside the two pre-existing exceptions noted in `index-css-rules.md`.
- Shadow: `shadow-md` (or `lg`/`xl`) for the three permitted overlay contexts only (dropdown,
  modal, popover family); no shadow class anywhere else — use `border` instead.
- Spacing: standard Tailwind spacing scale (`gap-4`, `p-6`, etc.) — DESIGN.md's `--space-*` names
  are a reference, not literal class names.

## 7. Toasts (custom-rendered, no `richColors`)

Toasts are ordinary Tailwind-classed components like everything else in this repo, and they get
there through `platform/src/components/ui/toast.tsx`, which wraps sonner's `toast.custom`.

**Why that matters.** sonner normally renders its own card outside the component tree and colours
it from CSS custom properties (`--success-bg`/`--success-border`/`--success-text` and the
`info`/`warning`/`error`/`normal` equivalents) that its bundled stylesheet reads directly — nothing
classNames-driven to hook into. Matching this repo's tokens that way needed all nine variables
overridden with `!important`, because sonner injects its own defaults at runtime, later in the
cascade and on a two-attribute selector. `styles/framework.css` carried exactly that block,
commented out, referencing a `--success-light` token that never existed. It has been deleted.

A custom toast avoids the whole problem. From sonner's own source:

```js
"data-styled": !Boolean(toast.jsx || toast.unstyled || unstyled)
```

Every default card style is scoped to `[data-styled=true]`, so a `toast.custom` toast gets **no**
wrapper styling at all — plain utility classes, no `!important`, no `unstyled: true`, and no double
card. `richColors` and the `icons` map were removed from `sonner.tsx` for the same reason: both only
affect `[data-styled=true]` toasts, so once every toast is custom they were dead config that read
as though it were doing something.

`local/no-direct-toast` blocks importing `sonner` outside `toast.tsx` and `sonner.tsx`, so this
cannot quietly regress one call site at a time. See DESIGN.md §6 for the resulting visual spec.

**Theme wiring, fixed.** `sonner.tsx` used to import `useTheme` from `next-themes`, a dependency
with no provider mounted anywhere in this app (which uses `src/contexts/ThemeContext`) — so the
Toaster always rendered `theme="system"`, ignoring an explicit light/dark choice. Now imports from
`@/contexts/ThemeContext`, whose `theme` value (`"light" | "dark" | "system"`) matches sonner's
`theme` prop exactly. `next-themes` is removed from `package.json` — that import was its only use.

If a client's DESIGN.md calls for sonner's own default `richColors` palette (see
`plan-design/SKILL.md` Step 1), leave that block commented out (or delete it) and leave
`richColors` set — no other change needed.

## 8. Rebrand readiness

How far does editing `theme.css` alone go toward a substantially different feel — "rounder,
bubblier, more spacious" — without touching component code? Verified against the compiled CSS,
not just source, since a `var()` reference and a baked-in literal look identical in a class name:

| Lever | Reach from `theme.css` alone |
|---|---|
| Colour | **100%** — 47 tokens, zero hex/palette-class/inline-style escapes anywhere in `src/` |
| Shadows | **100%** — zero bypasses; every `shadow-*` usage resolves through `--elevation-3` (§4) |
| Density/spacing | **~95%** — the `--spacing` cascade lever above; a short, deliberate list of hardcoded optical nudges and animation offsets is immune (drawer grab handle, tooltip/navigation-menu arrow offsets, sheet slide-in distances) |
| Radius | **100%** for the three tokens (§3, now that the clamps and stray Tailwind-default classes are fixed) — `rounded-full`/`rounded-none` are deliberately-pinned literals, not gaps |
| Typography | **100%** for every token-scale size (§5) — sizes not on the scale (arbitrary one-offs, if any get added later) stay immune by construction |

**The verdict:** colour, density, radius and type are now all one-file levers. What's left after
this pass is a short, named, deliberate list — not an open-ended one:

- `rounded-full` (19 occurrences) and `rounded-none` (7) — pinned by design, see §3 and DESIGN.md
  §5's `--radius-full` note
- Optical nudges and animation offsets that were never meant to track a rebrand: sheet slide-in
  distances, dropdown/navigation-menu arrow positioning, the drawer grab handle's width, dialog's
  viewport-gutter `max-w-[calc(100%-2rem)]` — none of these express a *scale step*, so there's
  nothing for a token to override
- `--container-*` (`max-w-xs`/`md`/`2xl` etc.) — not overridden today; the same `:root`-cascade
  trick that made `--spacing` and `--radius-sm/md/lg` work would apply here too, just unused so far

**How the trick works, for the next lever someone wants to add:** `theme.css`'s `:root` sits in
`@layer base`, which the compiled output places *after* Tailwind's own `@layer theme` — so any
theme variable redeclared there wins the cascade, whether or not it's also mirrored into
`@theme inline`. That passthrough is only required to make a **wholly new** utility name exist at
all (§5's `text-title-lg` has no Tailwind default to fall back on). Overriding an **existing**
Tailwind scale step (`--radius-xl`, `--container-md`, anything Tailwind already ships) needs
nothing beyond a `:root` declaration with that exact name.
