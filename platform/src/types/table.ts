/**
 * DataTable's public vocabulary.
 *
 * **This file must never import from `@tanstack/react-table`.** It is the seam
 * that keeps the table library out of page code: `DataTable` maps these types
 * onto TanStack's internally, so a v8 -> v9 upgrade rewrites only that mapping
 * and touches no page. ESLint enforces the import ban outside
 * `src/components/ui/datatable/**`. See `docs/architecture/datatable.md`.
 */

import type { IconType } from "react-icons";
import type { FilterValues, ScopeValues } from "@framework/types/filters";

/**
 * Badge variants, mirrored from `badge.tsx`'s `cva` config. Kept as a type here (not imported from
 * the component) because `types/table.ts` may not import React/JSX-bearing modules — see the file
 * header. A drift between the two shows up as a type error at the `<Badge variant={...}>` call
 * site in `DataTable.tsx`, not as a silent mismatch.
 */
export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "outline"
  | "ghost"
  | "link";

/**
 * Declarative number formatting for a column. The accessor returns the *raw* value — never a
 * pre-formatted string — because the accessor's return value doubles as the sort key and the
 * client-mode search value (`DataTable.tsx` feeds it straight to TanStack's `accessorFn`). A
 * formatted string like `"SGD 412.00"` sorts lexicographically; a raw `412` sorts numerically.
 * `DataTable` formats it for display via `NumericUtils.formatNumeric`.
 */
export type NumericFormat = {
  /**
   * Required, deliberately not defaulted. 0 for counts, 2 for money, 4 for rates — there is no
   * safe default, and silently rounding a 4dp rate to 2dp is exactly the kind of guess this type
   * exists to prevent.
   */
  decimals: number;
  /** Unit rendered before the number, e.g. "$", "SGD ". */
  prefix?: string;
  /** Unit rendered after the number, e.g. " kg", "%", " days". Omit both for no unit. */
  suffix?: string;
  /** Thousands separators. Default true. */
  grouping?: boolean;
};

/**
 * Declarative status-to-Badge mapping for a column. `variants` is required — the mapping (which
 * status gets which colour) is a decision that must be made explicitly, not defaulted or guessed.
 * `platform/src/lib/constants/status.ts` exports `STATUS_VARIANTS`, a conventional starting point
 * to spread or borrow from; it is not applied automatically.
 *
 * Lookup normalises the raw value to lower-kebab (`"On Hold"` -> `"on-hold"`) before matching a
 * key, but the **label rendered is always the raw value** — only the variant lookup is normalised.
 */
export type BadgeFormat = {
  /** Raw status value (normalised to lower-kebab) -> Badge variant. */
  variants: Record<string, BadgeVariant>;
  /** Variant used when the value matches no key. Default "secondary". */
  fallback?: BadgeVariant;
};

type ColumnBase<T> = {
  /** Stable key. Also the sort field sent to the API when `sortable`. */
  id: string;
  header: string;
  /** Adds a clickable header with an arrow indicator. */
  sortable?: boolean;
  /** Renders the cell as a link in `text-primary` — the only coloured cell text this allows,
   * alongside a `badge` column's tinted fill. */
  href?: (row: T) => string;
  /** Opt out of `whitespace-nowrap`, for cells holding several badges. */
  wrap?: boolean;
  /** Overrides the default alignment. A `numeric` column is "end" unless told otherwise. */
  align?: "start" | "end";
  /** Tailwind width class for fixed utility columns, e.g. "w-24". */
  className?: string;
  /**
   * Fixed pixel width, e.g. 160. Any column declaring this switches the whole table to
   * `table-fixed` layout (Tailwind's `table-fixed`), so declared widths are exact and the
   * remaining space splits evenly among columns that don't set one — instead of every column's
   * width being a mere content-driven suggestion under the browser's default table layout.
   * Overflowing content truncates with an ellipsis unless `wrap` is set.
   */
  width?: number;
};

type PlainColumn<T> = {
  accessor: (row: T) => React.ReactNode;
  numeric?: never;
  badge?: never;
};

type NumericColumn<T> = {
  /** Raw value — never pre-formatted. See `NumericFormat`'s doc comment for why. */
  accessor: (row: T) => number | string | null | undefined;
  numeric: NumericFormat;
  badge?: never;
};

