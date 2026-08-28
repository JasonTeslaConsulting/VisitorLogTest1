# Shared UI components — always import, never recreate

`platform/src/components/ui/` is a single merged folder: shadcn-derived primitives (kebab-case) and
custom/composed components (PascalCase) together, no more `shadcn-ui/` split and no more
`App`-prefixed wrappers — customizations are edited directly into the primitive file.

**Baseline:** primitives are generated from shadcn's `base-vega` style (`components.json`) on
`@base-ui/react` (not Radix), Tailwind v4, and React 19. Regenerating a component via
`npx shadcn add <name> --overwrite` resets it to pristine — DESIGN.md/bug-fix customizations
below (isLoading, radius overrides, `bg-input-background` fill, `activateOnFocus`, `closeOnClick`,
`SheetTitle`'s `text-lg` (matches `AlertDialogTitle`'s size — pristine shadcn leaves it unsized,
inheriting from context), the `control-disabled*` selection-control tokens, etc.) must be
reapplied by hand afterward.

- **DataTable** → `platform/src/components/ui/datatable/DataTable.tsx` — toolbar + table + pagination as one
  unit, built on TanStack Table v8. The **only** file allowed to import the table library; pages
  speak `DataTableColumn`/`TableSort`/`T[]` from `platform/src/types/table.ts` so a major upgrade stays a
  single-file change (`docs/architecture/datatable.md`)
- Pagination → `platform/src/components/ui/datatable/Pagination.tsx` (rendered by DataTable)
- SearchBar → `platform/src/components/ui/datatable/Searchbar.tsx` (controlled; debounce is internal)
- RefreshButton → `platform/src/components/ui/datatable/RefreshButton.tsx` — `showLabel` for icon-only
- FilterSheet → `platform/src/components/ui/FilterSheet.tsx` — trigger + count badge + side sheet with a
  Clear all / Apply footer. Not table-specific — usable anywhere a draft-then-apply filter panel is
  needed. Draft state comes from `useFilterDraft` (`platform/src/hooks/useFilterDraft.ts`), which
  `useTableState` composes for table pages
- TableSkeleton → `platform/src/components/ui/datatable/TableSkeleton.tsx` — rows for inside a real TableBody
- SortableHeader → `platform/src/components/ui/datatable/SortableHeader.tsx` — arrow indicator, no colour
- RowActionsCell → `platform/src/components/ui/datatable/RowActionsCell.tsx` — 1 action → icon, 2+ → ⋮ menu
- ConfirmDialog → `platform/src/components/ui/ConfirmDialog.tsx` — buttons bottom-right per DESIGN.md
  §7 (they were centred until the §7 rule was applied), destructive variant
- `useTableState` → `platform/src/hooks/useTableState.ts` — page/search/filters/sort, resets built in
- `Table` family (`platform/src/components/ui/table.tsx`) — zebra striping is the `striped` prop on
  `TableBody`, **on by default** (DESIGN.md § Tables makes it the primary row separator; pass
  `striped={false}` to opt out); row separation also comes from `border-b border-border`; row
  hover/selection use `bg-highlight`, not `bg-muted`
- DarkModeToggle → `platform/src/components/ui/DarkModeToggle.tsx`
- Field (`Field`/`FieldGroup`/`FieldLabel`/`FieldDescription`/`FieldError`/`FieldSet`/`FieldLegend`/
  `FieldSeparator`/`FieldContent`/`FieldTitle`) → `platform/src/components/ui/field.tsx`. **The form
  layout vocabulary** — a labelled control is a `Field`, a stack of them is a `FieldGroup`; never a
  bare `div` with `space-y-*`. Customized away from pristine on disabled state (flat
  `text-disabled-text`, not `opacity-50`) and `FieldGroup`'s gap (24px per DESIGN.md §7, not 28px);
  the file's header comment lists the divergences. Validation is `data-invalid` on the `Field` plus
  `aria-invalid` on the control — both, since neither covers the other. Replaced `form.tsx`, whose
  `Form`/`FormField`/`FormItem` family shipped in the first commit and was never imported by any
  file in the repo's history; forms now use react-hook-form's `Controller` directly for binding and
  `Field` for layout.
