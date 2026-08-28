/**
 * useFilterDraft
 *
 * Draft-then-apply state for a `FilterSheet` (`src/components/ui/FilterSheet.tsx`)
 * — or any other filter UI. Fields bind to `draftFilters`; nothing takes effect
 * until `applyFilters` runs, which is what lets a filter panel have an Apply
 * button instead of refetching on every keystroke.
 *
 * `useTableState` composes this rather than owning filter state itself, so a
 * page that needs a filter panel with no table at all (see /sample/advanced)
 * gets the identical apply/discard behaviour from the same hook.
 *
 * **Do not call `setDraftFilter` and `applyFilters` in the same handler.** `applyFilters` closes
 * over `draftFilters` from the render that created it, so before React re-renders it commits the
 * PREVIOUS draft — the applied value ends up one interaction behind, which looks like a caching bug
 * rather than a closure. That is the reason a control meant to apply immediately (a scope selector
 * in the toolbar) uses `useTableState`'s `scope`/`setScope` instead of routing through this draft.
 */

import { useCallback, useMemo, useState } from "react";
import type { FilterValues } from "@framework/types/filters";

type UseFilterDraftOptions = {
  initial?: FilterValues;
  /** Fires after applyFilters or clearFilters — the two moments the applied set changes. */
  onApplied?: () => void;
};

// Drops empty values and sorts keys before comparing, so isFilterDirty doesn't
// report a change when a field was cleared then re-set to the same value —
// draft and applied can differ in key *order* alone, which a plain
// JSON.stringify(a) !== JSON.stringify(b) would misreport as dirty.
function normalize(values: FilterValues): string {
  const entries = Object.entries(values)
    .filter(([, v]) => v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

export function useFilterDraft({
  initial = {},
  onApplied,
}: UseFilterDraftOptions = {}) {
  const [filters, setFilters] = useState<FilterValues>(initial);
  const [draftFilters, setDraftFilters] = useState<FilterValues>(initial);

  const setDraftFilter = useCallback((key: string, value: string | null) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters(draftFilters);
    onApplied?.();
  }, [draftFilters, onApplied]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setDraftFilters({});
    onApplied?.();
  }, [onApplied]);

  const discardDraft = useCallback(() => {
    setDraftFilters(filters);
  }, [filters]);

  const isFilterDirty = useMemo(
    () => normalize(draftFilters) !== normalize(filters),
    [draftFilters, filters],
  );

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== null && v !== "").length,
    [filters],
  );

  return {
    filters,
    draftFilters,
    setDraftFilter,
    applyFilters,
    clearFilters,
    discardDraft,
    isFilterDirty,
    activeFilterCount,
  };
}
