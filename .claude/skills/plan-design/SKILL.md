---
name: plan-design
description: >
  Use this skill when setting up or changing the visual design of an app —
  brand colours, fonts, tone, radius, or any visual identity decisions.
  Triggers: "set up the design", "change the colours", "update the theme",
  "the client brand is X", "use orange as the primary colour",
  "update DESIGN.md", "apply the design to the app".
  Runs in two phases: plan (record brand decisions in the app-owned docs/brand.md)
  then execute (write token values into the app-owned src/theme.css; the @theme
  inline mapping lives in the framework-owned platform/src/styles/framework.css, and
  framework-owned DESIGN.md is never edited). DESIGN.md is a fixed,
  platform-agnostic M3-style token/component spec; tailwind.md is the bridge
  that maps its roles onto this repo's existing shadcn token names.
applies_to:
  - design setup
  - branding
  - theming
  - colour changes
  - font changes
  - DESIGN.md
  - docs/brand.md
  - tailwind.md
  - index.css
  - theme.css
---

# Skill: Plan and Apply Design

Two-phase process:

1. **Plan** — if the design system needs to change for this project (new brand seed color, font,
   or radius feel), record the decision and its reason in **`docs/brand.md`**'s Overrides table.
   If the current framework-default system already fits, skip straight to Phase 2.
2. **Apply** — read `DESIGN.md` + `tailwind.md`, write the token values into **`src/theme.css`**'s
   `:root`/`.dark` blocks. The `@theme inline` mapping lives in the framework-owned
   `platform/src/styles/framework.css` and is normally already correct — you only touch it when adding a
   *brand-new* token, which is a framework change (see below).

Do not touch any stylesheet until the `docs/brand.md` decisions are approved.

> ## ⚠ Never edit `DESIGN.md`
>
> `DESIGN.md` is **framework-owned** (`platform/framework.json`) and read-only in a portal repo.
> It describes the *default* design system and the role list every portal shares. A per-portal
> edit there would be reverted by the next `framework:update`, taking the brand with it —
> and in a consumer repo `npm run framework:verify` rejects the edit outright.
>
> A brand change therefore lands in exactly two app-owned files:
>
> | File | What you write |
> | --- | --- |
> | `docs/brand.md` | the decision and **why** — one row per divergence from the default |
> | `src/theme.css` | the values that implement it |
>
> The one case that *does* need a framework change is a **genuinely new role** that `DESIGN.md`
> doesn't have at all (not a new *value* for an existing role). That needs a token in
> `theme.css`, a mapping in `framework.css`, and a role entry in `DESIGN.md` — all three
> upstream, in the framework repo, so every portal gets it. Stop and say so rather than
> improvising a local token; `npm run docs:check` will flag a half-wired role anyway.

**Which file:** `src/theme.css` = values (app-owned, yours to rewrite per portal).
`platform/src/styles/framework.css` = the `@theme inline` mapping + base layer (framework-owned; in a
portal repo it is read-only and `npm run framework:verify` rejects edits — a genuinely new token
has to be added upstream). `src/index.css` = font URLs + two imports, nothing else. Full rules in
`.claude/rules/index-css-rules.md`.

**Format note:** `DESIGN.md` is markdown tables, not YAML frontmatter, and you *read* it rather
than edit it — read the actual section headers (§1–§8) for the role list and component specs, then
write decisions to `docs/brand.md` and values to `src/theme.css`.

---

## Phase 1 — Gather design requirements (only if changing the system)

### Step 0 — Format conformance check (if an external design doc was supplied)

If the user hands you an outside design doc to adopt (rather than describing brand requirements
verbally), first confirm it matches `DESIGN.md`'s canonical section schema before merging any
values from it:

1. Brand Foundations
2. Color System (seed colors, generated tonal ramps, semantic roles, dark-mode conversion,
   functional colors, don'ts)
3. Typography (font families, weight usage, type scale, rules)
4. Icons (source library + usage rules)
5. Radius & Elevation
6. Components — Buttons, Cards, Forms, Selection controls, **Tables**, Container types, Navigation
7. Composition Patterns
8. Voice & Content Rules

If the incoming doc is missing a section this schema requires (most commonly Tables, since it's
easy to omit), ask the user for that section's values rather than inventing one or silently
leaving it a placeholder. If the incoming doc's icon section names a library other than
react-icons/Phosphor, flag it — see Icons under Step 3 below, since changing the icon library is a
component-level migration, not a pure token swap. If the incoming doc's structure otherwise
matches, proceed to Step 1 with the new doc's values as the requirements gathered there.

### Step 1 — Ask the user (if not already provided)

Ask only what is not already known. Skip this step entirely if the user just wants the *existing*
`DESIGN.md` applied to the codebase (e.g. after a fresh clone, or after this skeleton's design
doc was swapped for a new one).

**Brand colour:**
- What is the primary (seed) brand colour? (hex, HSL, or a description like "orange")
- Is there a secondary accent colour, or does the system's black/white secondary (§2, Buttons)
  still apply?

**Typography:**
- Any font preference? (if none, keep Poppins/Inter — §3)
- Is this a modern tool, something warmer, or high-density data-heavy?

**Feel/radius:**
- Sharp and tight, standard, or soft and rounded? (§5's `--radius-sm/md/lg` scale — a "feel"
  change usually means shifting all three proportionally, not just one)

**Page width:**
- Check `DESIGN.md` §7 "Page structure" for a max content width first. **If it states one, use it —
  don't ask.** If §7 is silent (or you're authoring it for a new project), ask: how wide should a
  page get on a large screen — `1280px` (the standard, and the default if the user has no opinion),
  or wider for data-dense table-heavy apps?
- This is the `--container-max` token. It is the single value controlling page width app-wide:
  `PageLayout` reads it and no template or page sets its own, so this answer is cheap to change
  later — but it must end up in `docs/brand.md` and in `src/theme.css`, not just in the conversation.

**App identity:**
- Skip this bullet if `docs/plan/app.md` exists — read its `## Overview` there instead of asking
  again; `.claude/skills/plan-app/SKILL.md` already gathered it and updated `CLAUDE.md`.
- Otherwise: What kind of app is this? Who are the users? Desktop-first or mobile-first?
- After gathering this, also update the `## Project Overview` section in `CLAUDE.md`.

**Dark mode:**
- Is dark mode a priority or secondary?

**Toasts:**
- Should toasts (sonner) use **branded solid colors** per type — a solid fill using this repo's
  own `--success`/`--warning`/`--info`/`--destructive` tokens — or **sonner's own default
  `richColors` palette** (its built-in pastel success/info/warning/error colors, unrelated to this
  repo's brand)? Default to branded if the user has no preference — it's one line more work and
  keeps toasts visually consistent with the rest of the themed UI.

If the user provides a description like "orange, professional, desktop-first internal tool" —
that's enough. Do not over-ask.

---

### Step 2 — Derive the full token set

From the inputs, derive a complete palette using the **same M3 methodology already documented in
`DESIGN.md` §2**:

**Seed → tonal ramp (§2.1–§2.2):**
- Generate a 50–950 tonal ramp anchored at the seed's natural lightness step (usually `500` for a
  vivid brand color, `800` for a neutral/gray). Follow the existing primary/neutral ramps in §2.2
  as the pattern to replicate for a new seed.

**Semantic roles (§2.3):**
- `primary` = ramp step `500` (light mode) as-is; dark mode = lighten by ~10 percentage points of
  lightness for legibility against a dark surface (see §2.4 methodology, not a straight invert).
