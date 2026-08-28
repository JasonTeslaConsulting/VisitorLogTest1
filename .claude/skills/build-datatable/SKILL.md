---
name: build-datatable
description: >
  Use this skill when building a page that displays tabular data with search,
  filtering, pagination, and row actions. Triggers: "build a manage X page",
  "list page for X", "data table for X", "table with search and filter",
  "page to view and manage X records". Always pair with add-new-route skill
  and call-api skill when building a new table page from scratch.
applies_to:
  - data table pages
  - list pages
  - manage pages
  - search and filter
  - pagination
---

# Skill: Build a Data Table Page

Read this entire file before writing any code.

## What this skill covers

Building a page that displays tabular data with search, filtering, pagination, and row actions.

The page frame comes from a **template** (`platform/src/templates/`) and the table itself from the shared
**`DataTable`**. This skill is about the data and the columns — almost none of the layout is yours
to decide.

---

## File checklist — create all of these

- [ ] `src/services/<domain>.ts` — a `list<Entity>` returning `{ rows, count }`
- [ ] `src/hooks/<domain>/use<Entity>.ts` — useQuery wrapper, table state in the query key
- [ ] `src/components/<PageName>/<PageName>Columns.tsx` — the column definitions
- [ ] `src/components/<PageName>/<PageName>Filters.tsx` — filter fields (if filters are needed)
- [ ] `src/pages/<PageName>.tsx` — composes everything, owns no data logic

---

## Shared pieces — always import, never rebuild

- `DataTable` → `platform/src/components/ui/datatable/DataTable.tsx` — toolbar + table + pagination in one
- `FilterSheet` → `platform/src/components/ui/FilterSheet.tsx` — the filter chrome
- `ConfirmDialog` → `platform/src/components/ui/ConfirmDialog.tsx` — destructive confirmations
- `useTableState` → `platform/src/hooks/useTableState.ts` — page, search, filters, sort
- `DataTableColumn` / `RowAction` / `TableSort` → `platform/src/types/table.ts`

`SearchBar`, `RefreshButton`, `Pagination` and `TableSkeleton` all live under
`platform/src/components/ui/datatable/` and are rendered **by `DataTable` itself** — a page never mounts them
directly.

**Actions that open a form use a side sheet**, not a modal — row actions, bulk actions and toolbar
actions alike. The table stays visible behind the sheet so the user keeps their place in the list.
This is the standing default for datatable pages; a modal is still available if the user asks for
one (see `.claude/skills/build-form-page/SKILL.md` § Choosing between a side sheet and a modal).

**Destructive actions are not affected by that default** — they stay `ConfirmDialog`, per
`.claude/rules/components-rules.md`. "Side sheet from a datatable" never means confirming a delete
in a side sheet.

### Expand inline, or open a side sheet?

Two disclosure surfaces now exist for "tell me more about this row", so the choice has a rule rather
than a preference:

| | Use |
| --- | --- |
| **Expand inline** (`renderExpanded`) | Read-only detail the row **already carries**. The declared equipment on a visit, the sites on a vendor. No fetch, no actions. |
| **Side sheet** | Editing, actions, or anything that has to fetch. Also anything long enough that inline would push the rest of the table off-screen. |

The line is *read-only and already loaded*. A panel that fetches on open needs loading and error
states inside a table row, which is where this pattern goes wrong.

**Ask which mode the page wants.** `expandMode` defaults to `"multiple"`, but that is a real UX
decision and not yours to assume — several rows open at once suits comparing records; one at a time
suits a tall panel. Ask, the same way you would ask about a card's click target or sheet-vs-dialog
(`.claude/rules/components-rules.md`).

`canExpand` is not optional in practice: a chevron that opens an empty panel is worse than no
chevron. Pass it whenever a row's detail can be absent.

### Scope selectors, or a filter sheet?

Two ways to narrow a table, and they are not interchangeable:

| | **Scope** — selectors in the toolbar | **Filter** — fields in the sheet |
| --- | --- | --- |
| Is it required? | Yes. There is no "no company" state | No. Absent is a valid state |
| What does it do? | Decides **which dataset** you are looking at | Refines **within** that dataset |
| When does it apply? | Immediately | On Apply — draft-then-apply |
| State | `state.scope` / `state.setScope` | `state.filters` / `setDraftFilter` + `applyFilters` |
| Can it be cleared? | No — Clear all must not touch it | Yes, and it counts toward the badge |

Scope lives in `useTableState` rather than page state so `setScope` can reset to page 1 itself — a
scope change replaces the dataset, so page 4 of the old one means nothing, and no page ever resets
the page number at a call site. It also stays out of `activeFilterCount` and `clearFilters`, so a
required selector is never badged as a filter nor emptied into a state the page cannot render.

