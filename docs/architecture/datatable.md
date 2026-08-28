# DataTable — the seam, and how to upgrade it

`platform/src/components/ui/datatable/DataTable.tsx` is the only file in the repo that may import
`@tanstack/react-table`. Everything above it speaks types this repo owns. That boundary is the whole
design: a TanStack major upgrade should be a single-file change.

## Why the boundary exists

Three of TanStack's shapes would otherwise reach page code, and all three differ between v8 and v9:

| Leak | TanStack | This repo instead |
| --- | --- | --- |
| Columns | `ColumnDef<T>` (v9 adds a `TFeatures` generic) | `DataTableColumn<T>` |
| Sort state | `SortingState` — `{id, desc}[]` | `TableSort` — `{ field, direction }` \| `null` |
| Selection | `RowSelectionState` — `Record<string, boolean>` | `T[]`, the actual row objects |
| Cell format | Cell-context render functions in `ColumnDef` | `numeric`/`badge` on `DataTableColumn<T>` |

The load-bearing choice is `accessor: (row: T) => React.ReactNode`. TanStack's cell renderer hands
you a context object whose shape moves between majors; a plain row-in, node-out function is both
total (any JSX works — badges, links, buttons) and version-independent.

**A `numeric` or `badge` column's `accessor` returns the raw value, never a pre-formatted string —
this is not a style preference.** `DataTable` feeds the accessor's return value straight to
TanStack's `accessorFn`, so whatever it returns is *also* the sort key and (in client mode) the
search value. A column that pre-formats to `"SGD 412.00"` sorts that string lexicographically —
`"SGD 1,280.50"` lands below `"SGD 412.00"` because `"1"` sorts before `"4"` as a character, and
worse, TanStack's `getAutoSortingFn` samples with `flatRows.slice(10)` (not `slice(0, 10)`), so
under 11 rows it samples nothing and silently falls back to a different comparator than it uses
past 11 rows. Declaring `numeric: { decimals, prefix?, suffix?, grouping? }` or
`badge: { variants, fallback? }` instead keeps the accessor's return value numeric/raw for sorting
while `DataTable` formats it for *display* separately — see `platform/src/types/table.ts`.

A `numeric` column's `prefix`/`suffix` render as a separate muted element pinned to the cell's
edge (`$` on the left, `days`/`%` on the right), not concatenated onto the digits — see
`NumericUtils.formatNumericParts` (`platform/src/lib/numericUtils.ts`), the primitive
`renderColumnContent` (`DataTable.tsx`) uses to build that layout. `NumericUtils.formatNumeric`
still returns the single concatenated string (`"$1,234.00"`) unchanged — client-mode search
(`makeGlobalFilter` below) matches against that string, so a search for `"$1,234"` keeps working
even though the display splits the prefix into its own element.

**A column's `width` (pixels) only makes sense under `table-layout: fixed`.** Under the browser's
default `table-layout: auto`, a width on a `<td>`/`<th>` is merely a suggestion the browser can
override once content doesn't fit — it does not guarantee the column stays that size. So any
`ColumnBase.width` flips the whole `<Table>` to Tailwind's `table-fixed` (`DataTable.tsx`'s
`hasFixedWidth` check), at which point declared widths hold exactly and the columns without one
split the remaining space evenly, per the CSS spec's own fixed-layout algorithm — not a bespoke
distribution DataTable invents. A table with no `width`-bearing column never sets `table-fixed` and
keeps auto layout, so this is a strictly additive, opt-in behavior. Overflowing content in a
fixed-width column gets `truncate` instead of the default `whitespace-nowrap`, so it ellipsizes
rather than forcing the column wider; `wrap` still means "let this column grow instead," same as
today. Horizontal scrolling when a table (fixed-width or not) exceeds its container is already
handled at the `Table` primitive level (`platform/src/components/ui/table.tsx`'s
`overflow-x-auto` wrapper) and needs no column configuration at all.

TanStack is used for **row models and state only**. Every cell, header and chrome element is
rendered by this repo, so `flexRender` is deliberately unused — that keeps the version-specific
surface as small as it can be.

## Enforced, not just documented

`eslint.config.js` bans `@tanstack/react-table` and `@tanstack/table-core` everywhere under `src/`
except `platform/src/components/ui/datatable/**`. Without it the guarantee erodes on the first page that
wants one more column feature.

