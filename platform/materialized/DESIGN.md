# Design System

> Single source of truth for visual and UX decisions across all applications.
> Reference this file from each project's `CLAUDE.md`:
> `Follow the design system in DESIGN.md for all UI work.`
>
> This file defines platform-agnostic **tokens** and **component behavior** — colors, type,
> spacing, and how each component looks/behaves in every state. It intentionally contains no
> framework-specific implementation. For the Tailwind CSS setup that implements these tokens
> (CSS variables, the `@theme inline` block, class-name mappings), see **`tailwind.md`**.

> ### ⚠ Read this before quoting a value from this document
>
> **This file is framework-owned and describes the *default* design system, not necessarily the
> portal you are working in.** It ships with the skeleton, receives framework updates, and is
> read-only in a portal repo (`platform/framework.json`).
>
> | Question | Authoritative source |
> | --- | --- |
> | What roles exist, what each is *for*, how a component behaves in each state | **this file** |
> | What colour/font/radius **this portal actually uses** | `src/theme.css` |
> | Why this portal's brand differs from the default, and what was decided | `docs/brand.md` |
>
> So: trust this document's **structure, role list and component specs**; do not assume its
> **values** ("primary is orange", "Poppins for headings") apply to the portal in front of you —
> check `src/theme.css`. `.claude/skills/plan-design/SKILL.md` records brand decisions in
> `docs/brand.md` and writes values to `src/theme.css`; it does **not** edit this file, because a
> per-portal edit here would be reverted by the next framework update.

---

## 1. Brand Foundations

**Name:** TC Default Design System

**Voice:** Calm, generous white space, practical.

**Avoid:** Gradients, glassmorphism, generic SaaS purple, neon, drop shadows.

**Core rules:**
- **Primary accent color** — strictly reserved for the main action on any given screen. One primary action per view; don't spread the accent color across multiple competing elements.
- **Typography intent** — the display font (Poppins) should convey authority; the body font (Inter) prioritizes readability and high contrast.

---

## 2. Color System

Built on Material Design 3's tonal-palette approach: seed colors generate 50–950 tonal ramps, and semantic **roles** map onto those ramps. Components reference roles, not raw values, so light/dark mode and future rebrands only require updating role mappings.

### 2.1 Seed colors

| Token | HSL | Notes |
|---|---|---|
| `--seed-primary` | `hsl(15, 78%, 50%)` | Burnt orange — logo, nav links, primary CTA |
| `--seed-neutral` | `hsl(0, 0%, 32%)` | Dark gray — secondary wordmark, body text base |
| `--seed-secondary` | `hsl(0, 0%, 0%)` | Black — secondary action buttons, full-color or outline variants |
| `--seed-app-background` | `hsl(203, 27%, 94%)` | Light gray-blue — default page/canvas background |
| `--seed-card-border` | `hsl(214, 30%, 91%)` | Hairline border on cards — the only separation device by default, no shadow |
| `--seed-card-background` | `hsl(0, 0%, 100%)` | Pure white — card/surface background |
| `--seed-success` | `hsl(160, 84%, 39%)` | Success states |
| `--seed-warning` | `hsl(38, 92%, 50%)` | Warning states |
| `--seed-error` | `hsl(0, 84%, 60%)` | Error states |

### 2.2 Generated tonal ramps

Anchored so the exact brand hue sits at its natural lightness step. These ramps supply contrast and highlight colors — hover states, containers, subtle backgrounds — without inventing one-off shades per component.

**Primary (orange)** — anchored at `500`

| Step | Hex |
|---|---|
| 50 | `#FDF4F1` |
| 100 | `#FBE6DF` |
| 200 | `#F7CABB` |
| 300 | `#F1A78E` |
| 400 | `#EA7952` |
| **500** | **`#E34E1C`** |
| 600 | `#C84419` |
| 700 | `#AD3C15` |
| 800 | `#882F11` |
| 900 | `#64230C` |
| 950 | `#441808` |

**Neutral (gray)** — anchored at `800`

| Step | Hex |
|---|---|
| 50 | `#F7F7F7` |
| 100 | `#EDEDED` |
| 200 | `#D9D9D9` |
| 300 | `#BFBFBF` |
| 400 | `#A3A3A3` |
| 500 | `#858585` |
| 600 | `#707070` |
| 700 | `#616161` |
| **800** | **`#515151`** |
| 900 | `#383838` |
| 950 | `#262626` |

### 2.3 Semantic roles

| Role | Light mode | Dark mode |
|---|---|---|
| `--color-primary` | `primary-500` (`#E34E1C`) | `hsl(15, 80%, 60%)` (`#EB7047`) |
| `--color-primary-hover` | `primary-600` (`#C84419`) | `hsl(15, 80%, 68%)` (`#EF8D6C`) |
| `--color-on-primary` | `#FFFFFF` | `#FFFFFF` |
| `--color-primary-container` | `primary-100` (`#FBE6DF`) | `primary-800` (`#882F11`) |
| `--color-on-primary-container` | `primary-900` (`#64230C`) | `primary-100` (`#FBE6DF`) |
| `--color-secondary` | `hsl(0, 0%, 0%)` (`#000000`) | `hsl(0, 0%, 96%)` (`#F5F5F5`) |
| `--color-secondary-hover` | `hsl(0, 0%, 22%)` (`#383838`) | *(dims the near-white fill to ~90% opacity instead — see §6 Buttons)* |
| `--color-app-background` | `hsl(203, 27%, 94%)` (`#ECF1F4`) | `hsl(221, 39%, 11%)` (`#111827`) |
| `--color-surface` | `hsl(0, 0%, 100%)` (`#FFFFFF`) | `hsl(222, 32%, 16%)` (`#1C2436`) |
| `--color-on-surface` | `neutral-800` (`#515151`) | `hsl(0, 0%, 93%)` (`#EDEDED`) |
| `--color-surface-variant` | `neutral-50` (`#F7F7F7`) | `hsl(222, 28%, 20%)` (`#242C40`) |
| `--color-on-surface-variant` | `neutral-600` (`#707070`) | `hsl(224, 10%, 70%)` (`#ABAFBA`) |
| `--color-border-dark` | `neutral-300` (`#BFBFBF`) | `hsl(221, 15%, 32%)` (`#454D5E`) |
| `--color-card-border` | `hsl(214, 30%, 91%)` (`#E1E7EF`) | `hsl(222, 20%, 26%)` (`#353D50`) |
| `--color-highlight` | `hsl(210, 40%, 96%)` (`#F1F5F9`) | `hsl(222, 28%, 22%)` (`#28324A`) ⚠ unconfirmed |
| `--color-disabled-text` | `neutral-300` (`#BFBFBF`) | `hsl(0, 0%, 50%)` ⚠ unconfirmed |

