---
paths:
  - src/components/**
  - platform/src/components/**
---

# Rules: components (`platform/src/components/ui/` framework-owned, `src/components/<PageName>/` app-owned)

## ui/ — the shared component library, framework-owned

`platform/src/components/ui/` holds both shadcn-derived primitives (kebab-case, e.g. `button.tsx`,
`select.tsx`) and custom/composed components (PascalCase, e.g. `DatePicker.tsx`, `EmptyState.tsx`)
— one folder, edited directly. shadcn-generated code is only the initial scaffold; there is no
"never modify" primitives tier anymore.

- Components here must be used in more than one page to justify living here
- Named exports only — no `export default`
- Always accept a `className` prop for caller overrides
- Must work in both light and dark mode
- Use shadcn CSS variables — never hardcode colors or spacing
- Use only the semantic tokens (`--primary`, `--accent`, etc.) — never the raw `--primary-50`…`--primary-950` / `--neutral-50`…`--neutral-950` tonal ramps in `theme.css`, which exist for future token derivation only (see `index-css-rules.md`)
- No data fetching inside ui/ components — accept data as props

**If you are building an app from this skeleton (not developing the skeleton itself):** never
modify files in `platform/src/components/ui/` (`npm run framework:verify` rejects the edit), and
never import Base UI directly into a page/feature component — only through
`platform/src/components/ui/` (`@framework/components/ui/...`).

## <PageName>/ — page-scoped components

- Components here are used by exactly one page
- Named exports only — no `export default`
- No data fetching — page component fetches and passes data as props
- If a component starts being used by a second page, move it to ui/

<!--  -->

## Button usage

- `Button` (`platform/src/components/ui/button.tsx`) has a built-in `isLoading` prop — preserves width,
  replaces the label (and any icon) with a centered spinner
- Icons go through the `startIcon`/`endIcon` props (`<Button startIcon={<Plus className="size-4" />}>Add record</Button>`)
  — never as raw children alongside the label. `Button`'s internal layout only establishes a flex
  row inside its own label-wrapping span; a bare icon element as a direct child render on its own
  line instead of inline with the text
- One primary Button per view only
- Destructive Button always inside AlertDialog, never standalone
- Label copy: sentence case, action verbs — "Save changes" not "Submit" (DESIGN.md §8)
- **A link is a `Button` rendered as a router `Link`, not a bare `<a>` tag:**
  `<Button render={<Link to={…} />} nativeButton={false} variant="link">Label</Button>`.
  `nativeButton={false}` is required whenever `render` isn't a real `<button>`, or Base UI logs a
  console warning. Pass a different variant when the link is a CTA or nav affordance rather than
  prose — `TemplateGallery.tsx`'s `variant="outline"` card CTA is the reference exception.
  `Button`'s own `defaultVariants` stays `"default"`; this is a convention for authoring links, not
  a behaviour change in the primitive. Enforced by the `local/no-raw-anchor` ESLint rule outside
  `platform/src/components/ui/**`, which implements the pattern rather than consuming it. Two things stay
  legal bare: a same-page hash-scroll anchor (`href="#section"` — no route to navigate, so a plain
  `<a>` is correct and `Link` would add nothing), and a bare `<Link>` around non-text content
  (e.g. a whole `Card`), which isn't a link in the prose sense either.

## Empty states

- Use `EmptyState` (`platform/src/components/ui/EmptyState.tsx`) — don't hand-roll this pattern inline
- No card border or table chrome wrapping empty state
- Icon (size-10 text-muted-foreground) → heading (text-base font-medium)
  → subtext (text-sm text-muted-foreground) → optional CTA
- Include the CTA whenever a real next action exists — don't leave a bare icon+heading if there's
  something the user could do next (DESIGN.md §8)
- Copy is factual ("No results found") — not conversational

## Data tables

- Use `DataTable` (`platform/src/components/ui/datatable/DataTable.tsx`) — it owns the toolbar, table and
  pagination as one unit. Columns are plain data (`DataTableColumn<T>` in `platform/src/types/table.ts`)
- **Never import `@tanstack/react-table` outside `platform/src/components/ui/datatable/`** — ESLint enforces
  it. See `docs/architecture/datatable.md` for why that seam exists
- Table state comes from `useTableState` (`platform/src/hooks/useTableState.ts`) — never hand-rolled, and
  never reset the page number at the call site; the hook already does it
- Zebra striping is **on by default** — DESIGN.md § Tables makes it the primary row separator. Pass
  `striped={false}` to opt out; don't add per-page row-background classes on top
- Row hover and selection use `bg-highlight`, not `bg-muted` — `bg-muted` stays reserved for
  zebra striping so the two never look the same
- Destructive row and bulk actions go through `ConfirmDialog`, never a bare button
- **A scope is not a filter.** Required, always-visible toolbar selectors that decide *which
  dataset* is shown use `state.scope`/`setScope`; optional refinements *within* it use `filters` and
  a `FilterSheet`. Never put an optional filter inline as well as in the sheet, and **ask** which
  shape a page wants rather than picking
- Bulk actions live in `rightSlot`; whether they appear on selection or stay visible and disabled at
  zero is the page's call, not DataTable's
- **Rows expand for read-only detail the row already carries** (`renderExpanded`) — editing,
  actions, or anything that has to fetch belong in a side sheet. Pass `canExpand` whenever the
  detail can be absent, so a chevron never opens an empty panel, and **ask** whether one row or
  several may be open at once (`expandMode`) rather than assuming
- **Data is edited in the edit form, never inline in a cell — the `renderExpanded` rule above is one
  instance of this wider one, not a special case of it.** No `Select`, `Input`, `Checkbox`, or other
  data-entry control inside a column's `accessor` or `renderExpanded`; `local/no-inline-edit-in-column`
  enforces it. The one exception is a row-level `Switch` (enable/disable, active/inactive, or
  similar) that calls the API immediately — DESIGN.md § Tables and § Selection controls define a
  Switch as exactly the immediate-effect control that needs no Save step, which is why it alone is
  exempt. Call the mutation hook in the *page*, above the columns definition, and close the handler
  over it into the accessor — the accessor itself stays a pure function of the row
  (`platform/src/samples/samples/ScopedListPage.tsx` is the reference)
- **Numeric columns declare `numeric: { decimals, prefix?, suffix?, grouping? }`** on the column —
  never a pre-formatted string returned from `accessor`. The accessor's return value doubles as the
  sort key and the client-mode search value, so a formatted string like `"SGD 412.00"` sorts and
  matches wrong (`docs/architecture/datatable.md`). `decimals` has no default — 0 for counts, 2 for
  money, 4 for rates — because a silently-wrong precision is exactly the guess this field exists to
  remove. `prefix`/`suffix` render in their own muted gutter pinned to the cell's edge, not
  concatenated onto the digits — `DataTable` handles that automatically, so don't hand-roll a
  gutter or re-add the symbol inside `accessor`
- **A column's width is auto by default.** Give it a fixed pixel `width` only when a page genuinely
  needs one — it switches the whole table to a fixed layout, so declared widths hold exactly and
  overflowing content truncates with an ellipsis instead of wrapping or forcing the column wider
  (pass `wrap` if growing is what you actually want). `className` (a Tailwind width class, e.g.
  `"w-24"`) still works for a value that's fine on the 4px scale; `width` is for an exact pixel
  value. A table wider than its container already scrolls horizontally on its own — never wrap a
  `DataTable` in your own `overflow-x-auto`
- **Status columns declare `badge: { variants, fallback? }`** — never a hand-rolled `<Badge>` in the
  accessor and never plain text. `platform/src/lib/constants/status.ts` exports `STATUS_VARIANTS`, a
  conventional mapping to spread or borrow from; it is not applied automatically, so an unmapped
  status is a decision the column author made, not an oversight. **Ask, don't assume, which field
  supplies the label and which one decides the variant** — they are the same field on most rows, but
  not always (a `status` code might drive the variant while a separate `statusLabel` supplies the
  display text)

## Confirmations

- Use `ConfirmDialog` (`platform/src/components/ui/ConfirmDialog.tsx`) — don't hand-roll `AlertDialog`
- Its `description` states the consequence ("This removes 3 records permanently"), not just
  "Are you sure?" (DESIGN.md §8)
- Its buttons render bottom-right, Cancel immediately left of the confirming action — DESIGN.md
  §7's action placement covers modals too, and says not to vary it per screen

## Unsaved changes

- A form inside a `Dialog` or `Sheet` uses `useUnsavedChangesGuard`
  (`platform/src/hooks/useUnsavedChangesGuard.ts`) — every dismissal route those containers offer
  (backdrop, Esc, the X, a Cancel in `DialogClose`) throws the input away without asking
- Render `UnsavedChangesDialog` for the prompt; don't hand-roll the confirmation or retype the copy
- The same hook call also guards route navigation away from the page, so one call covers both
- `local/require-unsaved-guard` enforces this and a PostToolUse hook flags it while you write. If
  losing the input genuinely doesn't matter (a draft-then-apply filter panel), silence it with an
  `eslint-disable-next-line` so the exception is visible rather than implicit

## Skeleton loaders

- Always at component level — never full-page spinner
- Preserve column widths in tables, keep header visible — `TableSkeleton`
  (`platform/src/components/ui/datatable/TableSkeleton.tsx`) renders rows *inside* the real `<TableBody>`,
  which is what keeps both

## Cards

`card.tsx` exports seven parts. Compose from them — the layout is already solved, and hand-rolling
a flex/grid row inside a card is how it drifts.

| Part | Use it for |
| --- | --- |
| `Card` | the surface. `rounded-md` (8px) per DESIGN.md §6 — `rounded-lg` is the modal radius, not cards |
| `CardHeader` | wraps title/description/media/action. **Never put grid classes on it** — see below |
| `CardTitle` / `CardDescription` | the text pair |
| `CardMedia` | leading icon, left of the text. Rounded `bg-muted` square, spans both header rows |
| `CardAction` | top-right slot — an icon button, a `Badge`, a chevron |
| `CardContent` | body |
| `CardFooter` | actions or metadata below the content |

**`CardHeader` derives its own column count** from the slots inside it: `[1fr auto]` with a
`CardAction`, `[auto 1fr]` with a `CardMedia`, `[auto 1fr auto]` with both. Adding your own
`grid-cols-*` fights it, and `CardAction` re-places itself to column 3 when media is present — so
the `[icon] [title + description] [chevron]` row needs no layout classes at all.

**`CardFooter` has no `justify` default**, unlike the Dialog/AlertDialog/Sheet footers:

- actions → `className="justify-end gap-2"` (DESIGN.md §7 puts the primary action bottom-right)
- metadata, a timestamp, one link → no class; left is correct
- both → `justify-between`
- `border-t` adds the divider **and** its 16px spacing on both sides; omit it for a footer that
  should read as part of the body

**A clickable card is the whole `Card` wrapped in a router `Link`** — legal per the Button rules
above (a bare `<Link>` around non-text content). It picks up DESIGN.md §5's `--elevation-2` hover
edge automatically because `Card` carries `[a:hover>&]:ring-elevation-2`; don't add a hover class,
and don't put a `<Button>` inside a card that is itself the click target.

**Ask, don't assume, when the spec doesn't say whether the card is the click target.** "Card opens
the record" and "card has a View button" are different components, different a11y, and only one of
them can also hold a footer action. If a page spec lists cards without saying, confirm it rather
than picking — it is cheap to ask and expensive to redo.

- Never nest cards inside cards (`Subsection`-style helpers that wrap children in a `Card` are why
  the Primitives Cards section renders `bare`)
- `--card-spacing` is component-local, declared on `Card` itself, not a design token: one
  `className="[--card-spacing:--spacing(4)]"` rescales that card's padding and gaps together
- An `<img>` as `Card`'s **first** child drops the top padding and picks up the top radius — that is
  the media-card pattern, no extra classes
- No shadow, ever, at any state (DESIGN.md §6 — cards are border-only)
- Muted section: bg-muted/40 rounded-md — no border, no shadow

## Side sheets

- `Sheet` has **no border radius on any corner**. Cards are `rounded-md` and dialogs are
  `rounded-lg`, but a sheet is anchored to a viewport edge rather than floating in the middle of
  one, so a rounded leading edge reads as a card that has slid off-screen. Don't add one back
- What actually goes in one: a form — most often an edit form opened from a datatable row — or a
  set of filters. For filters use `FilterSheet` (`platform/src/components/ui/FilterSheet.tsx`), which
  owns the trigger, the count badge and the Clear all / Apply footer; don't hand-roll that shape
- Footer actions bottom-right, Cancel immediately left of the confirming action, same as every
  other container (DESIGN.md §7). `SheetFooter` already does this — don't add `justify-*`
- A form inside one needs `useUnsavedChangesGuard` (see Unsaved changes above)

## Forms

- Required field marker: \* suffix on label in text-destructive — never in placeholder
- Helper text and error message never shown simultaneously
- Form actions: right-aligned, Cancel left of Submit
- Validation errors inline on field — never in a toast
- Field resting-state border is `border-border-dark` (`Input`/`Textarea`/`Select`/`InputGroup`/
  `Calendar`) — a deliberately more visible edge than the hairline `border-border` used for card
  edges and dividers
- Disabled field text/background is a flat replacement (`bg-muted`/`border-border`/
  `text-disabled-text`), never reduced opacity — same principle as Buttons' Disabled treatment
  (DESIGN.md §6), extended to fields

## Selects and multi-selects

**Picking one:**

- Short, fixed list, no typing needed → `Select`
- Long enough that scrolling stops being reasonable → compose the `Combobox*` parts. There is no
  `SearchableSelect` wrapper on purpose: with no chip overflow and no "All" state there is no logic
  to own, so a page composes the parts the same way it composes
  `Select`/`SelectTrigger`/`SelectItem` today
- Several values at once → `MultiSelect`

**Never reimplement the chip / `All` / `+N more` summary.** It lives in `MultiSelect` for the same
reason `FilterSheet` owns its Clear all / Apply footer. If a page needs a variation, add a prop.

- `MultiSelect` is controlled — `string[]` in, `string[]` out. Bind with react-hook-form's
  `Controller`; there is deliberately no uncontrolled mode
- **All three triggers default to `Input`'s shape** — 40px tall, 12px padding, filling their
  container (DESIGN.md §6 Forms) — and share two named scales. Use them instead of reaching for
  `className`:
  - `size`: `default` 40px · `md` 36px (the DataTable toolbar band, matching Searchbar and
    RefreshButton). `Select` additionally has a 32px `sm`, which the searchable select and
    `MultiSelect` deliberately do not — **there is no size scale in this field vocabulary yet.**
    `Input` and `Textarea` have no sizes at all, so don't introduce one for a single component;
    if sizes are needed, add them across every field component in one change
  - `width`: `full` (default) · `lg` 320 · `md` 224 · `sm` 160 · `xs` 96
  A `className` still wins over either, because both resolve through `cn()`. **If you add another
  styling dimension to one of these triggers, do the same — never a `data-[…]:` variant.** A
  `data-*` variant compiles to `.cls[data-size="x"]`, which beats a caller's plain `.h-8` on
  specificity, so the override silently loses. That is how `Pagination`'s page-size picker spent
  its whole life ignoring the `h-8` it asked for
- **Label a `Combobox` or `MultiSelect` with `ComboboxFieldLabel` / `MultiSelect`'s `label` prop —
  never `FieldLabel htmlFor`.** The trigger is a `<div role="combobox">`, and `htmlFor` cannot
  associate with a div. This is the one place the `Field` vocabulary in `docs/architecture/ui.md`
  does not reach: inside a `Field`, use the component's own `label` and omit `FieldLabel`, or pass
  `aria-labelledby` pointing at a label you render yourself. The control still needs its own
  `aria-invalid`
- The search field goes at the top of the popup, never inline in the trigger (DESIGN.md § Dropdown /
  selection menus). The trigger stays one fixed height whatever is selected
- A chip inside a clickable container is never removable unless its remove button stops
  propagation — and it must stop **`mousedown`**, not just `click`, because Base UI's combobox
  trigger opens on mousedown. `chip.tsx` already does this; don't rebuild a chip without it

**Option lists are fetched whole — never paginated, never server-searched.** Filtering is
client-side, so the component has to hold every option. Concretely:

- Up to ~200 options: fine, don't think about it
- 200–1,000: acceptable, but check the query isn't quietly growing without a bound
- **Above ~1,000 these components are the wrong choice.** That is a thousand un-virtualized DOM
  nodes plus a full-list fetch on every mount. Base UI's `virtualized` prop on `Combobox.Root` is
  only a *flag* announcing that items are being **externally** virtualized — it supplies no
  virtualizer — so this route means adding one, and neither it nor external filtering is exposed by
  this wrapper. The honest alternatives are extending the wrapper or picking a different affordance
  (a `DataTable`-backed picker in a side sheet). Don't quietly ship a 5,000-row select

## Confirmation pages

What a form shows after a successful submit, when a toast is not enough — a public form especially,
where the submitter has no app around them to go back to.

- Use `ConfirmationPanel` (`platform/src/components/ui/ConfirmationPanel.tsx`) — badge, title,
  description, optional fine print, body, actions, plus `above`/`below` slots. Don't hand-roll the
  tick and the heading stack
- A summary of what was recorded goes in `InfoTable`
  (`platform/src/components/ui/InfoTable.tsx`), not a hand-rolled row of `justify-between` divs
- The description says **what happens next**. The badge and the title already said it worked, so a
  description that only says "submitted successfully" is a wasted line
- The success tick is `--color-success`, never `--color-primary` — even if a mock shows the accent.
  See DESIGN.md § Confirmation pages

**Two things must be confirmed with the user, not chosen for them.** Both are cheap to ask and
expensive to redo, and neither is knowable from the form:

1. **Where each action goes.** A confirmation often carries two controls (a primary "Done" and a
   quieter "Back to home"). Whether they lead to the same place, different places, or whether the
   page needs only one, is a flow decision. **Two controls with one destination is a smell** — if
   that is genuinely what is wanted, say so out loud and get it confirmed rather than shipping it by
   default. The samples ship that way only because a preview has nowhere to navigate
2. **Which rows the summary shows.** Propose a set and confirm it. **Do not assume it is the
   submitted fields** — a reference id, a status and a submitted-at timestamp are all generated
   server-side, and are usually the rows the reader actually came for. Equally, a submitted field
   is not automatically worth echoing back

If you are building unattended from a unit spec, these belong in the spec already — see
`.claude/skills/spec-page/SKILL.md` Rounds 2 and 3.

## Toasts

- **Import `toast` from `@framework/components/ui/toast` — never from `sonner`.**
  `local/no-direct-toast` errors on the direct import. Only `toast.tsx` and `sonner.tsx` may
  import the library
- Same call shape as sonner's, so nothing else changes: `toast.success(message)`,
  `toast.error(message, { description })`, plus `warning`/`info`. Always use the typed method —
  the type drives the icon and, for errors, the text colour
- `duration` and `closeButton` are supported; pair them (`duration: Infinity` + `closeButton`) for
  a notice that must be dismissed rather than timing out
- Styling lives in `toast.tsx` — never per-call-site colour classes. The toast surface never
  changes colour by type (DESIGN.md §6); the icon carries the type, and only errors colour their
  text. `sonner.tsx` is just the container: no `richColors`, no `icons` map — a custom toast sets
  `data-styled=false`, so neither would do anything. See `tailwind.md` §7
- Form validation errors are never toasts (see Forms above) — toast is for success confirmations
  and network/request failures per `CLAUDE.md`'s UX Principles
