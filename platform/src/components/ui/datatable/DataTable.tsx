/**
 * DataTable
 *
 * Toolbar + table + pagination as one unit. Pagination lives inside because in
 * client mode the row count only exists on the table instance; keeping it
 * outside would make the `mode` switch leak into every page.
 *
 * ------------------------------------------------------------------------
 * This file, and only this file, may import from `@tanstack/react-table`.
 * ------------------------------------------------------------------------
 * Pages speak `DataTableColumn` / `TableSort` / `T[]` (see src/types/table.ts);
 * the mapping onto TanStack's `ColumnDef` / `SortingState` / `RowSelectionState`
 * happens here. That is what makes a v8 -> v9 upgrade a single-file change.
 * ESLint enforces the boundary. See `docs/architecture/datatable.md`.
 *
 * TanStack is used for row models and state only — every cell, header and chrome
 * element is rendered by us, so `flexRender` is deliberately not used. That keeps
 * the version-specific surface as small as possible.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { PiCaretRight, PiTray } from "react-icons/pi";
import { Badge } from "@framework/components/ui/badge";
import { Button } from "@framework/components/ui/button";
import { Checkbox } from "@framework/components/ui/checkbox";
import { EmptyState } from "@framework/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@framework/components/ui/table";
import { Pagination } from "@framework/components/ui/datatable/Pagination";
import { RefreshButton } from "@framework/components/ui/datatable/RefreshButton";
import { SearchBar } from "@framework/components/ui/datatable/Searchbar";
import { SortableHeader } from "@framework/components/ui/datatable/SortableHeader";
import { TableSkeleton } from "@framework/components/ui/datatable/TableSkeleton";
import { RowActionsCell } from "@framework/components/ui/datatable/RowActionsCell";
import { NumericUtils } from "@framework/lib";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import type {
  BadgeFormat,
  BadgeVariant,
  DataTableColumn,
  RowAction,
  TableState,
} from "@framework/types/table";

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  state: TableState;
  /** Query key for the refresh button's cache invalidation. */
  queryKey: unknown[];
  isLoading?: boolean;
  /**
   * "server" (default) — the page's hook does the paging/sorting/filtering and
   * `totalItems` comes from the API's count.
   * "client" — hand it the full array; the table does all three in memory.
   */
  mode?: "server" | "client";
  /** Required in server mode. Derived from the data in client mode. */
  totalItems?: number;
  /**
   * Alternating row fill. **On by default** — DESIGN.md § Tables makes zebra striping the primary
   * row separator ("no additional row divider lines needed"). Pass `false` for a table where the
   * band competes with something, e.g. dense status colour.
   */
  striped?: boolean;
  enableRowSelection?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  /** Per-row menu. One action renders as an icon button, two or more as a ⋮ menu. */
  actions?: (row: T) => RowAction[];
  /**
   * Content revealed beneath a row. Passing this adds the leading expander column; omitting it
   * leaves the table exactly as it was.
   *
   * Return whatever the panel needs — a div, a HighlightPanel, a nested DataTable. The panel is NOT
   * sub-rows sharing these columns, which is what makes it able to hold something with a different
   * shape entirely. The cell supplies the recessed band and padding; this supplies what's inside.
   *
   * For read-only detail the row already carries. Editing, actions, or anything that has to fetch
   * belong in a side sheet — see `.claude/skills/build-datatable/SKILL.md`.
   */
  renderExpanded?: (row: T) => React.ReactNode;
  /** Rows this returns false for get no chevron. Default: every row can expand. */
  canExpand?: (row: T) => boolean;
  /** "multiple" (default) — any number open at once. "single" — opening one closes the last. */
  expandMode?: "multiple" | "single";
  searchPlaceholder?: string;
  /** Beside the search box. */
  leftSlot?: React.ReactNode;
  /** Before the filter/refresh cluster — bulk actions and inline selects go here. */
  rightSlot?: React.ReactNode;
  /** A <FilterSheet> (src/components/ui/FilterSheet.tsx). Omit to hide the filter control entirely. */
  filterSheet?: React.ReactNode;
  showRefreshLabel?: boolean;
  /**
   * Which end of the toolbar the refresh button sits at. `"end"` (default) puts it last, after the
   * filter control; `"start"` puts it immediately right of the search box.
   *
   * A prop rather than something a page places itself, because `build-datatable` forbids a page
   * mounting `RefreshButton` directly — DataTable owns it and its `queryKey`. So the toolbar's
   * positions are still fixed; refresh simply has two of them.
   */
  refreshPosition?: "start" | "end";
  emptyState?: React.ReactNode;
  className?: string;
};