- `primary-hover` = one ramp step lighter (`400`) in light mode, further lightened in dark mode.
- `on-primary` = white in both modes (flat fill, white text — §2.6 Don'ts).
- `primary-container`/`on-primary-container` = pale tint (`100`) / dark tint (`900`) of the ramp,
  swapped between modes (see how the existing orange ramp does this in §2.3).
- `secondary`, `app-background`, `surface`, `border-dark`, `card-border`, functional colors
  (success/warning/error/info) — keep as documented in §2.3–§2.5 **unless the user explicitly asks
  to change them**; these aren't brand-specific in the way primary is.

**Dark mode (§2.4):** a deliberate re-derivation, never a straight lightness inversion. Follow the
same background/primary/secondary/functional-color substitution pattern already documented.

**All values must be HSL without the `hsl()` wrapper** — e.g. `20 82% 50%` not `hsl(20, 82%, 50%)`.

---

### Step 3 — Record the decisions in `docs/brand.md`

**You are writing a decision log, not a design spec.** `DESIGN.md` already holds the role list and
component behaviour and is framework-owned — leave it alone. Add one row to `docs/brand.md`'s
Overrides table per deliberate divergence from the default, each with a **why**:

| What | Default (DESIGN.md) | This portal | Why |
| --- | --- | --- | --- |
| Primary seed | `15 78% 50%` (orange) | `210 90% 45%` | Client's existing corporate blue |
| Heading font | Poppins | Söhne | Supplied in the client brand kit |

Work through the same checklist you would have applied to `DESIGN.md`, but capture only what is
*different* — anything unchanged needs no row, because `DESIGN.md` already documents it:

1. Identity — name/voice/avoid list, if the identity is changing
2. Seed colour(s) — the new seed HSL value(s), and the regenerated 50–950 ramp if a seed changed
3. Any role whose light or dark value diverges (§2.3–§2.5). `--color-card-border` covers both card
   edges and functional dividers (nav divider, table lines, side-sheet edge, form footer divider) —
   don't split these into a separate divider role unless the incoming design doc gives the two
   genuinely different values; a same-valued split produced contradictory guidance the last time
   this repo tried it
4. Typography — font family names/sources, if changing (remember the font URLs in `src/index.css`)
5. Icons — react-icons (Phosphor, `react-icons/pi`) is the org default. Changing it is a repo-wide
   component migration touching every `platform/src/components/ui/*` consumer, **and those files are
   framework-owned** — so it is a framework change, not a portal brand decision. Say so and confirm
   before treating it as part of a "design update"
6. Radius — the `--radius-sm/md/lg` values, if the "feel" is changing
7. Tables — header row style, zebra striping vs row/column lines, cell text, and whether row-level
   Switch controls should use `--color-secondary` (the org default, since primary is reserved for
   the view's one main action)
8. Toasts — whether this portal uses branded solid colours or sonner's defaults, if it differs
9. Max content width — if it diverges from `DESIGN.md` §7. **Phase 2 writes `--container-max` from
   whatever value applies**, so if you are not overriding it, read §7's value rather than inventing
   one; if you are, the row here is what Phase 2 reads
10. Supplied assets — fill in the Assets table (logo, favicon) and mark anything still a placeholder

If nothing diverges, say so and leave the Overrides table empty — a portal running the framework
default is the normal case, not a gap.

Show the user the recorded decisions and confirm before proceeding to Phase 2.

**Do not touch any stylesheet yet.**

---

## Phase 2 — Apply to the stylesheets

Only proceed after the `docs/brand.md` decisions are approved (or immediately, if Phase 1 was skipped).

### Step 4 — Read the rules and the bridge file

Read, in order:
1. `.claude/rules/index-css-rules.md` — token format/placement rules
2. `tailwind.md` — the **role → existing-shadcn-token mapping table**. This repo maps DESIGN.md's
   M3 role names (`--color-primary`, `--color-surface`, etc.) onto the **existing** shadcn token
   names (`--primary`, `--card`, etc.) rather than introducing new CSS variable names — every
   shadcn/ui primitive already consumes those names, so this keeps them all working. Re-derive
   this mapping only if DESIGN.md's role list has changed; otherwise reuse it as-is.

### Step 4a — Build the role inventory

Before writing any CSS, enumerate **every** role in DESIGN.md §2.3, §2.4, and §2.5 and classify
each one. This inventory — not the code block in Step 5 — is the authority on what actually needs
to be written; Step 5's block is only the baseline set for the org-default DESIGN.md and will miss
any role added since. Skipping this step is exactly how `--color-highlight` and
`--color-primary-hover` had no token at all despite being defined in DESIGN.md.

For each role, classify it as:

- **(a) mapped** — `tailwind.md` §1 already has a row pointing it at an existing shadcn token.
  Nothing to add.
- **(b) new** — no mapping row, and no existing token covers it. Must be added to `:root` +
  `.dark` + `@theme inline` (Steps 5–6), and recorded as a new row in `tailwind.md` §1.
- **(c) reference-only** — the §2.2 tonal ramp steps (`--primary-50`…`--primary-950` etc.). These
  are deliberately excluded from this inventory and must never be promoted to a token just because
  DESIGN.md documents the scale — see `index-css-rules.md`'s ramp exception.

If a role's dark-mode value is marked ⚠ unconfirmed/extrapolated in DESIGN.md, add the token
anyway (using the extrapolated value) and carry the ⚠ forward — a role that renders with an
unconfirmed value beats a role that silently doesn't exist. Flag every such ⚠-marked role in your
summary to the user at the end of Phase 2, so it's raised explicitly rather than buried in the doc.

### Step 5 — Update src/theme.css (token values)

Using `tailwind.md`'s mapping table **and Step 4a's inventory for any category-(b) roles**, write
each DESIGN.md role's value into its mapped or newly-promoted token, in both `:root` and `.dark`.
The block below is the baseline set present in the org-default DESIGN.md — treat it as a starting
point, not the complete list; add an entry for every category-(b) role Step 4a found:

```css
:root {
  --background: [app-background light];
  --foreground: [on-surface light];
  --card: [surface light];
  --card-foreground: [on-surface light];
  --popover: [surface light];        /* DESIGN.md doesn't distinguish popover from surface */
  --popover-foreground: [on-surface light];
  --primary: [primary light];
  --primary-foreground: [on-primary, white];
  --secondary: [secondary light];
  --secondary-foreground: [on-secondary light];
  --muted: [surface-variant light];
  --muted-foreground: [on-surface-variant light];
  --accent: [primary-container light];
  --accent-foreground: [on-primary-container light];
  --destructive: [error light];
  --destructive-foreground: [on-error, white];
  --destructive-hover: [darker in light mode, lighter in dark — same reasoning as --primary-hover];
  --border: [card-border light — also covers functional dividers, see Step 3];
  --border-dark: [outline light — the resting-state border on form fields, distinct from --border];
  --input: [--input-background light, or transparent — see the note below];
  --ring: [primary light — mirrors --primary];
  /* --input is commonly `transparent` in light mode for a "filled" M3 input pattern (see
     tailwind.md §1) — that's fine for Input/Textarea/Select, which get a separate
     --input-background fill. But the shadcn registry also reuses `border-input` for
     checkbox/radio-group/switch's unchecked outline, which has NO separate fill — if --input
     is transparent, those controls render with a literally invisible border/track. See Step 7. */

  --highlight: [a callout/instructional-banner tint within a --card surface; also table row
               hover/selection — see DESIGN.md §2.3, no -foreground partner, text uses --foreground];
  --disabled-text: [disabled text/icon color on a normal surface — distinct from the Button spec's
                    disabled *fill* and Selection controls' disabled shape fills, DESIGN.md §2.3];
  --success: [...]; --success-foreground: [...]; --success-text: [darker variant for wording, AA on white];
  --warning: [...]; --warning-foreground: [...];   /* keep dark text — warning bg is bright at all steps */
  --warning-text: [darker variant for wording — the base fill is too light for AA text contrast];
  --info: [...]; --info-foreground: [...];   /* also Link Blue for anchor links, DESIGN.md §2.5 */

  --radius-sm: [...]; --radius-md: [...]; --radius-lg: [...];
  --elevation-3: 0 8px 24px rgba(0, 0, 0, 0.12);   /* mode-invariant, :root only */
  --container-max: [DESIGN.md §7's max content width, e.g. 80rem = 1280px];
                                                   /* mode-invariant, :root only */
}

.dark {
  /* same token list, dark-mode values from DESIGN.md §2.3/§2.4 */
}
```

**`--container-max` — read it out of DESIGN.md §7, never invent it.** If §7 states a max content
width, that value is the token. If §7 is silent, stop and ask the user (Phase 1's Page-width
question) rather than guessing — then **write the answer back into §7 in the same pass**, so the
doc and the token can't disagree. Default to `80rem` (1280px) only if the user has no preference.

It stays out of `@theme inline`: Tailwind v4's `max-w-(--container-max)` shorthand compiles to
`max-width: var(--container-max)` and reads the variable directly, so no theme entry is needed.
Its only consumer is `PageLayout`'s inner wrapper — no template or page sets a page width, which is
what makes this one value rewidth the whole app.

**Font import:** at the very top of `index.css`, before any `@layer`:
```css
@import url("[Poppins font URL]");
@import url("[Inter font URL]");
@import url("[JetBrains Mono font URL, if used]");
```

**Base font vars:**
```css
--font-sans: "Inter", ...;      /* body */
--font-heading: "Poppins", ...; /* headings/subtitles — new token, not in old system */
--font-mono: "JetBrains Mono", ...;
```

**Type scale (DESIGN.md §3) — real tokens, not arbitrary values.** For each named step
(`display-lg`, `headline-lg`, `headline-md`, `title-lg`, `subtitle`, `body-lg`, `body-md`,
`button`, `label-sm`), write a `--text-X`/`--text-X--line-height` pair from that step's Size/Line
height columns, mode-invariant so `:root` only:
```css
--text-title-lg: 1.375rem;        /* 22px, from DESIGN.md's Size column */
--text-title-lg--line-height: 1.75rem;  /* 28px, from Line height */
```
These **must** also be mirrored into `@theme inline` (Step 6) — unlike `--radius-xl` or
`--container-*`, which already exist as Tailwind defaults and just need a `:root` override, these
are wholly new utility names with nothing for Tailwind to fall back on; skipping the passthrough
leaves `text-title-lg` resolving to nothing. `--type-body-emphasis` has no token — it inherits its
size from surrounding text by definition. Font-weight is a separate concern, applied via
`font-bold`/`font-semibold`/etc. alongside the scale class, matching DESIGN.md §3's own Weight
column — don't fold weight into the token.

### Step 6 — Check platform/src/styles/framework.css's @theme inline block

- `--radius-sm/md/lg` → passthrough to `var(--radius-sm/md/lg)` (see `tailwind.md` §3 — replaces
  any single-`--radius`-plus-`calc()` scheme).
- `--shadow-*` → collapse so shadow utilities below the overlay tier resolve to `none`, and
  `--shadow-md/lg/xl/2xl` resolve to `var(--elevation-3)` (see `tailwind.md` §4). This flips
  cards/tabs/calendar/etc. flat automatically without touching component files.
- `--font-sans/heading/mono` → passthrough to `var(--font-sans/heading/mono)` (Poppins is a new
  key — apply via `font-heading` className on headings/subtitles, there's no automatic global
  heading style).
- Every `--text-X`/`--text-X--line-height` pair from Step 5's type scale → passthrough to
  `var(--text-X)`/`var(--text-X--line-height)`. These are wholly new utility names (not an
  existing Tailwind default being overridden), so this entry is what makes `text-title-lg` exist
  as a class at all — skipping it is the same failure mode as `--color-highlight` going
  undocumented, just for typography instead of color.
- Add a `--color-X` entry for **every category-(b) role from Step 4a's inventory** (matching how
  `--color-primary`/`--color-secondary`/`--color-destructive` are already structured) — this
  includes `--color-success/-foreground`, `--color-warning/-foreground`, `--color-info/-foreground`
  when those roles are new, but is not limited to them. A token added in Step 5 with no matching
  entry here has no Tailwind utility and is unreachable from component code.

### Step 6a — Toasts

Based on the Step 1 answer:

- **Branded** (default): `platform/src/components/ui/sonner.tsx` should have `richColors` set on the
  `Sonner` component, and `platform/src/styles/framework.css` should have a `[data-sonner-toaster] { ... }` block
  re-pointing sonner's own `--success-bg/-border/-text`, `--info-*`, `--warning-*`, `--error-*`,
  `--normal-*` variables at this repo's `--success`/`--warning`/`--info`/`--destructive` (+
  `-foreground`) tokens, each wrapped in `hsl(var(--x))` with `!important` (sonner injects its own
  default rule at runtime, which is both more specific and later in the cascade — see the comment
  above that block in `platform/src/styles/framework.css` for the full reasoning). If this project doesn't have this block
  yet, add it; if it already exists, just confirm the token values it points to are current.