type BadgeColumn<T> = {
  /** Raw status value — this is also the label rendered inside the Badge. */
  accessor: (row: T) => string | null | undefined;
  badge: BadgeFormat;
  numeric?: never;
};

/**
 * One column. `accessor` is a plain row-in, node-out function rather than
 * TanStack's accessorKey/accessorFn + cell-context DSL — the context object's
 * shape differs between TanStack majors, and a plain function is both total
 * (any JSX works) and version-independent.
 *
 * Three render modes, mutually exclusive by construction (`numeric?: never` / `badge?: never` on
 * the other two arms):
 * - plain — `accessor` returns anything renderable, exactly as before. Every existing column
 *   matches this arm unchanged.
 * - `numeric` — `accessor` returns a raw number/string; `DataTable` formats, right-aligns and
 *   applies tabular figures.
 * - `badge` — `accessor` returns a raw status string; `DataTable` renders it as a `Badge` using
 *   the column's `variants` map.
 *
 * Setting `numeric` and `badge` together is a compile error. Setting `numeric` or `badge` on a
 * column whose accessor returns JSX is a compile error — that mismatch is what caused a real bug
 * (a pre-formatted `"SGD 412.00"` string sorting lexicographically); see
 * `docs/architecture/datatable.md`.
 *
 * That guarantee is checked at the column-DEFINITION site (assigning a literal to this type) and
 * holds regardless of this repo's `strictNullChecks: false`. It does NOT flow back into `col`'s
 * type when a consumer narrows on `col.badge`/`col.numeric` later — `DataTable.tsx`'s
 * `renderColumnContent` documents that gap and the casts it requires.
 */
export type DataTableColumn<T> = ColumnBase<T> &
  (PlainColumn<T> | NumericColumn<T> | BadgeColumn<T>);

/** One entry in a row's action menu. */
export type RowAction = {
  label: string;
  icon?: IconType;
  onClick: () => void;
  /** Routes through ConfirmDialog instead of firing directly. */
  destructive?: boolean;
  disabled?: boolean;
};

/** Our sort shape, not TanStack's `SortingState` ({id, desc}[]). */
export type TableSort = {
  field: string;
  direction: "asc" | "desc";
};

/**
 * Active (applied) filter values, keyed by field. `null` means "not filtering
 * on this". Alias of the table-agnostic `FilterValues` (`src/types/filters.ts`)
 * — kept as its own name here since every table-page reference predates the
 * split and reads more naturally as "table filters".
 */
export type TableFilters = FilterValues;

/**
 * Which dataset the table is showing — the required, always-visible selectors in the toolbar
 * (company, year), as distinct from the optional filters in the sheet. See `ScopeValues`.
 */
export type TableScope = ScopeValues;

/**
 * Everything a page needs to drive a DataTable, from `useTableState`.
 * Shaped to drop straight into a TanStack Query key.
 *
 * Filters are draft-then-apply (`useFilterDraft`, `src/hooks/useFilterDraft.ts`):
 * `filters` is what's actually applied and feeds the query; `draftFilters` is
 * what a `FilterSheet`'s fields bind to while the user is still editing.
 */
export type TableState = {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  resultsPerPage: number;
  setResultsPerPage: (perPage: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  /** Applied filters — what's actually filtering the table. */
  filters: TableFilters;
  /** Unsaved edits, bound to the FilterSheet's fields. */
  draftFilters: TableFilters;
  setDraftFilter: (key: string, value: string | null) => void;
  /** Commits draftFilters -> filters. */
  applyFilters: () => void;
  /** Empties both draft and applied, and commits immediately. */
  clearFilters: () => void;
  /** Reverts draftFilters back to filters — call on closing without applying. */
  discardDraft: () => void;
  /** draftFilters differs from filters (normalised) — gates the Apply button. */
  isFilterDirty: boolean;
  /** Count of active (applied) filters — what the FilterSheet trigger badges. */
  activeFilterCount: number;
  /**
   * The dataset being viewed, driven by the toolbar's scope selectors. Applies immediately — there
   * is no draft, because a scope is required and has nothing to revert to.
   */
  scope: TableScope;
  /** Sets one scope key and returns to page 1. */
  setScope: (key: string, value: string) => void;
  sort: TableSort | null;
  setSort: (sort: TableSort | null) => void;
  /** Bumped whenever page/search/filter/sort changes, so DataTable can drop its selection. */
  selectionResetKey: string;
};