// Right-aligned unless told otherwise: a `numeric` column defaults to "end" so a page doesn't
// have to say `align: "end"` on every one, but an explicit `align` still wins either direction.
function isAlignEnd<T>(col: DataTableColumn<T>): boolean {
  return (col.align ?? (col.numeric ? "end" : "start")) === "end";
}

// "On Hold" -> "on-hold", matching the lower-kebab keys `STATUS_VARIANTS` and a column's own
// `variants` map are written in. Only the lookup is normalised — the label rendered is always the
// raw value, so "On Hold" still displays as "On Hold".
function normalizeStatusKey(value: string): string {
  return value.toLowerCase().replace(/[\s_]+/g, "-");
}

// `variants[key]` types as `BadgeVariant`, not `BadgeVariant | undefined`, under this repo's
// `strict: false` — so nothing here reminds a caller that a miss is possible. The `?? fallback ??
// "secondary"` chain is doing real work at runtime and must not be simplified away.
function resolveBadgeVariant(value: string, format: BadgeFormat): BadgeVariant {
  return (
    format.variants[value] ??
    format.variants[normalizeStatusKey(value)] ??
    format.fallback ??
    "secondary"
  );
}

// The declarative render step for `numeric`/`badge` columns — everything else (plain columns,
// `href` wrapping) is unchanged. Kept separate from the accessor itself because the accessor's
// return value is also the sort key and the search value (see `makeGlobalFilter` below); this is
// purely how that raw value gets *displayed*.
//
// The `as` casts below are not decorative. `DataTableColumn<T>`'s three arms give
// `col.numeric`/`col.badge` real value at the DEFINITION site — a column literal setting both, or
// setting `numeric` with a JSX-returning accessor, fails to typecheck. But this repo's
// `strictNullChecks: false` (tsconfig.json) stops that narrowing from reaching back INTO
// `col.accessor`'s call signature here: `if (col.badge)` narrows the literal type of `col.badge`
// itself, but not the type of the sibling `col.accessor`, which stays the union of all three arms'
// signatures. Confirmed empirically — the same check narrows correctly with `strictNullChecks`
// enabled. Since enabling it project-wide is a large, unrelated change, the cast documents what
// the type already guarantees but can't prove back to itself under this config.
function renderColumnContent<T>(
  col: DataTableColumn<T>,
  row: T,
): React.ReactNode {
  if (col.badge) {
    const raw = col.accessor(row) as string | null | undefined;
    if (raw === null || raw === undefined) return "—";
    return <Badge variant={resolveBadgeVariant(raw, col.badge)}>{raw}</Badge>;
  }
  if (col.numeric) {
    const raw = col.accessor(row) as number | string | null | undefined;
    // Unit lives in its own gutter, not concatenated onto the digits (DESIGN.md § Tables) — the
    // `flex-1 text-right` body keeps the digits right-aligned regardless of which affix is
    // present, so with neither affix this collapses to the plain right-aligned string it always
    // was. `.trim()` is display-only; `col.numeric`'s declared spacing (`"SGD "`, `" days"`) is
    // still what `formatNumeric` concatenates for the search haystack below.
    const { prefix, body, suffix } = NumericUtils.formatNumericParts(
      raw,
      col.numeric,
    );
    return (
      <span className="flex items-baseline gap-3">
        {prefix ? (
          <span className="text-muted-foreground">{prefix.trim()}</span>
        ) : null}
        <span className="flex-1 text-right">{body}</span>
        {suffix ? (
          <span className="text-muted-foreground">{suffix.trim()}</span>
        ) : null}
      </span>
    );
  }
  return col.accessor(row);
}