- **Default**: `richColors` alone on `Sonner`, no override block at all — sonner's own
  built-in palette applies automatically. If a branded override block exists from a previous
  DESIGN.md, remove it (otherwise it'll keep forcing branded colors regardless of this choice).

Either way, `sonner.tsx`'s `icons` prop (per-type react-icons/Phosphor icons) and `toastOptions.classNames`
(non-color pieces — `shadow-lg`, `description`, `actionButton`, `cancelButton`) are unaffected by
this choice and don't need to change.

### Step 7 — Verify

- Run `npm run docs:check` and confirm it reports no `--color-*` role warnings — this check parses
  every DESIGN.md §2.3–§2.5 table role and flags any that resolve to neither a `tailwind.md` §1
  mapping row nor a real `@theme inline` token. This is the completeness gate for Step 4a's
  inventory — a role Step 4a missed will show up here.
- Every token in `:root` that differs by mode has a corresponding override in `.dark`
- All values are HSL without the `hsl()` wrapper — no hex, no `rgb()`
- Font imports are at the top of the file
- `--ring` mirrors `--primary` in both modes (unless `DESIGN.md` explicitly says otherwise)
- No shadow classes remain on non-overlay surfaces (spot-check Card, Tabs)
- **If `--input` is transparent (or very close to the surface color) in light mode:** open
  `/component-library` and check `Checkbox`/`RadioGroupItem`/`Switch`'s unchecked and disabled
  states specifically — these frequently render with an invisible border/track in this repo,
  because `checkbox.tsx`/`radio-group.tsx`/`switch.tsx` reuse `border-input`/`bg-input`-style
  classes for their outline even though `--input` was only ever meant to be safe for
  Input/Textarea/Select (which have a separate `--input-background` fill to compensate). If they're
  invisible or too faint:
  - Point the unchecked border at `border-border` instead of `border-input` (`--border` always has
    a real, visible value in both modes — it's the same token already used for cards/dividers)
  - Check the *disabled* state too, separately from unchecked — DESIGN.md's Selection Controls
    section (checkbox/radio/switch) specifies its own lighter neutral-ramp treatment
    (`neutral-100`–`neutral-400`), distinct from the button disabled spec (`neutral-600`, §6). If
    disabled uses a bare `opacity-50` dim instead, it usually reads as "too light" — replace it with
    explicit `--control-disabled`/`--control-disabled-icon`/`--control-disabled-knob`-style tokens
    per the promotion procedure in `index-css-rules.md`, rather than dimming
- **Spot-check every `hover:`/`aria-*:`/`data-*:` class that uses an arbitrary-value CSS color
  function** (`color-mix(...)`, `oklch(from ...)`, etc.) rather than a plain `bg-x`/`text-x`
  utility — e.g. `button.tsx`'s `secondary` variant hover shipped from the registry as
  `hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]`. `var(--secondary)` here
  resolves to the bare triplet `"0 0% 0%"` (no `hsl()` wrapper, per this repo's token convention),
  which is not a valid `<color>` argument — `color-mix()` becomes invalid, and the whole
  `background-color` silently computes to its initial value (`transparent`), which on a light page
  reads as "the button turns white on hover" (not too bright — literally gone). This is a
  *different failure mode* than the `--input`-transparency issue above (CSS-invalid-value fallback,
  not a semantic token mismatch), but the same root cause: registry code assuming tokens are
  complete color values, when this repo stores bare HSL components. Two ways to check: (a) read
  DESIGN.md's own Buttons §6 hover table — it usually specifies an exact target (e.g. "Secondary
  filled: background lightens from `#000000` to `hsl(0, 0%, 20%)`"), so you can directly compare
  against the rendered result instead of guessing; (b) after building, grep `dist/assets/*.css` for
  the suspect class name to confirm the emitted rule's arguments are real colors
  (`hsl(var(--x))`/`var(--color-x)`), not bare `var(--x)`. Fix by wrapping in `hsl(var(--x))`, or
  simpler, reference the already-wrapped `--color-x` theme variable directly
  (`var(--color-secondary)` instead of `var(--secondary)`) — and if DESIGN.md specifies a literal
  hover target that isn't a straightforward opacity/mix of an existing token, promote it to its own
  token (e.g. `--secondary-hover`) rather than trying to reproduce it with a color-mix formula
  - Gotcha: these three components render as `<span role="checkbox">`/`role="radio"`, not real
    form controls — Tailwind's `disabled:` variant (which targets the CSS `:disabled` pseudo-class)
    silently never matches them. Use `data-disabled:` instead, matching the `data-checked:`/
    `data-unchecked:` convention already in the same file. Where a `data-disabled:` color needs to
    beat an equal-specificity `data-checked:`/`data-unchecked:` color (e.g. a disabled+checked
    control should still show as disabled, not as checked), add Tailwind's important modifier
    (`data-disabled:bg-x!`) — same-specificity attribute-selector variants otherwise resolve by
    stylesheet generation order, not by position in the className string, which is easy to get
    wrong by assuming "last in the string wins"
- **If this DESIGN.md changes radius, spacing, or type feel substantially** (not just brand
  colors) — read `tailwind.md` §8 Rebrand readiness first. Colour, density (`--spacing`), radius
  and type are all one-file levers today; the section names the short, deliberate list of things
  that *don't* move (`rounded-full`/`rounded-none`, a handful of optical nudges) so you don't
  chase them as bugs.

---

## Rules

- Never update a stylesheet before the `docs/brand.md` decisions are approved, and never edit
  framework-owned `DESIGN.md` at all
- All HSL values must be bare numbers: `20 82% 50%` not `hsl(20, 82%, 50%)`
- Prefer mapping a DESIGN.md role onto an **existing** token (via `tailwind.md`) over inventing a
  new CSS variable — only add a new token when no existing one covers the role (e.g. success/
  warning/info, which the prior shadcn-only palette didn't have)
- `--ring` always mirrors `--primary` unless `DESIGN.md` explicitly says otherwise
- Theming is done through CSS variables and the framework CSS's `@theme inline` block — do not change
  component files as a substitute for a token fix. The one exception: a component file may be
  edited when it's hardcoding a value or using an ad-hoc formula (e.g. `hover:bg-primary/80`,
  a `color-mix()` formula) where DESIGN.md specifies a role that now has a real token — pointing
  the component at that token is completing the token change, not separate component work. Even
  then, show the user the intended edit and get explicit approval before making it — never make it
  silently as part of "applying the design." Broader component-level work (Button variants, Navbar
  layout, selection controls, container discipline) remains a separate, larger effort not part of
  this skill, even though `platform/src/components/ui/` is no longer off-limits in general (see
  `.claude/rules/components-rules.md`).
- After completing, tell the user to hard-refresh the browser (Ctrl+Shift+R) to see the updated
  theme