**Which shape a page uses is the user's decision, not yours. Ask.** A list only ever read
one-company-at-a-time wants scope selectors; a list read whole and occasionally narrowed wants a
sheet. Same habit as `expandMode` and a card's click target.

What **not** to build: an optional filter inline *and* a filter sheet. Users then have two places to
look for the same control. Inline is for required scope; the sheet is for optional refinement.

Reference: `/sample/scoped-list-page` shows scope and sheet together.

### Bulk actions: the page decides when they appear

Both conventions are legitimate, and `rightSlot` is where either goes:

- **Appear on first selection**, carrying the count — the quieter toolbar.
- **Always visible**, counted, `disabled` at zero — `/sample/approval-page`. The affordance is what
  tells a user bulk action is possible at all, so a queue page whose whole purpose is deciding on
  several rows should show it before anything is ticked.

Either way the page owns the labels, counts and handlers: it already has the rows from
`onSelectionChange`, and the verbs are domain-specific. Don't reach for a new DataTable prop.

### Never do

- **Never import `@tanstack/react-table`.** ESLint blocks it outside
  `platform/src/components/ui/datatable/`. Columns are plain data; see `docs/architecture/datatable.md`
- Never reset `currentPage` at a call site — `useTableState` already does it on search, filter and
  sort changes
- Never hand-roll a table, toolbar or pagination row

---

## State

```ts
const state = useTableState(); // add { initialPerPage } only if 25 is wrong for this page
```

Pass the whole object to `DataTable` as `state`. It carries `currentPage`, `resultsPerPage`,
`searchTerm`, `filters`, `sort`, `activeFilterCount` and the selection-reset key.

Filters are draft-then-apply, via `useFilterDraft` (composed inside `useTableState` — see
`platform/src/hooks/useFilterDraft.ts`). `filters` is what's applied and drives the query; a filter field
binds to `draftFilters`/`setDraftFilter` instead, and nothing takes effect until `FilterSheet`'s
Apply button fires `applyFilters`.

---

## Data fetching — server-side by default

```ts
// src/hooks/vendors/useVendors.ts
export function useVendors(params: ListVendorsParams) {
  return useQuery({
    queryKey: ["vendors", params], // every param, so any change refetches
    queryFn: () => listVendors(params),
    staleTime: STALE_TIMES.STANDARD,
  });
}

// src/pages/ManageVendors.tsx
const state = useTableState();
const { data, isLoading } = useVendors({
  page: state.currentPage,
  perPage: state.resultsPerPage,
  search: state.searchTerm,
  filters: state.filters,
  sort: state.sort,
});
```

The service returns `{ rows, count }` — see `.claude/rules/service-rules.md` for the
`count: "exact"` / `.range()` / `.ilike()` / `.order()` conventions.

Use `mode="client"` only when the whole dataset is genuinely small and already in memory; then pass
the full array and omit `totalItems`.

---

## Columns

```tsx
const columns: DataTableColumn<Vendor>[] = [
  {
    id: "vendorname",           // equals the DB column, so sort needs no translation
    header: "Vendor",
    accessor: (row) => row.name,
    sortable: true,
    href: (row) => `/vendors/${row.id}`, // renders in text-primary — the only coloured cell text
  },
  {
    id: "spend",
    header: "Spend",
    // numeric declares the format; accessor stays the RAW number. The accessor's return value is
    // also the sort key and the search value, so a pre-formatted "$1,234.00" sorts and searches
    // wrong — see docs/architecture/datatable.md.
    accessor: (row) => row.spend,
    numeric: { decimals: 2, prefix: "$" },   // decimals has no default — pick it explicitly
    // The "$" renders in its own muted gutter pinned to the cell's left edge, not glued to the
    // digits — DataTable does this automatically, don't format it into the accessor or a className.
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    // badge declares the mapping; accessor stays the raw status value, never a hand-rolled <Badge>.
    // STATUS_VARIANTS (platform/src/lib/constants/status.ts) is a conventional starting point —
    // spread it or write your own map, but state it explicitly either way.
    accessor: (row) => row.status,
    badge: { variants: STATUS_VARIANTS },
    sortable: true,
  },
  {
    id: "roles",
    header: "Roles",
    wrap: true,                 // opt out of nowrap for multi-badge cells
    accessor: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
      </div>
    ),
  },
];
```

`accessor` returns anything renderable. Keep it a pure function of the row — no hooks, no fetching.
The same applies to `renderExpanded`: it renders detail the row already carries, so it needs neither.
**No data-entry control belongs in either one** — `local/no-inline-edit-in-column` enforces it. A
row-level `Switch` that calls a mutation on toggle does not violate "no hooks, no fetching": the hook
is called in the *page*, above the columns array, and only the resulting handler is closed over into
the accessor, which still just reads the row (`platform/src/samples/samples/ScopedListPage.tsx` is
the reference). Everything else that edits a record opens a side sheet.