// Client-mode search, aware of each column's declared render format — not just the default
// `includesString`, which would stringify a React element to "[object Object]".
//
// A `numeric` column matches BOTH its formatted display string ("$1,234.00") and its raw digits
// ("1234"), so a currency symbol or thousands separator in the search term still works even though
// sorting (which reads `row.getValue` independently) stays on the raw number. A `badge` column
// matches its raw status value — newly searchable, where before a badge-returning accessor
// returned a React element and was silently excluded. A plain JSX column stays non-searchable, as
// before.
//
// Factory rather than a fixed function, so it can look up each column's format by id. Memoised in
// the component below: a new function identity re-runs TanStack's filtered row model every render.
function makeGlobalFilter<T>(columns: DataTableColumn<T>[]) {
  const byId = new Map(columns.map((col) => [col.id, col]));

  return function globalFilter(
    row: Row<T>,
    columnId: string,
    filterValue: unknown,
  ): boolean {
    const col = byId.get(columnId);
    const raw = row.getValue(columnId);
    const needle = String(filterValue).toLowerCase();

    const haystacks: string[] = [];
    if (col?.numeric) {
      haystacks.push(
        NumericUtils.formatNumeric(
          raw as number | string | null | undefined,
          col.numeric,
        ),
      );
      haystacks.push(String(raw ?? ""));
    } else if (col?.badge) {
      haystacks.push(String(raw ?? ""));
    } else if (typeof raw === "string" || typeof raw === "number") {
      haystacks.push(String(raw));
    }

    return haystacks.some((haystack) =>
      haystack.toLowerCase().includes(needle),
    );
  };
}

