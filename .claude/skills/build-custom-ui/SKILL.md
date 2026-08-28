---
name: build-custom-ui
description: >
  Use this skill when building UI the framework didn't anticipate — a one-off
  widget, a novel page section, a layout no template covers. Triggers: "build a
  custom X", "this doesn't fit any template", "we need something specific for
  this page", "there's no component for this". Use it BEFORE writing markup, not
  after. For a reusable component destined for platform/src/components/ui/, use
  add-ui-component instead; for a whole page, use plan-new-page.
applies_to:
  - custom UI
  - one-off components
  - novel page sections
  - anything no template or component covers
---

# Skill: Build Custom UI

Read this entire file before writing any markup.

## Why this skill exists

Reuse guarantees consistency only for work the framework anticipated. Novel work is
different: with no component to copy, an LLM falls back on its training prior — and
in that prior `bg-blue-500`, `text-gray-700`, `p-[13px]` and `#fff` are **far more
probable** than `bg-primary`, `text-muted-foreground` and the 4px scale. This
repo's tokens are the *low-probability* choice.

So novel UI is simultaneously the least-governed path and the one where your
instincts pull hardest away from DESIGN.md. This skill exists to counteract that
specific pull.

---

## Step 1 — Establish it should be custom at all

Most "we need something custom" turns out to be an existing thing. Check, in order:

1. **`docs/architecture/inventory.md`** — does a component or template already do
   this? It lists every UI component, template registry entry and page.
2. **A template** (`platform/src/templates/registry.ts`) — is this really a page frame that
   already exists? Apply the hole test from `docs/architecture/templates.md`: if it
   has the same set of holes as an existing template, it is that template at a
   different `options` value, not something new. Templates are named by arrangement,
   so match on holes, not on what the page is for.
3. **A composed component** — `DataTable`, `FilterSheet`, `ConfirmDialog`,
   `PageContentHeader`, `EmptyState`, `DatePicker` cover most page furniture.
4. **A primitive plus composition** — before inventing a widget, check whether
   two or three primitives arranged together get there. `/sample/component-library`
   shows every one rendered live.

Only build custom once all four come back no. Say out loud which one you checked
and why it didn't fit — that sentence is what stops the next session rebuilding
the same thing.

---

### Card layouts are almost never custom

Before hand-rolling any card-shaped thing, check whether `card.tsx`'s parts already do it — they
cover more than they look like they do:

| You were about to build | Use instead |
| --- | --- |
| a flex row for `[icon] [title + text] [chevron]` | `CardMedia` + `CardTitle`/`CardDescription` + `CardAction` — `CardHeader` derives the 3-column grid itself |
| a top-right button or status chip in a card | `CardAction` |
| a divider + button row at the bottom | `CardFooter className="border-t justify-end"` |
| a tighter card | `className="[--card-spacing:--spacing(4)]"` |
| an image-topped card | an `<img>` as `Card`'s first child |

See `.claude/rules/components-rules.md` § Cards. Writing `grid-cols-*` on a `CardHeader` is a
reliable sign the wrong tool is being used.

## Step 2 — Read the legal vocabulary before writing a class name

**`docs/architecture/inventory.md` § Design tokens** is generated from
`src/index.css` and lists every legal colour token plus the spacing scale. Read it
rather than recalling it; it is short, and it is the source of truth.

Hard constraints, all machine-enforced (`npm run lint` **errors**, it does not warn):

| Constraint | Rule |
| --- | --- |
| Colours | Semantic tokens only. No hex, no `rgb()`/`hsl()` arbitrary values, no Tailwind palette class (`bg-blue-500`), no bare `bg-white`/`text-black` |
| Spacing/sizing | The 4px scale — `1 2 3 4 6 8 12 16` = 4/8/12/16/24/32/48/64px. An arbitrary value is fine only if it lands on the scale (`max-h-[300px]` passes, `mt-[7px]` errors) |
| Inline style | Banned. Need a genuinely dynamic length? Set a CSS custom property and use Tailwind v4's var shorthand — `w-(--my-width)` |
| Links | No bare `<a href>`. Use `<Button render={<Link to={…}/>} nativeButton={false} variant="link">` — see components-rules.md's Button usage section |

