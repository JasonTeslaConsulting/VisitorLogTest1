/**
 * useTableState
 *
 * The state a data table page owns: paging, search, filters and sort. Its values
 * are shaped to drop straight into a TanStack Query key, so a server-side page
 * refetches simply by depending on them.
 *
 * Page resets are built in rather than left to call sites: changing the search
 * term, applying a filter, or changing the sort while sitting on page 4 would
 * otherwise request a page that no longer exists, and every page had to
 * remember `setCurrentPage(1)` by hand.
 *
 * Scope (`scope`/`setScope`) is the sibling of filters and deliberately not part of them: a scope is
 * the REQUIRED, always-visible "which dataset am I looking at" selector in the toolbar (company,
 * year), where a filter is an optional refinement inside that dataset. Keeping them apart is what
 * stops a required scope being counted in the filter badge or wiped by Clear all — and scope applies
 * immediately, since there is nothing to revert to.
 *
 * Filters are draft-then-apply, composed from `useFilterDraft`
 * (`src/hooks/useFilterDraft.ts`) rather than owned here directly — that is what
 * lets a non-table page get the identical FilterSheet apply/discard behaviour.
 *
 * Sort uses this repo's `TableSort` ({ field, direction }), never TanStack's
 * `SortingState` — see `docs/architecture/datatable.md` for why the seam matters.
 */

import { useCallback, useMemo, useState } from "react";
import { PAGINATION } from "@framework/lib/constants/app";
import { useFilterDraft } from "@framework/hooks/useFilterDraft";
import type {
  TableFilters,
  TableScope,
  TableSort,
  TableState,
} from "@framework/types/table";

type UseTableStateOptions = {
  initialPerPage?: number;
  initialSort?: TableSort | null;
  initialFilters?: TableFilters;
  /** Starting dataset. A required scope has to start somewhere. */
  initialScope?: TableScope;
};

export function useTableState({
  initialPerPage,
  initialSort = null,
  initialFilters = {},
  initialScope = {},
}: UseTableStateOptions = {}): TableState {
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPageRaw] = useState(
    initialPerPage ?? PAGINATION.DEFAULT_PAGE_SIZE,
  );
  const [searchTerm, setSearchTermRaw] = useState("");
  const [sort, setSortRaw] = useState<TableSort | null>(initialSort);
  const [scope, setScopeRaw] = useState<TableScope>(initialScope);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  const {
    filters,
    draftFilters,
    setDraftFilter,
    applyFilters,
    clearFilters,
    discardDraft,
    isFilterDirty,
    activeFilterCount,
  } = useFilterDraft({ initial: initialFilters, onApplied: resetPage });

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermRaw(term);
    setCurrentPage(1);
  }, []);

  const setResultsPerPage = useCallback((perPage: number) => {
    setResultsPerPageRaw(perPage);
    setCurrentPage(1);
  }, []);

  const setSort = useCallback((next: TableSort | null) => {
    setSortRaw(next);
    setCurrentPage(1);
  }, []);

  // Identifies "the visible set of rows". DataTable drops its selection whenever
  // this changes, so a bulk action can never fire against rows the user can no
  // longer see — the usual cause of "I approved the wrong records". Depends on
  // APPLIED filters only: the visible rows don't change while a draft is being
  // edited, so selection must survive that.
  // Resets the page here rather than at the call site, the same as every other setter — a scope
  // change replaces the dataset, so page 4 of the old one means nothing.
  const setScope = useCallback(
    (key: string, value: string) => {
      setScopeRaw((prev) => ({ ...prev, [key]: value }));
      resetPage();
    },
    [resetPage],
  );

  const selectionResetKey = useMemo(
    () =>
      JSON.stringify([
        currentPage,
        resultsPerPage,
        searchTerm,
        filters,
        scope,
        sort,
      ]),
    [currentPage, resultsPerPage, searchTerm, filters, scope, sort],
  );

  return {
    currentPage,
    setCurrentPage,
    resultsPerPage,
    setResultsPerPage,
    searchTerm,
    setSearchTerm,
    filters,
    draftFilters,
    setDraftFilter,
    applyFilters,
    clearFilters,
    discardDraft,
    isFilterDirty,
    activeFilterCount,
    scope,
    setScope,
    sort,
    setSort,
    selectionResetKey,
  };
}