- DatePicker → `platform/src/components/ui/DatePicker.tsx`. Typed text + calendar popover; emits
  `yyyy-MM-dd`. Formats and parses **only** through `DateTimeUtils` — it used to call date-fns
  inline and hardcode `dd-MMM-yyyy`, which is why its display is now the canonical `dd MMM yyyy`.
- DateTimePicker → `platform/src/components/ui/DateTimePicker.tsx`. Two visible fields — a `Date`
  field that **is** the DatePicker above (composed, not reimplemented, so the calendar and the
  tolerant parsing behave identically in both) and a `Time` field beside it — sharing one
  `value`/`onChange`, so a form binds one control. Emits offset-aware ISO
  (`convertToDatetimeOffset`), because a datetime without an offset is one the server has to guess
  at; `withSeconds` (default off) switches minute/second precision. Changing either field preserves
  the other — the failure mode of a split picker is one half zeroing the other.
  Both halves are this repo's own components, so both are tokenised and both work the same way —
  type into the field or pick from the popover.
- TimePicker → `platform/src/components/ui/TimePicker.tsx`. Peer of DatePicker, same shape: typed
  text field plus a popover, here holding scrollable Hr/Min(/Sec) columns. Selected option is
  `bg-primary` (matching Calendar's selected day), hover is `bg-primary-hover`. Stores 24-hour
  `HH:mm:ss` always; `withSeconds` governs only what is shown and whether the Sec column appears.
  It exists because the **native `<input type="time">` cannot be styled at all** — its dropdown is
  browser chrome, not page DOM, so no CSS reaches it — and its 12h/24h rendering follows the
  viewer's OS locale with no attribute to override it (`lang` has no effect). Owning the popover
  fixes both: tokenised, and 24-hour for everyone.
  **Every option is a `<button>` deliberately.** `InputGroupAddon` focuses its text input on any
  click that is not on a button, and React propagates through the React *tree*, so a non-button
  control inside this popover would have its focus stolen the instant it was clicked — which is
  precisely what the native time input did when it lived in an addon's popover. Buttons keep that
  shared primitive untouched.
- Chip → `platform/src/components/ui/chip.tsx`. A selected **value**, `rounded-sm` per DESIGN.md §5,
  with an optional remove ✕. Not a `Badge` variant: `Badge` is a non-interactive `rounded-full`
  status pill built on `useRender`, and DESIGN.md § Chips keeps the two apart deliberately. Fill is
  `bg-highlight`, not `bg-muted` — `--muted` is 97% lightness (`src/theme.css` calls it "nearly
  invisible against the page background", which is why the switch track moved off it) and is
  reserved for zebra striping, while `--highlight`'s role covers selection highlights.
  **Its remove button stops `pointerdown`/`mousedown`/`click` and Enter/Space propagation.** That is
  load-bearing, not defensive: a chip renders *inside* the combobox trigger, and Base UI's trigger
  opens on **mousedown**, so stopping `click` alone would open the popup on the way to removing a
  chip. Don't delete those handlers as redundant.
- Combobox family (`Combobox`/`ComboboxTrigger`/`ComboboxValue`/`ComboboxContent`/`ComboboxInput`/
  `ComboboxList`/`ComboboxItem`/`ComboboxEmpty`/`ComboboxFieldLabel`/`ComboboxGroup`/
  `ComboboxLabel`/`ComboboxSeparator`/`ComboboxCollection`) →
  `platform/src/components/ui/combobox.tsx` — **the filterable `Select`.** Reach for it over `Select`
  once a list is long enough to want typing; compose the parts at the call site exactly as pages
  compose `Select` today, which is why there is no `SearchableSelect` wrapper. Generated from
  shadcn's `base-vega` registry, then customized — **the file header lists every divergence**, which
  is what makes a future `npx shadcn add --overwrite combobox` survivable. Four things to know:
  `ComboboxInput` is the popup's search field and belongs *inside* `ComboboxContent` (that placement
  is what earns the trigger its `role="combobox"` and tab stop); **`ComboboxTrigger` renders a
  `<div role="combobox">`, not a `<button>`**, which is what makes a removable chip inside it legal
  HTML while keeping the ✕ exposed to assistive tech; label it with `ComboboxFieldLabel`, **never
  `FieldLabel htmlFor`**, since `htmlFor` cannot associate with a div (note `ComboboxLabel` is the
  *group* label, following shadcn and matching `SelectLabel`); and `ComboboxItem` highlights on
  `data-highlighted`, **not** `focus:` as `SelectItem` does — Select moves DOM focus onto its items
  while Combobox keeps focus in the search input, so a `focus:` class here would never match.
- **`SelectTrigger` / `ComboboxTrigger` / `MultiSelect` share one `width` scale and one default
  shape** — `Input`'s exactly: 40px tall, `px-3`, filling the container (DESIGN.md §6 Forms).
  `width`: `full` (default) · `lg` 320 · `md` 224 · `sm` 160 · `xs` 96.
  `size`: `default` 40px · `md` 36px (the DataTable toolbar band) on all three, plus a 32px `sm`
  on `SelectTrigger` **only**. That asymmetry is deliberate: `Input` and `Textarea` have no sizes
  at all, so a size scale is not yet a property of this field vocabulary, and the new components
  do not advertise one beyond the toolbar band they actually need. `SelectTrigger` keeps `sm`
  because it shipped with it. Introducing sizes properly means doing it across every field
  component at once — not widening one union at a time.
  **Both resolve through `cn()`, deliberately not as `data-[size=…]:h-10` variants.** A `data-*`
  variant compiles to `.cls[data-size="default"]`, which beats a caller's plain `.h-8` on
  specificity — so the override loses regardless of class order or `tailwind-merge`. That was not
  hypothetical: `Pagination`'s page-size picker asked for `h-8 w-[70px]` and silently rendered at
  the trigger's default height for as long as the variant form was in place. If you add another
  dimension to these triggers, put it in a lookup map and pass it through `cn()`, not in a
  `data-*` variant.
- **The two menus are geometrically identical on purpose.** `ComboboxList` carries no padding, so a
  highlighted item's fill spans the full row exactly as `SelectItem`'s does, and the popup's search
  field is flush with a `border-b` rather than a floated `m-1` box. Pristine shadcn insets both;
  that inset is the one thing a user notices when comparing the two menus, because it shows up
  while hovering.
- MultiSelect → `platform/src/components/ui/MultiSelect.tsx`. Controlled `string[]` in and out, chips
  in the trigger, one `All` chip at full selection, `+N more` past `maxChips` (default 3), and a
  pinned select-all that acts on the **filtered** options and names that count. Bind with
  react-hook-form's `Controller`; it has no uncontrolled mode on purpose. Option lists are passed in
  **whole** — filtering is client-side, so it never paginates and never queries per keystroke.
  Deliberately does **not** use Base UI's own `Combobox.Chips`/`Chip`/`ChipRemove`: those are a
  `role="toolbar"` composite of `tabIndex: -1` roving items driven from a *visible* inline input, and
  `ChipRemove` removes by composite index then focuses `inputRef` — with the search field in the
  popup, that entry point and that focus target are both unmounted. They are stripped from
  `combobox.tsx` for the same reason.
- ConfirmationPanel → `platform/src/components/ui/ConfirmationPanel.tsx` — the "you're done" block a
  form shows after a successful submit: success badge, title, description, optional fine print under
  a divider, then `children` (the body), `actions`, and `above`/`below` slots so a page can add
  anything around it without forking the component. The tick is `--color-success`, **not**
  `--color-primary`, even where a mock shows the accent — DESIGN.md § Confirmation pages has the
  reasoning. It deliberately does not decide where the buttons go; `actions` is a slot because those
  destinations are a per-page question.
- Stepper → `platform/src/components/ui/Stepper.tsx` — the frame for a multi-step process: an
  equal-width progress rail (no numbered circles, segments not clickable — Back/Continue are the
  only navigation), an optional "Step 1 of 4 — Contact" counter, the step's title/description,
  its content, then the footer. **Controlled and form-library-agnostic on purpose** — the page owns
  `currentStep`; `Stepper` never imports react-hook-form or any other form/data library, matching
  the rule that `ui/` holds no data-fetching or form logic. A step blocks Continue by returning (or
  resolving to) `false` from its `onBeforeNext`, which a form step wires to
  `form.trigger([...fields])`; the last step's primary button becomes `submitLabel` (default
  "Submit") and takes `isSubmitting`. Only the active step's `content` is mounted, so a form's
  `useForm` instance has to live above the `Stepper`, not inside a step. Demoed on
  `/sample/advanced`, which is also the repo's first `useForm` call site — see that section's
  comment for the per-step-validation pattern.