Not machine-enforced, so they are on you:

- **Radius** — `rounded-sm` buttons/inputs/chips · `rounded-md` cards · `rounded-lg`
  modals/sheets · `rounded-full` avatars/pills/switches (DESIGN.md §5)
- **Shadow** — none, except dropdowns/modals/popovers. Use `border` instead
  (DESIGN.md §6)
- **Typography** — `font-sans` is the default body face; `font-heading` is applied
  explicitly on headings, never automatically (DESIGN.md §3)
- **Icons** — `react-icons/pi` only, `size-4` default, `size-5` standalone
- **Container type** — creating data → in-page form · editing → side `Sheet` ·
  confirming → `ConfirmDialog` · informing → `Popover` (DESIGN.md §6)
- **No animation or transition on data-heavy views**

---

## Step 3 — Build it in the right place

| It will be used by | Put it in |
| --- | --- |
| Exactly one page | `src/components/<PageName>/` |
| More than one page | `platform/src/components/ui/` — stop and use `add-ui-component` instead |
| It's the page's frame | A template — stop and use `add-page-template` instead |

Named exports only, no `export default`, always accept a `className` prop, and no
data fetching inside the component — the page fetches and passes props
(`.claude/rules/components-rules.md`).

---

## Step 4 — Verify, including the part lint cannot see

```bash
npm run lint && npm run typecheck
```

Lint catches **vocabulary** violations — a wrong colour, an off-scale number. It
structurally cannot see **composition**: three competing heading sizes, inconsistent
internal padding, a cluttered arrangement, a card that doesn't look like the other
cards. A clean lint is necessary and not sufficient.

So look at it:

1. `preview_start {name:"dev"}`, navigate to the page. Behind `ProtectedRoute`? Set
   `VITE_DEV_AUTH=true` in `.env.local` (restart the dev server) — see
   `docs/architecture/auth.md` § Dev auth bypass
2. Compare side by side against an existing page of the same kind — does the
   spacing rhythm match? Do headings sit at the same size? Does it read as the same
   product?
3. `resize_window {preset:"mobile"}` (375px) — confirm
   `document.body.scrollWidth === document.body.clientWidth`. Horizontal overflow
   is the most common defect in novel layouts
4. `resize_window {colorScheme:"dark"}` — the theme is class-driven, so flip it
   with `localStorage.setItem('vite-ui-theme','dark')` and reload;
   `prefers-color-scheme` alone won't do it. Hardcoded colours are invisible in
   light mode and obvious here
5. Screenshot it. If the Browser pane isn't displayed, screenshots fail silently —
   say so rather than implying a visual check happened

---

## Step 5 — Promote or leave it

If a second page starts wanting this component, **move it to
`platform/src/components/ui/` via `add-ui-component`** rather than importing across page
folders. A page-scoped component imported by two pages is the shape drift takes.

If it turns out to be a page *frame* others will want, it belongs in
`platform/src/templates/` via `add-page-template`.

---

## What NOT to do

- Do not invent a colour, a shadow, or a spacing value — if DESIGN.md lacks the
  role you need, that's a `plan-design` conversation, not a local decision
- Do not reach for `style={{}}` to escape the lint rule — set a CSS custom
  property and consume it with `w-(--x)`
- Do not add an `eslint-disable` for the token rules. If you believe a violation is
  genuinely justified, stop and say why; a sanctioned exception gets a named entry
  in `eslint.config.js`'s `ignores`, the way the three existing ones do
- Do not build custom before Step 1 comes back no on all four checks
- Do not claim a visual check you couldn't perform