---

## Page layout

```tsx
export const ManageVendors = () => {
  const state = useTableState();
  const { data, isLoading } = useVendors({ /* ...state */ });

  return (
    <SingleCardTemplate
      title="Manage vendors"
      width="wide"
      headerActions={<Button startIcon={<PiPlus className="size-4" />}>Add vendor</Button>}
    >
      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        totalItems={data?.count ?? 0}
        state={state}
        queryKey={["vendors"]}
        isLoading={isLoading}
        actions={(row) => [
          { label: "Edit", icon: PiPencilSimple, onClick: () => openEdit(row) },
          { label: "Delete", icon: PiTrash, destructive: true, onClick: () => remove(row) },
        ]}
        // Optional. Read-only detail only — see "Expand inline, or open a side sheet?" above.
        renderExpanded={(row) => <VendorSites vendor={row} />}
        canExpand={(row) => row.sites.length > 0}
        filterSheet={
          <FilterSheet
            activeCount={state.activeFilterCount}
            onClear={state.clearFilters}
            onApply={state.applyFilters}
            onDiscard={state.discardDraft}
            canApply={state.isFilterDirty}
          >
            <VendorFilters state={state} />
          </FilterSheet>
        }
      />
    </SingleCardTemplate>
  );
};
```

The template owns width, header placement and card wrapping — see
`docs/architecture/templates.md`. Page-edge padding is `PageLayout`'s job, not the template's or the
page's (DESIGN.md §7). Pick the template from `platform/src/templates/registry.ts` — `single-card` at
`width: "wide"` for this page kind; never re-specify the frame.

---

## Fixed behaviours — not per-page choices

These are built into `DataTable`. Don't reimplement or override them:

- Toolbar order: search top-left then `leftSlot`; `rightSlot`, filter, refresh top-right
- Zebra striping **on** unless `striped={false}` is passed (DESIGN.md § Tables)
- One row action renders as an icon button; two or more collapse into a ⋮ menu
- Destructive actions route through `ConfirmDialog`
- Sorting is signalled by an arrow icon; headers stay muted grey
- Selection clears on page/search/filter/sort change; select-all covers the current page only
- **Expansion clears on the same changes, for the same reason** — row ids are positional, so a
  stored id would otherwise point at a different record after a sort
- The expander is a fixed leading column, before the selection checkbox, and appears only when
  `renderExpanded` is passed
- Bulk actions live in `rightSlot` and the page decides whether they appear on selection or stay
  visible and disabled at zero — both are legitimate, and either way they carry the count
- Refresh sits at the right by default; `refreshPosition="start"` moves it beside the search box
- Loading renders skeleton rows inside the real table so header and column widths hold
- The table scrolls horizontally inside its own container; the page never does

## Header & subtitle placement

A table page's header stays left-aligned with the card's edge — the template's `width="wide"`
handles it. A subtitle is optional and usually omitted (DESIGN.md §8).

---

## The three table samples

Reach for the nearest one rather than assembling a configuration from scratch — see
`.claude/skills/build-from-sample/SKILL.md`:

| Sample | Shape |
| --- | --- |
| `/sample/standard-management-page` | Find a record, act on it. Search, filter, refresh, `⋮` per row |
| `/sample/approval-page` | Decide on several rows. Checkboxes, no row actions, always-visible bulk buttons |
| `/sample/scoped-list-page` | Data pre-scoped by required selectors, with a sheet for refinement |

Every DataTable prop combination is switchable at `/sample/advanced` § DataTable. The samples each
show one fixed configuration on purpose — that is what makes "build it like the Approval Page" mean
something.

## What NOT to do

- Do not call supabase directly in the page or a column
- Do not use `useQuery` directly in the page — use a custom hook
- Do not import `@tanstack/react-table` anywhere outside `platform/src/components/ui/datatable/`
- Do not put filter option fetching inside the filter component — fetch in a hook, pass as props
- Do not manage `currentPage`, selection or expansion inside a column or filter component
- Do not fetch inside `renderExpanded` — if the detail isn't already on the row, use a side sheet
- Do not put a `Select`, `Input`, or other data-entry control inside `accessor`/`renderExpanded` —
  edit an existing record in a side sheet instead. `Switch` is the one exception, for an
  immediate-effect toggle; `local/no-inline-edit-in-column` enforces the rest
- Do not pre-format a number or status into a string inside `accessor` — declare `numeric`/`badge`
  on the column instead, so sorting and search still work on the real value
- Do not use `export default` — named exports only