- InfoTable → `platform/src/components/ui/InfoTable.tsx` — read-only label-left / value-right rows.
  Renders a `<dl>`, not a `<table>`: these are term/description pairs, and a real table would
  promise a header row and sortable columns it does not have. `value` is a `ReactNode`, so a row can
  hold a `Badge` or a formatted date. **Values wrap rather than truncate at every width** — the
  `min-w-0` on the `<dd>` is what allows that instead of the row forcing the card wider (a flex item
  defaults to `min-width:auto` and refuses to shrink below its content). Distinct from
  `DetailPage`'s summary list, which stacks label *above* value — that shape suits a dense sidebar
  of many short fields, this one a handful the reader scans by label.
- BackToTop / ScrollToTop / Toaster → `platform/src/components/ui/`
- `Button` (`platform/src/components/ui/button.tsx`) — has a built-in `isLoading` prop
- `Card` family (`platform/src/components/ui/card.tsx`) — `rounded-md`. `--card-spacing` is
  **16px below `sm`, 24px at `sm` and above**, which reclaims 16px of content width on a phone;
  `CardFooter`'s `[.border-t]:mt-[calc(…)]` was already written to self-neutralise at 16px, so
  the divider spacing holds at both steps. `CardHeader` derives its own
  column count from the slots inside it: `[1fr auto]` with a `CardAction`, `[auto 1fr]` with a
  `CardMedia`, `[auto 1fr auto]` with both — never set grid classes on it by hand. `CardMedia` is the
  leading icon slot (rounded `bg-muted` square, spans both header rows, sizes an unsized child svg),
  mirroring `AlertDialogMedia`. A `Card` that is a router `Link`'s direct child gets DESIGN.md §5's
  `--elevation-2` hover edge automatically via `[a:hover>&]:ring-elevation-2` — no opt-in class. `CardFooter` has **no** justify default, unlike the Dialog/Sheet
  footers — pass `justify-end` for actions, nothing for metadata; `border-t` adds the divider and
  its 16px spacing together
