/**
 * Filter values for any draft-then-apply filter panel (`FilterSheet` +
 * `useFilterDraft`), not just `DataTable`'s. Kept out of `src/types/table.ts`
 * so that seam stays scoped to what `DataTable` maps onto TanStack.
 *
 * Not in `src/types/index.ts`'s barrel, matching `table.ts`'s own convention —
 * both are imported directly as `@/types/filters` / `@/types/table`.
 */

/** Filter values keyed by field. `null` means "not filtering on this". */
export type FilterValues = Record<string, string | null>;

/**
 * Scope values keyed by field — which dataset the page is looking at, e.g.
 * `{ company: "acme", year: "2026" }`.
 *
 * A **scope** is not a filter, and the difference is why this type exists. A filter is an optional
 * refinement *within* a dataset: it can be absent, it lives in a `FilterSheet`, and clearing it is
 * meaningful. A scope is *required* and always visible in the toolbar — there is no "no company"
 * state to clear to, which is why the values here are `string` and never `null`.
 *
 * Held by `useTableState` (`scope`/`setScope`) rather than alongside filters, so a required scope is
 * never counted in a filter badge nor wiped by Clear all.
 */
export type ScopeValues = Record<string, string>;