To confirm the seam still holds:

```bash
grep -rn "@tanstack/react-table" src/ --include=*.ts --include=*.tsx
```

Only `platform/src/components/ui/datatable/DataTable.tsx` should appear. Then add a throwaway
`import { flexRender } from "@tanstack/react-table"` to any page and confirm `npm run lint` errors
before deleting it — a seam nobody checks stops being a seam.

## Why v8 today

`@tanstack/react-table` is pinned to `^8.21.3`. v9.0.0 shipped 2026-08-04; the npm registry shows
`beta.69` through `9.0.0` inside three days, so the API was still moving at release. For the
skeleton's most-reused component that is the wrong risk, not a judgement about v9's quality — its
first-party agent docs are good (see below).

## Upgrading to v9

1. `npx @tanstack/intent@latest install` — writes 30 first-party skills into
   `node_modules/@tanstack/*/skills/`, versioned to the installed release. v8 ships no `skills/`
   directory, which is why `npx @tanstack/intent list` currently reports nothing.
2. Load, in order: `@tanstack/table-core#core`, `#table-features`,
   `@tanstack/react-table#migrate-v8-to-v9`, `#getting-started`, `#with-tanstack-query`, and
   `@tanstack/table-core#client-vs-server` — the last maps directly onto the `mode` prop.
3. Rewrite only the mapping layer inside `DataTable.tsx`. The v9 shape is `useTable` +
   `tableFeatures` + `table.FlexRender`, not `useReactTable` + `getCoreRowModel`.
4. `@tanstack/table-core#api-not-found` exists specifically to diagnose a missing export **before
   inventing an API** — reach for it rather than guessing.

**The upgrade's acceptance test:** `git diff --stat` shows no file outside
`platform/src/components/ui/datatable/` (and `package.json`). If a page changed, the seam leaked and the leak
is the bug, not the page.

`AGENTS.md` at the repo root is the intent installer's entry point and is kept for that day.

## `mode` — server by default

`mode="server"` (the default) sets `manualPagination`/`manualSorting`/`manualFiltering`: the page's
hook does the work and `totalItems` comes from the API's count. `mode="client"` registers the
filtered/sorted/paginated row models instead and derives the count from the data.

Switching modes changes **only the service and hook** — columns, actions, selection and every
page-level line stay identical. `platform/src/samples/samples/StandardManagementPage.tsx` (routed at
`/sample/standard-management-page`) runs in client mode so the sample works with no backend.

Client-mode search is column-format-aware, not a blanket primitive check. The default
`includesString` filter would stringify a React element to `"[object Object]"` and match
everything, so `DataTable` supplies its own `globalFilterFn` instead: a `numeric` column matches
both its formatted display string (`"$1,234.00"`) and its raw digits (`"1234"`), so a currency
symbol or thousands separator in the search term still works; a `badge` column matches its raw
status value, newly searchable where a Badge-returning accessor used to be silently excluded; a
column whose accessor still returns arbitrary JSX stays non-searchable, exactly as before. In
server mode the API decides, and it is worth remembering that a numeric column now hands the API a
number — a currency-prefix search (`ilike '%SGD%'`) against a numeric Postgres column is a type
error there, not a graceful no-match.

`DataTable` also sets `getColumnCanGlobalFilter: () => true`. TanStack's own default decides
whether a column participates in global search by probing `flatRows[0]` *only* — a single `null` in
the first row silently drops that entire column from search for every user, for as long as that row
happens to sort first. Raw numeric accessors make a nullable column more likely than a
pre-formatted string did, which is why this is set explicitly rather than left to the default.

## Row expansion — and why it needs no new row model

`renderExpanded` reveals arbitrary content beneath a row; passing it adds the leading expander
column, and omitting it leaves a table exactly as it was.

**The panel is not sub-rows.** It shares none of the table's columns — the reference design is a
count heading and a list — so the prop is `(row: T) => React.ReactNode` and the content can be a
div, a `HighlightPanel` or a nested table. `canExpand` suppresses the chevron for rows with nothing
to show; `expandMode` is `"multiple"` (default) or `"single"`.

`getExpandedRowModel` is deliberately **not** registered. It exists to flatten nested `subRows` into
a display list, and there are none here — `DataTable` already hand-rolls every row from
`DataTableColumn[]`. Expansion is therefore a `Set` of open row ids plus a second `<TableRow>`
carrying a `colSpan` cell: no extra row model, no `manualExpanding` question for `mode`, and no new
TanStack surface to migrate at v9.