- `Sheet` family (`platform/src/components/ui/sheet.tsx`) — **no radius on any corner**, unlike
  `Card` (`rounded-md`) and `Dialog`/`AlertDialog` (`rounded-lg`). A sheet is anchored to a viewport
  edge rather than floating in the middle of one, so a rounded leading edge reads as a card that has
  slid off-screen. Backdrop `bg-black/55`, no blur (DESIGN.md §6). Footer actions bottom-right like
  every other container (§7)
- `Input`/`Textarea`/`InputGroup`/`Calendar` (`platform/src/components/ui/{input,textarea,input-group,calendar}.tsx`)
  — fill is `bg-card`, resting-state border is `border-border-dark`; disabled state is a flat
  `bg-muted`/`border-border`/`text-disabled-text` replacement, not reduced opacity (this line was
  stale — it previously said the fill was `bg-input-background`, which predates a later fix).
  Field radius is `rounded-sm` (4px), matching Button per DESIGN.md §349 — shadcn ships these at
  `rounded-md`, so a regeneration silently reverts it and leaves fields 8px beside 4px buttons
- `Select` family (`platform/src/components/ui/select.tsx`) — `SelectTrigger` fill is `bg-card`,
  resting-state border is `border-border-dark`, radius `rounded-sm` (it is a field); the
  `SelectContent` popup stays `rounded-md` like every other panel. Same disabled treatment as above