- `--color-card-border` is the single token for both card edges and functional dividers (table lines, nav divider, side-sheet leading edge, form footer divider). Previously split into a separate `--color-line` role for the divider case; merged back since the two never actually diverged and the split produced contradictory guidance in this file (the Navigation section below always specified the card-border token for the top-bar divider). One token, one job.
- `--color-app-background` is the default page/canvas background; `--color-surface` is reserved for cards and elevated content on top of it. This contrast — not a shadow — is what gives cards their "lifted" look, in both modes.
- Primary CTA buttons use `--color-primary` background with white `--color-on-primary` text — flat fill, no gradient, in both modes.
- `--color-primary-hover` **darkens** in light mode (`primary-600`, one step past the base `primary-500`) but **lightens** in dark mode, same as before — the primary fill sits on a dark card there, so darkening on hover would read as the button receding rather than responding.
- `--color-highlight` is for a callout section *within* a `--color-surface` card that needs to visually stand apart to flag important information — e.g. a leading instructional banner at the top of a form/page ("Generate Leave Report: select users and a year...") — and also for table row hover and selection. It's distinct from `--color-surface-variant` (`#F7F7F7`, used for table zebra striping) — this is a slightly cooler, more visible tint, closer to `--color-app-background` (`#ECF1F4`) than to white, so the callout reads as recessed/highlighted rather than just an alternating row. Not a status color — distinct from the already-defined success/warning/error/info roles in §2.4–2.5. The dark-mode value is extrapolated (no dark-mode reference was provided) and needs confirmation before use.
- `--color-disabled-text` is disabled text/icon color on a normal surface — distinct from the Button spec's `neutral-600` disabled *fill* (§6 Buttons) and from Selection controls' disabled shape fills (§6), which share this value today but cover a different job and may diverge later.

### 2.4 Dark mode conversion

Dark mode is a deliberate re-derivation, not a straight lightness inversion.

- **Background:** dark navy, `hsl(221, 39%, 11%)` (`#111827`) — not black or gray. Cards sit one step lighter, `hsl(222, 32%, 16%)` (`#1C2436`), same hue family, preserving the light-mode background/surface structure.
- **Primary:** lightened rather than darkened — `hsl(15, 80%, 60%)` (`#EB7047`) — to hold contrast against the dark navy surface.
- **Secondary:** flips from black to near-white, `hsl(0, 0%, 96%)` (`#F5F5F5`) — same role (strong neutral contrast), inverted literal color.
- **Functional colors:** brightened slightly for contrast, same hue:

| Token | Light mode | Dark mode |
|---|---|---|
| `--color-success` | `hsl(157.5, 90.6%, 33.5%)` (`#08A369`) | `hsl(158, 75%, 52%)` (`#29E09D`) ⚠ unconfirmed |
| `--color-warning` | `hsl(36.4, 100%, 46.9%)` (`#EF9100`) | `hsl(36, 100%, 58%)` (`#FFA929`) ⚠ unconfirmed |
| `--color-error` | `hsl(0, 79.1%, 51.2%)` (`#E52020`) | `hsl(0, 79%, 63%)` (`#EB5656`) ⚠ unconfirmed |
| `--color-info` | `hsl(214.4, 100%, 32.2%)` (`#0046A4`) | `hsl(214, 85%, 65%)` (`#5A9CF2`) ⚠ unconfirmed |
| `--color-warning-text` | `hsl(22, 92%, 37%)` (`#B54708`) | `hsl(22, 92%, 62%)` (`#F78645`) ⚠ unconfirmed |
| `--color-success-text` | `hsl(158, 78%, 27%)` (`#0F7A52`) | `hsl(158, 60%, 55%)` (`#47D19F`) ⚠ unconfirmed |

All four ⚠ dark-mode values above are re-derived per this section's own rule (brightened for
contrast, same hue) rather than designer-supplied — confirm before treating as final, same
caveat `--color-highlight`'s dark value already carries (§2.3).

### 2.5 Functional colors

| Token | HSL | Hex |
|---|---|---|
| `--color-success` | `hsl(157.5, 90.6%, 33.5%)` | `#08A369` |
| `--color-warning` | `hsl(36.4, 100%, 46.9%)` | `#EF9100` |
| `--color-error` | `hsl(0, 79.1%, 51.2%)` | `#E52020` |
| `--color-info` | `hsl(214.4, 100%, 32.2%)` | `#0046A4` |
| `--color-warning-text` | `hsl(22, 92%, 37%)` | `#B54708` |
| `--color-success-text` | `hsl(158, 78%, 27%)` | `#0F7A52` |

- `--color-warning`/`--color-success` are fills for icons, chip backgrounds and shapes — too light
  for body text (`--color-warning` is 2.26:1 on white, well under WCAG AA). `--color-warning-text`/
  `--color-success-text` are darkened variants of the same hue for wording on a `--color-surface`/
  white background (5.08:1 and 5.35:1 respectively). Use the base token for a fill, the `-text`
  token for the words describing it.
- `--color-info` carries two jobs, not one: Link Blue (anchor links in body copy — table entity
  links use `--color-primary` instead, see the datatable build skill) **and** the info-toast fill
  (§6 Container types → Toast). Both are legitimate; don't assume a change to one is meant for the
  other.

### 2.6 Don'ts
- Never place `--color-primary` text on `--color-primary` background variants below `100` (fails contrast).
- The brand runs on primary (orange), secondary (black/white depending on mode), and neutral (gray), plus `--color-info`'s blue reserved for links — don't introduce a fifth accent hue without formally adding it here first.
- Don't use tinted/gradient CTA buttons — flat fill with white text, in both modes.
- Don't treat dark mode as a simple color inversion — background, primary, and secondary all need the deliberate substitutions in §2.4.
- Don't use the light-mode black secondary value in dark mode — it's invisible against the dark navy background; use the dark-mode secondary value instead.

---

## 3. Typography