export function DataTable<T>({
  columns,
  data,
  state,
  queryKey,
  isLoading,
  mode = "server",
  totalItems,
  striped = true,
  enableRowSelection = false,
  onSelectionChange,
  actions,
  renderExpanded,
  canExpand,
  expandMode = "multiple",
  searchPlaceholder = "Search...",
  leftSlot,
  rightSlot,
  filterSheet,
  showRefreshLabel = true,
  refreshPosition = "end",
  emptyState,
  className,
}: DataTableProps<T>) {
  const isServer = mode === "server";
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const expandable = Boolean(renderExpanded);

  const sorting = useMemo<SortingState>(
    () =>
      state.sort
        ? [{ id: state.sort.field, desc: state.sort.direction === "desc" }]
        : [],
    [state.sort],
  );

  // TanStack needs accessors to sort and filter on; rendering stays ours.
  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.id,
        accessorFn: (row: T) => col.accessor(row),
        enableSorting: Boolean(col.sortable),
      })),
    [columns],
  );

  // A new function identity re-runs TanStack's filtered row model, so this is memoised on
  // `columns` exactly like `tableColumns` above.
  const globalFilter = useMemo(() => makeGlobalFilter(columns), [columns]);

  // A `width`-bearing column only makes sense under `table-fixed` (see ColumnBase.width's doc
  // comment) — under the default `table-layout: auto` a declared width is just a suggestion the
  // browser can override. Tables with no such column keep today's auto layout untouched.
  const hasFixedWidth = columns.some((col) => col.width != null);

  // Explicit type argument: with an unconstrained `T`, inference from `data`
  // falls back to `unknown` and then rejects every ColumnDef<T>.
  const table = useReactTable<T>({
    data,
    columns: tableColumns,
    state: {
      sorting,
      rowSelection,
      globalFilter: state.searchTerm,
      pagination: {
        pageIndex: state.currentPage - 1,
        pageSize: state.resultsPerPage,
      },
    },
    manualPagination: isServer,
    manualSorting: isServer,
    manualFiltering: isServer,
    rowCount: isServer ? (totalItems ?? 0) : undefined,
    enableRowSelection,
    globalFilterFn: globalFilter,
    // TanStack's default probes only `flatRows[0]` to decide whether a column participates in
    // global search — a single null in the first row silently drops that whole column from every
    // search. `globalFilter` above already decides per-cell, so every column always participates.
    getColumnCanGlobalFilter: () => true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      state.setSort(
        first
          ? { field: first.id, direction: first.desc ? "desc" : "asc" }
          : null,
      );
    },
    onGlobalFilterChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(state.searchTerm) : updater;
      state.setSearchTerm(String(next ?? ""));
    },
    onPaginationChange: (updater) => {
      const current = {
        pageIndex: state.currentPage - 1,
        pageSize: state.resultsPerPage,
      };
      const next = typeof updater === "function" ? updater(current) : updater;
      if (next.pageSize !== current.pageSize)
        state.setResultsPerPage(next.pageSize);
      if (next.pageIndex !== current.pageIndex)
        state.setCurrentPage(next.pageIndex + 1);
    },
    getCoreRowModel: getCoreRowModel(),
    ...(isServer
      ? {}
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
        }),
  });

  // Refs so the effects below don't re-run on every render.
  const tableRef = useRef(table);
  tableRef.current = table;
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  // Drop the selection AND any expansion whenever the visible set of rows changes, so a bulk
  // action can never fire against rows the user can no longer see — and so an expanded panel can
  // never end up attached to a different record. Row ids are positional, so after a sort a stored
  // id points at whatever now sits in that slot; clearing is what makes the positional id safe.
  useEffect(() => {
    setRowSelection({});
    setExpandedRows(new Set());
  }, [state.selectionResetKey]);

  // Switching to "single" while several rows are open would otherwise leave them open until the
  // next click — a state the mode says is impossible. Keeps the most recently opened, which Set
  // insertion order gives us for free.
  useEffect(() => {
    if (expandMode !== "single") return;
    setExpandedRows((open) =>
      open.size > 1 ? new Set([[...open].pop() as string]) : open,
    );
  }, [expandMode]);

  useEffect(() => {
    if (!onSelectionChangeRef.current) return;
    onSelectionChangeRef.current(
      tableRef.current.getSelectedRowModel().rows.map((r) => r.original),
    );
  }, [rowSelection]);

  const rows = table.getRowModel().rows;
  const resolvedTotal = isServer
    ? (totalItems ?? 0)
    : table.getFilteredRowModel().rows.length;
  const columnCount =
    columns.length +
    (expandable ? 1 : 0) +
    (enableRowSelection ? 1 : 0) +
    (actions ? 1 : 0);

  const toggleExpanded = (rowId: string) => {
    setExpandedRows((open) => {
      if (open.has(rowId)) {
        const next = new Set(open);
        next.delete(rowId);
        return next;
      }
      return expandMode === "single"
        ? new Set([rowId])
        : new Set(open).add(rowId);
    });
  };

  const toggleSort = (columnId: string) => {
    if (state.sort?.field !== columnId) {
      state.setSort({ field: columnId, direction: "asc" });
    } else if (state.sort.direction === "asc") {
      state.setSort({ field: columnId, direction: "desc" });
    } else {
      state.setSort(null);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar. Positions are fixed: search left, filter/refresh right. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SearchBar
            value={state.searchTerm}
            onChange={state.setSearchTerm}
            placeholder={searchPlaceholder}
          />
          {refreshPosition === "start" && (
            <RefreshButton queryKey={queryKey} showLabel={showRefreshLabel} />
          )}
          {leftSlot}
        </div>
        <div className="flex items-center gap-2">
          {rightSlot}
          {filterSheet}
          {refreshPosition === "end" && (
            <RefreshButton queryKey={queryKey} showLabel={showRefreshLabel} />
          )}
        </div>
      </div>

      <Table className={hasFixedWidth ? "table-fixed" : undefined}>
        <TableHeader>
          <TableRow>
            {expandable && (
              <TableHead className="w-10">
                {/* No visible label — but the column shouldn't be nameless to a screen reader. */}
                <span className="sr-only">Expand row</span>
              </TableHead>
            )}
            {enableRowSelection && (
              <TableHead className="w-10">
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  indeterminate={
                    table.getIsSomePageRowsSelected() &&
                    !table.getIsAllPageRowsSelected()
                  }
                  onCheckedChange={(checked) =>
                    table.toggleAllPageRowsSelected(Boolean(checked))
                  }
                  aria-label="Select all rows on this page"
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.id}
                // `style` here is the sanctioned exception in local/no-inline-style — a per-column
                // pixel width is a genuinely dynamic value, the same category as Navbar's skeleton
                // widths (see eslint.base.js's ignores list for the full reasoning).
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  isAlignEnd(col) && "text-right",
                  col.width && !col.wrap && "truncate",
                  col.className,
                )}
              >
                {col.sortable ? (
                  <SortableHeader
                    label={col.header}
                    direction={
                      state.sort?.field === col.id ? state.sort.direction : null
                    }
                    onToggle={() => toggleSort(col.id)}
                    // Mirrors the arrow to sit left of the label. Plain `text-right` on the <th>
                    // right-aligns the whole inline-flex button, which otherwise puts the arrow —
                    // not the label — flush against the right edge, away from the digits it's
                    // meant to sort. DOM order stays label-then-icon, so screen-reader order is
                    // unaffected (the icon is aria-hidden).
                    className={cn(isAlignEnd(col) && "flex-row-reverse")}
                  />
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
            {actions && (
              <TableHead className="w-16 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>

        {/* Striping is CSS `nth-child(even)` on TableBody, which breaks the moment a panel row is
            interleaved — every data row then lands on the same parity. So when expanding, the band
            is computed here from the data row's index and applied to BOTH rows of a pair, which
            also makes a row and its panel read as one band. Without expansion the CSS path is left
            exactly as it was, so no existing table is affected. */}
        <TableBody striped={striped && !expandable}>
          {isLoading ? (
            <TableSkeleton columns={columnCount} />
          ) : (
            rows.map((row, index) => {
              const isExpanded = expandedRows.has(row.id);
              const rowCanExpand =
                expandable && (canExpand?.(row.original) ?? true);
              const band =
                striped && expandable && index % 2 === 1
                  ? "bg-muted"
                  : undefined;

              return (
                <Fragment key={row.id}>
                  <TableRow
                    className={band}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {expandable && (
                      <TableCell className="w-10">
                        {rowCanExpand && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded ? "Collapse row" : "Expand row"
                            }
                            onClick={() => toggleExpanded(row.id)}
                          >
                            <PiCaretRight
                              className={cn(
                                "size-4 transition-transform",
                                isExpanded && "rotate-90",
                              )}
                            />
                          </Button>
                        )}
                      </TableCell>
                    )}
                    {enableRowSelection && (
                      <TableCell className="w-10">
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={(checked) =>
                            row.toggleSelected(Boolean(checked))
                          }
                          aria-label="Select row"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        // See the matching TableHead comment above — this is the same sanctioned
                        // no-inline-style exception. Under table-fixed the header row's width is
                        // what the spec keys layout off; setting it here too keeps header/body
                        // symmetric and costs nothing.
                        style={col.width ? { width: col.width } : undefined}
                        className={cn(
                          col.wrap && "whitespace-normal",
                          // Before col.className so a caller's own "normal-nums" still wins —
                          // tailwind-merge groups font-variant-numeric classes together and
                          // resolves by source order, not by which came from a prop vs. a literal.
                          col.numeric && "tabular-nums",
                          isAlignEnd(col) && "text-right",
                          col.width && !col.wrap && "truncate",
                          col.className,
                        )}
                      >
                        {col.href ? (
                          <a
                            href={col.href(row.original)}
                            // block w-full so a numeric column's flex gutter fills the anchor
                            // instead of collapsing to inline content width.
                            className="block w-full text-primary hover:underline"
                          >
                            {renderColumnContent(col, row.original)}
                          </a>
                        ) : (
                          renderColumnContent(col, row.original)
                        )}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="w-16 text-right">
                        <RowActionsCell actions={actions(row.original)} />
                      </TableCell>
                    )}
                  </TableRow>

                  {rowCanExpand && isExpanded && (
                    <TableRow className={band}>
                      {/* whitespace-normal because TableCell is nowrap by default, which would
                          flatten any panel. bg-highlight is DESIGN.md's callout-within-a-card
                          role, and deliberately not bg-muted, which components-rules reserves for
                          zebra striping — the two must never look the same. The parent row keeps
                          its own fill, so the panel reads as recessed beneath it. */}
                      <TableCell
                        colSpan={columnCount}
                        className="bg-highlight/50 p-4 whitespace-normal"
                      >
                        {renderExpanded?.(row.original)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>

      {!isLoading && rows.length === 0 && (
        <div className="border-t border-border">
          {emptyState ?? (
            <EmptyState
              icon={PiTray}
              title="No results found"
              description="Try adjusting your search or filters."
            />
          )}
        </div>
      )}

      <Pagination
        totalItems={resolvedTotal}
        currentPage={state.currentPage}
        resultsPerPage={state.resultsPerPage}
        onPageChange={state.setCurrentPage}
        onResultsPerPageChange={state.setResultsPerPage}
      />
    </div>
  );
}