- `HighlightPanel` family (`platform/src/components/ui/HighlightPanel.tsx`) — `bg-highlight` callout
  *inside* a card (DESIGN.md §2.3), e.g. a leading instructional banner on a form. Fill only, no
  border, no shadow; optional leading icon as a direct child. Not a status surface — reach for
  `Alert` for success/warning/error, which is also the only one of the two with `role="alert"`
- `UnsavedChangesDialog` → `platform/src/components/ui/UnsavedChangesDialog.tsx` + its hook
  `platform/src/hooks/useUnsavedChangesGuard.ts` — one guard for all three ways to abandon a form:
  closing a Dialog/Sheet, navigating to another route, and leaving the site. Opt-in per page;
  `local/require-unsaved-guard` errors if a form in an overlay omits it, and a PostToolUse hook
  flags it while editing. `components/ui/**` is exempt (FilterSheet is draft-then-apply, where
  discarding IS closing)
- `toast` → `platform/src/components/ui/toast.tsx` — the only sanctioned way to raise a toast, and
  the only file besides `sonner.tsx` allowed to import `sonner` (`local/no-direct-toast`). Wraps
  `toast.custom`, so sonner's own card styling is bypassed entirely (`data-styled=false`) and the
  toast is themed from this repo's tokens per DESIGN.md §6 — surface never coloured, error text
  only. `Toaster` (`sonner.tsx`) is just the container now: no `richColors`, no `icons` map
- `EmptyState` → `platform/src/components/ui/EmptyState.tsx` — icon → heading → subtext → optional CTA
- `PageContentHeader` → `platform/src/components/ui/PageContentHeader.tsx` — title + optional subtitle +
  optional action cluster. Rendered by every page template, which sets `align`; pages never choose
  placement themselves
- **Component Library Showcase** splits in two:
  - **Primitives** → `/sample/component-library` (public route, `platform/src/samples/Primitives.tsx`)
    — live gallery of every shadcn-derived primitive plus colors/typography/selection
    controls/forms/badges, for visual QA against DESIGN.md
  - **Advanced / Composite** → `/sample/advanced` (public route,
    `platform/src/samples/AdvancedComponents.tsx`) — demos the composed components this repo has
    actually built (`PageContentHeader`, `ConfirmDialog`, `DataTable`, `FilterSheet`, `Stepper`).
    Not exhaustive — see the "Later" table in `docs/architecture/templates.md` for what's still
    pending
- **Template Gallery** → `/sample/templates` (public route,
  `platform/src/samples/TemplateGallery.tsx`) — the selectable page frames, each with a **labelled
  placeholder** preview under `/sample/templates/<id>` (a frame with its holes named, not a
  design). Shells live in `platform/src/templates/`, one tier above this folder — see
  `docs/architecture/templates.md`
- **Samples** → `/sample/form-page-public`, `/sample/standard-management-page`, `/sample/dashboard-page`, `/sample/detail-page`,
  `/sample/card-list-page` (public routes, `platform/src/samples/samples/*.tsx`) — the same five page looks with
  realistic content instead of a frame diagram, including the full-featured `DataTable` reference
- **`/sample` and `/sample/overview`** (`platform/src/samples/SampleHome.tsx`) — an index of everything
  above, one section per navbar parent. All sample routes render inside `PageLayout`
  (`layout: "default"`, never `"none"`) so `Navbar` shows the sample menu instead of the
  Supabase-driven one — see `platform/src/lib/constants/sampleNav.ts` and
  `platform/src/app/layout/Navbar.tsx`