**Font families**
```css
--font-heading: 'Poppins', -apple-system, sans-serif;   /* headers & subtitles */
--font-body: 'Inter', -apple-system, sans-serif;         /* body copy */
--font-button: 'Inter', -apple-system, sans-serif;        /* buttons (Semibold weight) */
--font-mono: 'JetBrains Mono', ui-monospace, monospace;   /* code, if needed — placeholder */
```
Source: [Google Fonts — Poppins](https://fonts.google.com/specimen/Poppins) / [Google Fonts — Inter](https://fonts.google.com/specimen/Inter)

> The CSS-variable / Tailwind mapping for these families lives in **`tailwind.md`** — the block
> above is the platform-agnostic reference, not the implementation.

**Weight usage**

| Family | Weights used | Where |
|---|---|---|
| Poppins | Medium (500) → ExtraBold (800) | Headers, subtitles — heavier weight scales with hierarchy (e.g. h1 = ExtraBold, h4/subtitle = Medium) |
| Inter | Regular (400), Medium (500), Semibold (600), and italic of any of these | Body copy, paragraphs, descriptions — varying weight/italics is for **inline emphasis of specific keywords**, not for restyling whole paragraphs |
| Inter | Semibold (600) | Buttons only |

**Type scale** (M3 naming convention)

| Token | Font | Size | Line height | Weight | Usage |
|---|---|---|---|---|---|
| `--type-display-lg` | Poppins | 57px | 64px | 800 (ExtraBold) | Hero sections only |
| `--type-headline-lg` | Poppins | 32px | 40px | 700 (Bold) | Page titles |
| `--type-headline-md` | Poppins | 28px | 36px | 700 (Bold) | Section headers |
| `--type-title-lg` | Poppins | 22px | 28px | 600 (SemiBold) | Card/panel titles |
| `--type-subtitle` | Poppins | 18px | 26px | 500 (Medium) | Subtitles under headers |
| `--type-body-lg` | Inter | 16px | 24px | 400 (Regular) | Default body text |
| `--type-body-md` | Inter | 14px | 20px | 400 (Regular) | Secondary text |
| `--type-body-emphasis` | Inter | inherits from surrounding body text | 500–600 (Medium/Semibold), and/or italic | Inline emphasis of specific keywords — not a standalone block style |
| `--type-button` | Inter | 14px | 20px | 600 (Semibold) | Buttons only |
| `--type-label-sm` | Inter | 11px | 16px | 500 (Medium) | Captions, metadata |

**Rules**
- Never use Poppins for body copy or Inter for headers/subtitles — Poppins for display/heading hierarchy, Inter for everything read at length.
- Buttons: always Inter Semibold — never Poppins, never Inter Regular/Bold.
- Heading weight scales with importance: ExtraBold/Bold sparingly (h1, hero), stepping down to SemiBold/Medium for smaller headers and subtitles — don't use ExtraBold everywhere or hierarchy flattens.
- Within body copy, weight (Medium/Semibold) and italics may be used **inline** to emphasize specific keywords or phrases. Use sparingly — emphasis only works if most of the paragraph stays Regular weight. Don't set an entire paragraph in a heavier weight or in italics.
- Buttons and nav items: Title Case.
- Line length: cap body text at ~70–75 characters for readability.

---

## 4. Icons

**Source:** [react-icons](https://react-icons.github.io/react-icons/), using **Phosphor Icons**
as the primary icon set.

```
import { IconName } from "react-icons/pi";
```

- Phosphor is the default source for every icon in this system — nav icons, button icons, input icons (calendar, search, dropdown chevron), checkbox/radio/switch iconography, status icons, etc. Don't mix in icons from another react-icons set (Material Design, Feather, Heroicons, etc.) unless Phosphor genuinely lacks the icon needed — and if that happens, treat it as an exception worth noting inline in code, not a silent substitution.
- Phosphor ships multiple weights (thin, light, regular, bold, fill, duotone). Pick one weight as the system default and use it consistently — mixing weights across icons in the same view reads as inconsistent even if every individual icon is "correct."
- Icon color follows the same token rules as the text/element it's paired with (e.g. an icon inside a Primary button uses `--color-on-primary`; a nav icon uses whatever color that nav item's text uses) — icons don't get their own independent color decisions separate from their context.
- Icon sizing should be consistent within a given context (e.g. all input icons the same size, all nav icons the same size) — don't vary icon size ad hoc within the same component type. Default `size-4`; `size-5` for standalone icon buttons (per `CLAUDE.md`).

---

## 5. Spacing, Radius & Elevation Tokens

4px base-unit scale.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |

**Radius**
| Token | Value | Used by |
|---|---|---|
| `--radius-sm` | 4px | Inputs, chips, buttons |
| `--radius-md` | 8px | Cards |
| `--radius-lg` | 16px | Modals, the floating top bar |
| `--radius-full` | 9999px | Avatars, pills, switches, radio controls |

`--radius-full` is a documented role with no CSS mechanism behind it: Tailwind's `rounded-full`
compiles to a literal (`calc(infinity * 1px)`), not a `var()` reference, so unlike `sm`/`md`/`lg`
it can't be retuned from `index.css` — it's correctly pinned at "fully round" by design, not a gap.

**Elevation**
| Token | Value | Used by |
|---|---|---|
| `--elevation-card` | `border: 1px solid var(--color-card-border)` — no box-shadow | Default card state |
| `--elevation-2` | `border: 1px solid var(--color-border-dark)` (or `--color-secondary` for a stronger state) — a border/outline change, **not** a box-shadow. Implemented as the `--elevation-2` token in `theme.css`, mapped for Tailwind in `framework.css`; `Card` applies it via `[a:hover>&]:ring-elevation-2`, so a card inside a link gets it with no opt-in | Interactive card hover/active |
| `--elevation-3` | `0 8px 24px rgba(0,0,0,0.12)` — the one and only permitted box-shadow in this system | Dropdowns, modals, popovers only. No box-shadow anywhere else. |

> Framework-specific class names for these tokens (including required `@theme inline` overrides in `index.css`, since a couple of these values don't match Tailwind's own defaults of the same name) are in **`tailwind.md`**.

---

## 6. Components

### Buttons

**Dimensions** (applies to every variant — height and radius must never vary between buttons)
- Height: 40px (matches input height, so buttons and inputs align on the same row); 48px on mobile
- Minimum width: 96px — width otherwise hugs the label once that minimum is met; icon-only buttons are square and exempt
- Horizontal padding: `--space-4` (16px)
- Radius: `--radius-sm` (4px)

**Content composition**

- Buttons accommodate two content patterns: label only (e.g. "Refresh"), and icon + label (e.g. a funnel icon + "Filter"). Icon-only buttons (no label, e.g. the table row delete action) are a different, unlabeled pattern and aren't covered by this row — flag separately if that needs its own spec.
- Icon + label: icon sits left of the label, gap `--space-2` (8px) between them, both vertically centered. Icon size 16px, color matches the button's text color for that variant (per §1 icon-color rule above).
- Horizontal padding (`--space-4`, 16px, per Dimensions above) is measured from the button edge to the outermost content — the icon if present, otherwise the label. The icon doesn't get its own separate padding.
- The 96px minimum width (per Dimensions above) applies the same way whether the button has an icon or not — hug contents, expand past 96px only once label (+ icon, if present) needs it.

**Variants (default state)**

| Variant | Background | Text | Usage |
|---|---|---|---|
| Primary | `--color-primary` | `--color-on-primary` (white) | One per view, main action — see §1: primary accent reserved for the main action only |
| Secondary (filled) | `--seed-secondary` (`#000000`) | white | Alternate/secondary actions |
| Secondary (outline) | transparent, `#000000` border | `#000000` | Alternate/secondary actions, lower emphasis than filled |
| Ghost | transparent | `--color-primary` | Low-emphasis actions |
| Destructive | `--color-error` | white | Confirms Delete-type actions only — never the initial trigger (e.g. a row's delete icon), only the confirming action inside a modal |
| Disabled | `neutral-600` (`#707070`) | white | Filled buttons (Primary, Secondary filled, Destructive) collapse to this when disabled — see Disabled below |
| Disabled (Outlined) | transparent | `neutral-600` (`#707070`) border and text | Outlined/transparent buttons (Secondary outline, Ghost) collapse to this when disabled — see Disabled below |

**Hover**

| Variant | Hover treatment |
|---|---|
| Primary | Background darkens to `--color-primary-hover` in light mode (`#C84419`) but lightens in dark mode (`#EF8D6C`) — the fill sits on a dark card there, so darkening would read as receding. Text stays white in both. |
| Secondary (filled) | Background lightens from `#000000` to `hsl(0, 0%, 22%)` (`#383838`) — text stays white. In dark mode, the base color is already near-white; reduce to ~90% opacity on hover instead of lightening further. |
| Secondary (outline) | Border/text unchanged; semi-transparent gray background fill: `rgba(0, 0, 0, 0.05)` light mode, `rgba(255, 255, 255, 0.08)` dark mode |
| Ghost | Same semi-transparent gray fill as Secondary (outline) |
| Destructive | Background darkens to `--color-destructive-hover` in light mode (`#C91717`) but lightens in dark mode (`#EF7B7B`) — same reasoning as Primary. Text stays white in both. ⚠ dark value unconfirmed |

General rule: filled buttons (Primary, Secondary filled, Destructive) shift on hover — darker in light mode, lighter in dark, since a fill sitting on a dark card would read as receding if it darkened further. Secondary (filled) is the one exception, staying light-mode-lightens/dark-mode-dims per its own row above. Outlined/transparent buttons (Secondary outline, Ghost) keep their color and gain a subtle gray background fill instead.

**Disabled**

- Use case: whenever the button's required condition isn't yet met — e.g. "Save" stays disabled until all required fields are filled or an edit is made, and re-disables if an edited form needs re-validation. Also covers any condition where a button must remain visible but inactive.
- Visual treatment: switch to the **Disabled** variant (filled buttons: Primary, Secondary filled, Destructive) or **Disabled (Outlined)** variant (outlined/transparent buttons: Secondary outline, Ghost) — both use `neutral-600` (`#707070`), regardless of the button's original color. This replaces the button's identity color entirely rather than dimming it, so a disabled state reads the same across all variants. `neutral-600` (not `neutral-400`) specifically to keep white button text at a passing 4.95:1 contrast ratio.
- **These are the only two disabled treatments in the system.** There is no tinted, lightened, or reduced-opacity version of a button's original color for disabled state (e.g. a pale/peach Primary) — that pattern was explicitly replaced by the flat neutral-600 approach above and must not reappear as a third variant.
- Disabled buttons are non-interactive and never show a hover effect — never lighten or gain the gray hover fill.
- Disabled buttons need a visible reason (helper text, inline validation — see §8 Forms and actions), not just gray with no explanation.

**Loading**

- Use case: an async action is in progress (e.g. form submission) — the button is temporarily non-interactive but not "disabled" in the blocked/invalid sense.
- Visual treatment: keeps the variant's own default-state background and text color (e.g. a loading Primary button stays `--color-primary`, not neutral) — do not switch to the Disabled/Disabled (Outlined) neutral treatment. This is what visually distinguishes "processing" from "blocked."
- Shows a loading indicator; remains visually non-interactive but distinct from the Disabled state — no hover effect while loading.

All states — default, hover, active, disabled, loading — are fully specified above; no state should be improvised.

### Cards
- Background: `--color-surface` (`#FFFFFF`) — always white, never the app background color
- Sits on `--color-app-background` — the page background must be the light gray-blue tone so cards read as distinct surfaces
- Radius: `--radius-md` (8px)
- Border: 1px solid `--color-card-border` — the only separation device by default
- Shadow: none, ever, at any state. The only exception in the system is `--elevation-3` (§5), reserved for dropdowns/modals/popovers.
- Interactive cards (clickable) use `--elevation-2` on hover/active — a border/outline change, not a shadow
- Padding: `--space-6` (24px) — no component may touch a card's edge; this padding is the minimum clearance
  - **`--space-4` (16px) below `sm`.** 24px on each side of a 375px phone screen leaves under 300px
    of usable content inside a narrow card, which is what makes a public form feel cramped on a
    phone. The card itself already spans the full width there (its max-width is a *max*, and page
    padding supplies the outer gutter), so the only thing left to reclaim is its own inset.
- Section headers inside cards may use `--color-primary` or a secondary accent for the label — confirm exact secondary color if more than orange is used

### Forms
- Input height: 40px, padding `--space-3` (12px), radius `--radius-sm`, width: fill container
- **Every closed field shares that shape**, not just text inputs: a `Select` trigger, a `Combobox`
  trigger and a `MultiSelect` trigger are all 40px tall with 12px horizontal padding and fill their
  container by default. They sit in the same forms and the same rows as `Input` and `Button`, so a
  select that is 36px tall and only as wide as its own placeholder reads as a different, smaller
  kind of control. Two named scales exist for the cases that genuinely differ:
  - **Height** — `default` 40px (this rule), `md` 36px (the DataTable toolbar band, matching its
    Searchbar and RefreshButton). A 32px compact step exists on the plain `Select` only (e.g. a
    pagination page-size picker); it is **not** part of the field vocabulary yet, because `Input`
    and text areas have no size scale at all. Adding one is an all-fields change, not a per-
    component one.
  - **Width** — `full` (default, per this rule), then `lg` 320px, `md` 224px, `sm` 160px, `xs` 96px
    for toolbar controls that must not stretch.
  A row that mixes heights is almost always a mistake; see §7's rule on vertically centering a
  mixed row.
- **Resting state (this was previously undefined — likely why it's rendering inconsistently): 1px solid `--color-border-dark` border, `--color-surface` background, no box-shadow.** Box-shadow is never used on inputs at any state — the only shadow in the whole system is `--elevation-3` (dropdowns/modals/popovers), and inputs aren't on that list.
- Focus ring: 2px `--color-secondary` (black) outline offset 2px. This is an *outline*, not a box-shadow, and it only appears on focus — the resting/unfocused border stays `--color-border-dark` at 1px as above.
- Error state: `--color-error` border + helper text below
- Every field with a non-obvious requirement (format, required vs. optional, limits) gets a short helper text line under the field — don't rely on placeholder text alone, since it disappears once the user starts typing
- Forms with consequences beyond "save this field" need an instruction line at the top explaining what completing it will do (see §8, Forms and actions)
- Primary submit/save button stays disabled until all required fields are valid — see Buttons → Disabled
- Disabled: background `--color-surface-variant` (`--muted`), border `--color-card-border`
  (`--border`), text `--color-disabled-text` — a flat replacement, not reduced opacity, extending
  Buttons' Disabled principle (no tinted/lightened/opacity version of the field's own colors) to
  form fields.

### Alerts

Inline, non-dismissible callouts inside page content — not a toast (§ Container types), not a
confirmation (that's a modal). Four types, one shape: `--color-surface` background (no tinted
fill), coloured icon + text, border matching the text color's hue at low opacity.

| Type | Text/icon | Usage |
|---|---|---|
| Default | `--color-on-surface` | Neutral informational content |
| Success | `--color-success-text` | Positive confirmation, wording only — not a status fill |
| Warning | `--color-warning-text` | Caution, wording only |
| Destructive | `--color-error` | Error/failure state |

### Badges

Small status/count pills. Unlike Alerts, a Badge's fill *is* tinted (`--color-X` at 10% opacity in
light mode, 20% in dark) with matching coloured text — a badge is small enough that a solid fill
would be too loud, where an Alert's larger surface can stay neutral.

| Type | Fill | Text |
|---|---|---|
| Default | `--color-primary` (solid) | `--color-on-primary` |
| Secondary | `--color-secondary` (solid) | `--color-on-secondary` |
| Success | `--color-success` at 10%/20% | `--color-success-text` |
| Warning | `--color-warning` at 10%/20% | `--color-warning-text` |
| Destructive | `--color-error` at 10%/20% | `--color-error` |

### Chips

A **value** the user has picked, usually with a control to take it back out — what a multi-select
puts in its trigger, and what a standalone tag looks like elsewhere.

Distinct from a Badge, and the distinction is worth keeping: a Badge is a non-interactive *status*
pill at `--radius-full`, wording only. A Chip names something the user chose, so it takes
`--radius-sm` (§5 assigns that radius to inputs, chips and buttons) and it can carry a remove
control.

- Height 20px. Fill `--color-highlight`, hairline `--color-card-border`, text `--color-on-surface`,
  at the small label size.
- Fill is `--color-highlight` rather than `--color-surface-variant` deliberately: a chip is a
  selection, and `--color-highlight`'s role (§2.3) already covers selection highlights, while
  `--color-surface-variant` is spoken for by table zebra striping and reads as nearly invisible
  against a white card.
- Remove control: an inline ✕ at the trailing edge, `--color-on-surface-variant`, hover fill
  `--color-card-border`. **Always a real button with an accessible name** (`Remove <label>`), never
  a bare icon — a chip is frequently the only way to undo a selection.
- The label **truncates rather than wraps**. Chip rows live inside fixed-height controls, so a long
  value must not change the control's height.
- Disabled: text `--color-disabled-text`, and no remove control at all.

### Confirmation pages

What a form shows after a successful submit, when a toast is not enough — a public form especially,
where the submitter has no app around them to return to.

- Success badge: a **circular** tinted badge, 64px, `--color-success` at 10% (20% in dark) with the
  tick in `--color-success`. A tick is not an action, so it does **not** take `--color-primary`,
  even where a mock shows it that way: §2 reserves the accent for the one action on the screen, and
  a large accent badge sitting directly above an accent button is exactly the "competing elements"
  that rule exists to prevent. Circular, unlike the `--radius-md` hero slots used by dialogs — a
  circle reads as a status stamp rather than another card.
- Wording: the description says **what happens next**, not that the submit worked — the badge and
  the title already said that. Fine print (a standing obligation, a condition of entry) goes below
  a short divider so it reads as fine print instead of a third paragraph.
- A detailed confirmation echoes back what was recorded, as label/value rows. **Values wrap; they
  are never truncated** — a summary exists to be quoted back later, so an ellipsis defeats it.
- **Actions are a per-page decision, and the destinations must be confirmed with whoever owns the
  flow.** Two controls that go to the same place is a smell, not a default. This is the second
  container decision in this system that is asked rather than assumed — see §7's side-sheet-vs-modal
  rule.

### Selection controls: checkboxes, radios, switches

**When to use which**
- Checkbox: multiple selections from a set, or a single yes/no that takes effect on form submit (not immediately).
- Radio: single selection from a set of mutually exclusive options — always presented as a group, never alone.
- Switch: a single on/off setting that takes effect immediately, with no Save step.

**Group composition** (applies to all three)
- Control + label form one atomic group.
- Internal gap (control to its own label): `--space-2` (8px).
- Group direction: horizontal or vertical, depending on context — external gap between separate groups is configurable per use case (see § Composition Patterns for the default page-level values).

Disabled states below use lighter neutrals (`neutral-100`–`neutral-400`) than the disabled Button spec (`neutral-600`, § Buttons) — that's intentional, not an inconsistency: these are small shape fills with no text painted on top of them, so the white-text contrast requirement that drove the button decision doesn't apply here. Label text contrast is handled separately via `--color-on-surface-variant`.

**Checkbox**
- Box: 16px × 16px, radius `--radius-sm` (4px), 1px border `--color-border-dark` when unchecked.
- Checked: background `--color-primary`, white checkmark icon, no border.
- Indeterminate: background `--color-primary`, white horizontal dash icon (same treatment as checked, different icon).
- Disabled (checked or unchecked): background/border `neutral-300`, icon (if checked) `neutral-400`, label text `--color-on-surface-variant`.
- Label: `--type-body-md`, `--color-on-surface`.

**Radio**
- Circle: 16px × 16px, radius `--radius-full`, 1px border `--color-border-dark` when unchecked.
- Checked: 2px border `--color-primary`, centered filled dot in `--color-primary` (dot ~8px).
- Disabled (checked or unchecked): border `neutral-300`, dot (if checked) `neutral-400`, label text `--color-on-surface-variant`.
- Label: `--type-body-md`, `--color-on-surface`.
- Always presented in a group of 2+; never render a single radio in isolation.

**Switch**
- Track: 40px × 24px, radius `--radius-full`.
- Off: track `--color-border-dark`, knob white, positioned left.
- On: track `--color-primary`, knob white, positioned right.
- Knob: 20px circle, 2px inset from track edge, no shadow (flat fill only, per §1 — avoid drop shadows).
- Disabled (on or off): track `neutral-300`, knob `neutral-100`, label text `--color-on-surface-variant`.
- Label: `--type-body-md`, `--color-on-surface`. Takes effect immediately on toggle — no accompanying Save button.

### Tables

- Header row: label text `--type-label-sm`, color `--color-on-surface-variant`, left-aligned per column, **except a numeric column, whose header right-aligns with its digits and mirrors its sort arrow to sit left of the label instead of hugging the far edge alone.** 1px bottom border in `--color-card-border` under the header row, separating it from the body.
- Body rows: zebra striping — alternate row background `--color-surface` (white) and `--color-surface-variant` (`neutral-50`, `#F7F7F7`) — the alternating fill is the primary separator; no additional row divider lines needed between body rows. If a table's design calls for row or column lines instead of (or in addition to) zebra striping, use `--color-card-border`.
- Row hover and selection: `--color-highlight`, not the zebra-stripe `--color-surface-variant` — hover/selection needs to read as distinct from the alternating-row fill.
- Cell text: `--type-body-lg`, color `--color-on-surface` — same treatment for every column (date, label, etc.); don't introduce a separate *text* color per column. Two exceptions, both already narrow and named: the link cell (`--color-primary`), and a status column rendered as a Badge, which carries the Badge palette (§6 Badges) rather than recoloring the cell's own text.
- **Numeric columns** (amounts, counts, rates): right-aligned so the digits line up down the column, with tabular (fixed-width) figures so they don't visually drift between rows. A unit renders **separated from the digits, in its own muted gutter** — a prefix (`$`) pinned to the cell's left edge, a suffix (`days`, `%`) pinned to its right — rather than concatenated onto the number (`$1,234.00`). The unit is context, the digits are the data; a pinned unit keeps both the units and the digits lined up down the column instead of staggering with each value's width. This is a display concern only — the unit is never baked into a formatted string the column stores, which would still break both sorting and search on that column. The header's own right-alignment lines up with the value block as a whole, not with the digits alone, so a suffix column's header edge sits a few pixels past the digits' edge — the gutter, not a misalignment.
- **Column width**: auto by default — every column sizes to its content, the same as an ordinary HTML table. A column may declare a fixed pixel width when a page genuinely needs one; declaring it switches the whole table to a fixed layout, so declared widths hold exactly and the remaining space splits evenly among the columns that don't set one, and overflowing content in a fixed-width column truncates with an ellipsis rather than wrapping or forcing the column wider. A table wider than its container scrolls horizontally inside its own frame rather than widening the page — this is the default for every table, not something a page opts into.
- **Status columns**: a Badge (§6 Badges), never plain text or a colored cell — the mapping from a status value to a Badge variant is a deliberate per-column decision, not a default.
- **Editing happens in the edit form, never inline in a cell** — no `Select`, `Input`, or other data-entry control inside a column. The one exception is a single on/off toggle (below): everything else opens a side sheet (see § Container types → Side sheet).
- Row-level Switch controls: track uses `--color-secondary` (black / near-white in dark mode per §2.4) when on, **not** `--color-primary` — a table can have many independently-toggled rows, and primary orange is reserved for the one main action on the screen (§1). Off-state, sizing, and knob treatment otherwise follow the standard Switch spec above. A row Switch is the sanctioned exception to "no inline editing" precisely because a Switch is *by definition* the immediate-effect control (see § Selection controls: "takes effect immediately... no Save step") — it calls the API on the spot rather than opening a form.
- Row actions (e.g. delete icon): icon color `--color-on-surface-variant`; this is a direct-action icon, not a Destructive button — confirmation, if required, happens in a modal (see § Container types → Modal), with the modal's confirming button using the Destructive variant.
- Table toolbar (search + action buttons above the table): search input follows the standard Forms input spec above; action buttons follow the standard Buttons spec above, typically Secondary (outline) at this emphasis level (e.g. Filter, Refresh) unless one of them is the screen's one Primary action (e.g. Add).

> Note: a reference screenshot's text has been seen rendering in a slightly blue-tinted slate rather than the neutral grays defined in §2 (e.g. header labels closer to `#64748B` than `neutral-600` `#707070`, body text closer to near-black `#020817` than `neutral-800` `#515151`). Map to the closest existing tokens above rather than introducing a new slate ramp — flag with the client if the intent is actually a new neutral hue family, since that would need to be formally added per §2.6.

### Container types: forms, side sheets, modals, popovers

Four distinct containers, each with one job. Don't substitute one for another.

**Full-page / in-page form** — creating new data
- Use for "Add"-type actions where the user registers brand-new data.
- Lives in the normal page flow as a card (§ Cards) or dedicated page — not an overlay.
- Structure: title, hairline divider under the title, stacked fields top-to-bottom, character counters on long-text fields. Action button placement: see § Composition Patterns.
- Follows all standard Forms rules above.

**Side sheet** — editing existing data
- Use whenever the user is editing an existing record — keeps them on the same page/context instead of navigating away.
- Panel slides in from the right, fixed width (~400–480px), full viewport height, background `--color-surface`, left edge divided from the backdrop by `--color-card-border`.
- Backdrop: dim the page behind it with `rgba(0, 0, 0, 0.55)`. No blur.
- Structure: title + close (×) at top, content grouped into labeled sections. Action button placement: see § Composition Patterns.
- Radius: **none, on any corner** — explicitly unlike cards (`--radius-md`) and modals/dialogs (`--radius-lg`), which do round. A sheet is anchored to a viewport edge rather than floating in the middle of one, so a rounded leading edge reads as a card that has slid off-screen. Same reasoning as the top bar going the other way: that one floats, so it rounds.

**Modal** — confirmation, warnings, and forms
- Most often: the user must confirm or acknowledge before an action proceeds.
- A modal **may** carry a form. Data entry and editing are not restricted to side sheets — a form
  is legitimate in either container, and there is no field-count limit that forces one over the
  other.
- Which of the two to use is **confirmed with the user, not assumed** — see § Composition Patterns
  → Choosing a container.
- Centered on screen, backdrop `rgba(0, 0, 0, 0.55)`, `--radius-lg`.
- One of the three permitted uses of `--elevation-3` (§5), alongside popovers and dropdown/selection menus.
- Per §8 Forms and actions: state the consequence in the modal copy itself, not just the button label.
- Delete-confirmation modals use the Destructive button variant for the confirming action, paired with a Secondary/Ghost "Cancel" — never Primary (orange) to confirm a delete.

**Popover** — informative content and hover detail only
- Use for lightweight, non-blocking information: tooltips, hover detail.
- Never use a popover for anything requiring user input or a decision — that's a modal's or side sheet's job.
- Anchored to the triggering element, no backdrop dimming — the rest of the page stays fully interactive.
- Another of the three permitted uses of `--elevation-3`.

**Toast** — transient, non-blocking notifications (not anchored to a trigger element, unlike a popover)
- Fires on: success confirmation, network/request failure, and other one-off events per §7 UX Principles ("Toast on success · inline error on form fields · toast on network failure").
- **No fill per type.** Every toast uses the standard overlay surface `--color-surface` — white in light mode, the same near-black card surface as dialogs and popovers in dark mode — regardless of type. Type is carried by the icon, and by text color for errors only; the background never varies.
- Text `--color-on-surface`, description `--color-on-surface-variant`. **Error is the single exception:** title, description and icon all use `--color-error`. Success, warning and info icons stay `--color-on-surface-variant` — the `-text` variants of the success/warning tokens (§2.5) are deliberately *not* used here, which is where Toast diverges from Alert (§6 Alerts tints those two states' wording; Toast does not).
- Icons: `success` → check, `warning` → exclamation, `info` → i, `error` → cross.
- Implemented with sonner's `toast.custom` through `platform/src/components/ui/toast.tsx`, **not** sonner's `richColors` — a custom toast carries `data-styled=false`, so none of the library's own card styling applies and these tokens can be used directly. See `tailwind.md` §7. The earlier "branded solid fill per type" spec was always flagged in this entry as a per-project choice to confirm with the client; this records the answer, which was neither branded fills nor sonner's defaults.

**Dropdown / selection menus**

- **Menu items span the full width of the menu — the list carries no inset padding.** A
  highlighted item's fill must reach both edges, because a highlight that stops a few pixels short
  reads as a different component from a menu whose highlight does not, and the two sit side by side
  in the same app. Anything pinned above the list (a search field, a select-all row) is full width
  too, separated by a hairline rather than floated inside a margin.
- Menu surface `--color-surface`, radius `--radius-md`, hairline `--color-card-border`. Item
  highlight `--color-accent`; a selected item's check sits at the trailing edge. The same in every
  menu surface — `Select`, `Combobox`, row actions, context menus — so a check mark never moves
  between two menus that look alike.
- Dropdown/selection menus are the third permitted use of `--elevation-3`, alongside modals and
  popovers.

**When a list needs filtering**

- Short, fixed list → `Select`. Long enough that scrolling stops being reasonable → `Combobox`,
  which is the same menu with a search field. Several values at once → `MultiSelect`.
- **A filterable menu puts its search field at the top of the popup, never inline in the trigger.**
  The trigger stays a fixed-height summary. The consequence is deliberate: an inline wrapping
  tag-field — chips reflowing inside the field with the text cursor beside them — is not a shape
  this system has, because a trigger whose height grows with the selection leaves nowhere for an
  overflow count to go.

**Multi-select trigger summary**, in this order:

1. Nothing selected → the placeholder.
2. Every option selected → **one** `All` chip, not N chips.
3. Otherwise → up to `maxChips` chips (default **3**), then `+N more` as plain text.

`All` and `+N more` are summaries rather than values, so **neither carries a remove control** —
"remove all" is ambiguous, and `+N more` is a count. The individual chips do carry one. That
asymmetry is intentional; `Clear all` in the popup is the unambiguous whole-selection action.

**Select all, in a filterable multi-select**

- One pinned control adjacent to the search field — adjacent because that is where its *scope* is
  decided; a footer would put it as far as possible from the query that scopes it.
- It acts on the **currently filtered** options and **names that count** when a query is active
  (`Select 7 matching`, not `Select all`). A control that silently touches options the user cannot
  see is the failure mode this rule exists to prevent.

### Navigation — top bar

Single horizontal bar, left-to-right structure: **home icon → divider → menu items → (flex space) → account menu**.

- Container: a **floating bar** — a `--color-surface` card inset from the viewport edges, not a full-width band. The gutter around it uses the same page-edge padding as §7 (16px horizontal below `sm`, 24px at `sm` and above, 16px top and bottom), is filled with `--color-background`, and the card's content is capped at `--container-max` so the bar's edges line up with the page content beneath it. Radius `--radius-lg`; 1px `--color-card-border` edge; **no shadow** — the background gutter is what separates the bar from content scrolling under it. Horizontal padding inside the card matches the gutter.
  - The bar is sticky: the gutter belongs to the sticky element as padding, not to the card as a margin, or the gap disappears the moment the page scrolls. The gutter's fill must be opaque for the same reason.
- Home icon: leftmost element, rendered in `--color-primary`. Links to the app's landing/home page. Icon only, no label. Its glyph is configurable per portal (`app.homeIcon` in `public/config/app.json`) rather than fixed by the framework.
- Divider: 1px vertical line, `--color-card-border`, height matched to the icon row, positioned immediately after the home icon to separate it from the menu items.
- Menu items: icon + text label, gap `--space-2` (8px) between icon and label, gap `--space-6` (24px) between items.
  - **Mobile**: labels hidden — icon only. If the item opens a dropdown, the dropdown panel must show the item's title as a non-interactive header at the top of the list, since the trigger itself no longer carries a text label to give that context.
  - Each item either navigates directly to a page on click, or opens a dropdown menu — never both. A chevron indicator distinguishes dropdown items from direct-navigation items.
  - Every clickable element in the bar shows a pointer cursor. Not automatic: Tailwind's preflight gives `<button>` `cursor: default`, and the dropdown-item primitive sets `cursor-default` explicitly, so triggers and menu items both need it stated.
  - A **single-screen module** — one that navigates directly instead of opening a dropdown — takes the same hover treatment as a dropdown trigger. It sits at the same level of the nav, so it should not read as a different affordance merely because it skips the popup. It keeps its icon, like any other item at that level.
  - A dropdown *trigger* takes no background on hover or while open — its text goes `--color-primary` instead. Items *inside* a nav dropdown carry no icon (the icon belongs to the module-level trigger) and highlight on `--color-muted`. That last part is a deliberate local deviation: every other menu surface in the system (row actions, `Select`, context menus) highlights on `--color-accent`, and `--color-highlight` is the token nominally reserved for hover/selection. If nav and the rest of the app should converge, this is the line to change.
- Account menu: rightmost element, pinned to the far right. Pill-shaped button (`--radius-full`), background `--seed-secondary` (`#000000`), white text, showing the logged-in user's name + chevron. Opens a dropdown for profile management, logout, and other personal settings. This is the one place in the system a button uses `--radius-full` instead of the standard `--radius-sm` — it's a deliberate exception for this specific pattern, not a precedent for other buttons.

### Scrollbars

Applies to every scrolling surface, not just the page: dialogs, sheets, popovers, table bodies, any `overflow-y-auto` region.

- Thin gutter with **no stepper arrows** at either end, and the thumb fills the gutter rather than floating inside a wider track.
- Thumb `--color-border-dark`; track **transparent**, so nothing is painted at rest except the thumb.
- Specified with the standard `scrollbar-width` / `scrollbar-color` properties, never `::-webkit-scrollbar`. The two are mutually exclusive rather than complementary — where both are present the standard properties win and the pseudo-elements are ignored entirely — and only the standard ones work outside Chromium. The cost is that exact pixel widths, thumb radius and thumb hover states are not expressible; if one of those ever becomes a requirement, it is a deliberate trade against cross-browser support, not an addition.

*(Add rows for any other core components not yet defined: tooltips, etc.)*

---

## 7. Composition Patterns

How components combine into page layouts. Section 6 defines what each component looks like in isolation; this section governs how they're arranged together. These are defaults, not rigid constraints — deviate when a page's content genuinely needs a different structure, but stay inside a component's own spec (§6) when you do.

**Page structure**
- Max content width: `1280px` (`--container-max`). Owned **once**, by the route-level layout
  (`PageLayout`'s inner wrapper) — templates and pages never set their own page width, they fill
  what the layout allows. A template may cap itself *narrower* when that is an arrangement or
  readability decision (a focused form stays ~672px per §3's line-length rule), but never restates
  the page width.
- Breakpoints: `sm: 640px, md: 768px, lg: 1024px, xl: 1280px`
- Grid: 12-column, `--space-6` gutters on desktop, `--space-4` on mobile
- Page edge padding (top/bottom and left/right of the scrollable content area): `--space-4`/16px
  horizontal and `--space-6`/24px vertical below `sm`, stepping up to `--space-6`/24px horizontal
  and `--space-8`/32px vertical at `sm` and above. Owned **once**, by the route-level layout
  (`PageLayout`'s `<main>`) — templates and pages never add their own outer edge padding on top of
  it. Spacing *within* a page (header-to-card gap, section spacing) is still each template's or
  page's own concern.

**Spacing between content clusters**
- Sections (major page divisions): padding `--space-6` (24px)
- Groups (clusters of related components, general case): gap `--space-6` (24px)
- Selection control groups specifically (§6 Selection controls): `--space-6` (24px) gap when laid out horizontally, `--space-3` (12px) when stacked vertically — tighter vertically since stacked options read as one continuous list rather than separate clusters

**Row alignment**
- Any row mixing inputs, buttons, and/or selection controls: all elements vertically centered against each other. Inputs and buttons share the same 40px height specifically so they align cleanly in a shared row (§6 Buttons, Forms).
- Labels are vertically centered against their control, never top- or baseline-aligned only.

**Action button placement**
- Forms, side sheets, and modals all place their primary action button bottom-right of the container, with any secondary action (Cancel/Reset) immediately to its left.
- This is a fixed convention across all container types (§6 Container types) — don't vary placement per screen.

**Screen-level structure**
- Every screen: header, then a one-line explanatory subtitle (`--type-subtitle`), then content. See §8 Screen-level explanatory text for the copy rule this pairs with.

**Choosing a container**
- Creating new data → in-page form. Editing existing data, or any form → **either a side sheet or a
  modal**. Confirming/warning → modal. Informing/hinting → popover. Full decision criteria: §6
  Container types.
- The side-sheet-vs-modal choice is the one container decision that is **asked, not assumed**: a
  build agent clarifies it with the user rather than picking. The standing default, offered as the
  pre-selected answer, is a **side sheet for anything opened from a datatable** (row, bulk or
  toolbar action) so the list stays visible behind it. That default covers form/edit actions only —
  destructive confirmations remain modals regardless.

**General constraints**
- No overlapping elements.
- No absolute/fixed positioning outside of overlay containers (side sheets, modals, popovers/dropdowns — §6 Container types), which require it by definition.
- Icons never render outside their parent container. Labels never overlap their control.

---

## 8. Voice & Content Rules

### Screen-level explanatory text
- A screen header may be followed by a one-line description — the `--type-subtitle` style (§3), directly under the header. It is **available and optional, and usually omitted**: reach for it only when the title alone doesn't convey what the screen is for.
  - Example where it earns its place: "My Leave Dashboard" → *"Track your leave balances and review your request history."*
  - A self-evident title ("Manage Users") needs nothing under it. Don't add a subtitle that only restates the title.
- When you do write one, favor plain, concrete descriptions over vague ones: describe what the user can *do* here, not just what the screen *is*. "Manage your team's access and permissions" beats "Team settings overview."

### Forms and actions
- Every form or user-initiated action needs enough on-screen instruction that the user doesn't have to guess what's required or what will happen.
  - Add a short instruction line above or alongside any form that isn't self-explanatory from labels alone (what happens after submitting, what's required vs. optional, formatting expectations).
  - For destructive or hard-to-reverse actions (delete, cancel, approve/reject), state the consequence in the UI, not just in a confirmation dialog.
  - Required fields must be marked; non-obvious formats or constraints (date format, file size limit, character count) should be stated near the field, not just enforced silently on submit.
- Buttons: sentence case, action verbs — "Save changes" not "Submit"
- Errors: plain language, no blame — "Something went wrong" not "You entered invalid data"
- Empty states: always include a next action, not just "No data"
- Terminology glossary:

| Use this | Not this |
|---|---|
| Workspace | Project |
| Member | User |
| Sign in | Log in |