**Expansion clears whenever the visible rows change**, on the same `selectionResetKey` as selection.
Row ids are positional, so after a sort a stored id points at whatever now occupies that slot;
clearing is what makes the positional id safe. It is also one rule for both features instead of two.

**Zebra striping moves into `DataTable` when expanding.** `TableBody`'s striping is CSS
`nth-child(even)`, which collapses once a panel row is interleaved — every data row then lands on
the same parity. With expansion the band is computed from the data row's index and applied to both
rows of a pair, so a row and its panel share one band. Without expansion the CSS path is untouched.

**When to use it instead of a side sheet:** inline expansion is for read-only detail the row already
carries. Editing, actions, or anything that has to fetch belong in a side sheet — see
`.claude/skills/build-datatable/SKILL.md`, which also says to ask the user whether one row or
several may be open at once rather than assuming.

## Scope is not a filter

`useTableState` holds two ways of narrowing a table, and keeping them apart is load-bearing:

- **`filters`** — optional refinement *within* a dataset. Draft-then-apply through `useFilterDraft`,
  lives in a `FilterSheet`, counts toward `activeFilterCount`, cleared by `clearFilters`.
- **`scope`** — the *required*, always-visible "which dataset am I looking at" selectors in the
  toolbar (company, year). Applies immediately, because there is nothing to revert to.

`scope` is deliberately **not** part of `filters`. A required selector counted in the filter badge
reads as a filter the user can't find, and `clearFilters` emptying it would leave the page with no
company selected — a state it cannot render. `ScopeValues` is `Record<string, string>` with no
`null` for the same reason.

`setScope` resets to page 1 inside the hook, like every other setter, so no page resets the page
number at a call site. `scope` joins `selectionResetKey`, since changing the dataset changes the
visible rows.

**Which shape a page uses is the user's call.** `/sample/scoped-list-page` shows both together —
scope selectors for the dataset, a sheet for refinement. What not to build is an *optional* filter
inline plus a sheet: two places to look for one control.

### A closure trap worth knowing

`setDraftFilter(...)` followed by `applyFilters()` in the same handler applies the **previous**
value. `applyFilters` is a `useCallback` closing over `draftFilters` from the render that created it,
so before React re-renders it commits the stale draft and the applied filter lags one interaction
behind. It presents as a caching bug. This is the direct reason a control meant to apply immediately
uses `scope`/`setScope` rather than routing through the filter draft.

## Fixed behaviours worth knowing before changing them

- **Toolbar positions don't move.** Search top-left then `leftSlot`; `rightSlot`, then the filter
  sheet, then refresh, top-right. Pages fill slots; they don't rearrange the row. The one exception
  is refresh, which has two documented slots: `refreshPosition="start"` moves it beside the search
  box, which `/sample/approval-page` uses to leave the right side for its bulk actions. Still not a
  page placing a component — DataTable owns the button and its `queryKey` either way.
- **Selection clears whenever the visible rows change** — page, search, filter or sort. Driven by
  `selectionResetKey` from `useTableState`. This is what stops a bulk action firing against rows the
  user can no longer see.
- **Select-all covers the current page only.** With server paging the client has not seen the rest.
- **Bulk actions go in `rightSlot`, and the page decides when they show.** Appearing on first
  selection keeps the toolbar quiet; staying visible and `disabled` at zero advertises that bulk
  action exists at all, which is what a queue page wants (`/sample/approval-page`). Either way the
  page owns the labels, counts and handlers — it already has the rows from `onSelectionChange`.
- **One row action renders as a bare icon button; two or more collapse into a ⋮ menu.**
- **Destructive actions never fire directly** — they route through `ConfirmDialog`.
- **Sorting is signalled by an arrow icon only.** Headers keep their muted-grey styling in every
  state; colour is reserved for link cells (`href`).
- **Zebra striping is on by default**, matching DESIGN.md § Tables, which calls it the primary row
  separator. `striped={false}` opts out, leaving `border-b` to separate rows.
- **Expansion clears on page/search/filter/sort**, the same rule as selection and for the same
  reason. The expander is a fixed leading column and appears only when `renderExpanded` is passed.
