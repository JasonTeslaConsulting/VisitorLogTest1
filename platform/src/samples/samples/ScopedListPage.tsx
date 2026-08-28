/**
 * Sample: Scoped List Page — the data is pre-scoped by selectors before you see any of it.
 *
 * The distinction this sample exists to make: **a scope is not a filter.**
 *
 * - A **scope** (company, year) is REQUIRED and always visible in the toolbar. It decides *which
 *   dataset* you are looking at. There is no "no company" state, so it cannot be cleared, and it
 *   applies the instant you change it.
 * - A **filter** is an OPTIONAL refinement *within* that dataset. It lives in the `FilterSheet`,
 *   is draft-then-apply, and clearing it is meaningful.
 *
 * That is why scope lives in `useTableState`'s `scope`/`setScope` and not in `filters`: a required
 * selector must never be counted in the filter badge, and Clear all must never empty it into a state
 * the page cannot render. `setScope` also returns to page 1, because a scope change replaces the
 * dataset and page 4 of the old one means nothing.
 *
 * Both are shown together on purpose — scope on the left of the toolbar's right group, then the
 * filter sheet for refinement. What you should NOT copy is putting an *optional* filter inline while
 * also offering a sheet: users then have two places to look for the same control.
 *
 * **Which shape a page uses is the user's decision, not Claude's.** Ask. A list that is only ever
 * read one-company-at-a-time wants scope selectors; a list read whole and occasionally narrowed
 * wants a filter sheet.
 *
 * Also here, because nothing else in the repo exercised them:
 * - a **single** row action, which `RowActionsCell` renders as a bare icon button rather than a ⋮ menu
 * - a row-level `Switch` with `color="secondary"`, per DESIGN.md § Tables — primary orange is
 *   reserved for the screen's one main action, and a table can have many independent toggles
 *
 * `mode="client"` with inline mock data so it renders on a fresh clone with no .env.
 */

import { useMemo, useState } from "react";
import { PiTrash } from "react-icons/pi";
import { toast } from "@framework/components/ui/toast";
import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { DataTable } from "@framework/components/ui/datatable/DataTable";
import { Field, FieldLabel } from "@framework/components/ui/field";
import { FilterSheet } from "@framework/components/ui/FilterSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";
import { Switch } from "@framework/components/ui/switch";
import { useTableState } from "@framework/hooks/useTableState";
import type { DataTableColumn, RowAction } from "@framework/types/table";

type Holiday = {
  id: string;
  company: string;
  year: string;
  date: string;
  name: string;
  inLieu: boolean;
};

const COMPANIES = ["Tesla Consulting Pte Ltd", "Acme Industrial Pte Ltd"];
const YEARS = ["2026", "2025"];

const HOLIDAYS: Holiday[] = [
  {
    id: "1",
    company: COMPANIES[0],
    year: "2026",
    date: "01 Jan 2026",
    name: "New Year's Day",
    inLieu: false,
  },
  {
    id: "2",
    company: COMPANIES[0],
    year: "2026",
    date: "17 Feb 2026",
    name: "Chinese New Year",
    inLieu: false,
  },
  {
    id: "3",
    company: COMPANIES[0],
    year: "2026",
    date: "18 Feb 2026",
    name: "Chinese New Year (second day)",
    inLieu: false,
  },
  {
    id: "4",
    company: COMPANIES[0],
    year: "2026",
    date: "03 Apr 2026",
    name: "Good Friday",
    inLieu: false,
  },
  {
    id: "5",
    company: COMPANIES[0],
    year: "2026",
    date: "01 May 2026",
    name: "Labour Day",
    inLieu: false,
  },
  {
    id: "6",
    company: COMPANIES[0],
    year: "2026",
    date: "31 May 2026",
    name: "Vesak Day",
    inLieu: false,
  },
  {
    id: "7",
    company: COMPANIES[0],
    year: "2026",
    date: "01 Jun 2026",
    name: "Vesak Day (in lieu)",
    inLieu: true,
  },
  {
    id: "8",
    company: COMPANIES[0],
    year: "2026",
    date: "04 Jul 2026",
    name: "Mental Wellness Day",
    inLieu: true,
  },
  {
    id: "9",
    company: COMPANIES[0],
    year: "2026",
    date: "09 Aug 2026",
    name: "National Day",
    inLieu: false,
  },
  {
    id: "10",
    company: COMPANIES[0],
    year: "2026",
    date: "10 Aug 2026",
    name: "National Day (in lieu)",
    inLieu: true,
  },
  {
    id: "11",
    company: COMPANIES[0],
    year: "2026",
    date: "08 Nov 2026",
    name: "Deepavali",
    inLieu: false,
  },
  {
    id: "12",
    company: COMPANIES[0],
    year: "2026",
    date: "25 Dec 2026",
    name: "Christmas Day",
    inLieu: false,
  },
  {
    id: "13",
    company: COMPANIES[0],
    year: "2025",
    date: "01 Jan 2025",
    name: "New Year's Day",
    inLieu: false,
  },
  {
    id: "14",
    company: COMPANIES[0],
    year: "2025",
    date: "18 Apr 2025",
    name: "Good Friday",
    inLieu: false,
  },
  {
    id: "15",
    company: COMPANIES[0],
    year: "2025",
    date: "09 Aug 2025",
    name: "National Day",
    inLieu: false,
  },
  {
    id: "16",
    company: COMPANIES[1],
    year: "2026",
    date: "01 Jan 2026",
    name: "New Year's Day",
    inLieu: false,
  },
  {
    id: "17",
    company: COMPANIES[1],
    year: "2026",
    date: "01 May 2026",
    name: "Labour Day",
    inLieu: false,
  },
  {
    id: "18",
    company: COMPANIES[1],
    year: "2026",
    date: "25 Dec 2026",
    name: "Christmas Day",
    inLieu: false,
  },
  {
    id: "19",
    company: COMPANIES[1],
    year: "2025",
    date: "25 Dec 2025",
    name: "Christmas Day",
    inLieu: false,
  },
];

export const ScopedListPage = () => {
  // The scope has to start somewhere — a required selector has no empty state.
  const state = useTableState({
    initialPerPage: 10,
    initialScope: { company: COMPANIES[0], year: YEARS[0] },
  });
  const [inLieu, setInLieu] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(HOLIDAYS.map((h) => [h.id, h.inLieu])),
  );

  // Scope narrows to the dataset; the filter then refines within it. In a real page both would be
  // query parameters — `state.scope` and `state.filters` are both shaped to drop into a query key.
  const rows = useMemo(() => {
    const scoped = HOLIDAYS.filter(
      (h) => h.company === state.scope.company && h.year === state.scope.year,
    );
    const only = state.filters.inLieu;
    if (!only) return scoped;
    return scoped.filter((h) => String(inLieu[h.id]) === only);
  }, [state.scope.company, state.scope.year, state.filters.inLieu, inLieu]);

  const columns: DataTableColumn<Holiday>[] = useMemo(
    () => [
      {
        id: "date",
        header: "Date",
        accessor: (row) => row.date,
        sortable: true,
      },
      {
        id: "name",
        header: "Holiday",
        accessor: (row) => row.name,
        sortable: true,
      },
      {
        id: "inLieu",
        header: "Is in-lieu",
        accessor: (row) => (
          <Field orientation="horizontal" className="w-auto">
            {/* color="secondary", not primary: DESIGN.md § Tables reserves primary for the
                screen's one main action, and a table can hold many independent toggles. */}
            <Switch
              id={`in-lieu-${row.id}`}
              color="secondary"
              checked={inLieu[row.id]}
              onCheckedChange={(next) => {
                setInLieu((prev) => ({ ...prev, [row.id]: next }));
                toast.success(
                  `${row.name} — in-lieu ${next ? "enabled" : "disabled"}`,
                );
              }}
            />
            <FieldLabel htmlFor={`in-lieu-${row.id}`}>
              {inLieu[row.id] ? "Yes" : "No"}
            </FieldLabel>
          </Field>
        ),
      },
    ],
    [inLieu],
  );

  // One action, so RowActionsCell renders it as a bare icon button rather than hiding it in a ⋮ menu.
  const actions = (row: Holiday): RowAction[] => [
    {
      label: "Delete",
      icon: PiTrash,
      destructive: true,
      onClick: () => toast.success(`Deleted ${row.name}`),
    },
  ];

  return (
    <SingleCardTemplate
      title="Public holidays"
      subtitle="Pick a company and year, then adjust that calendar."
      width="wide"
    >
      <DataTable
        mode="client"
        columns={columns}
        data={rows}
        state={state}
        queryKey={["sample-holidays", state.scope]}
        actions={actions}
        searchPlaceholder="Search holidays"
        rightSlot={
          <>
            {/* Named size/width rather than hand-rolled classes: `md` is the 36px
                toolbar height that Searchbar and RefreshButton use, and the
                FilterSheet trigger beside it. */}
            <Select
              value={state.scope.company}
              onValueChange={(value) => state.setScope("company", value)}
            >
              <SelectTrigger aria-label="Company" size="md" width="md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANIES.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={state.scope.year}
              onValueChange={(value) => state.setScope("year", value)}
            >
              <SelectTrigger aria-label="Year" size="md" width="xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        filterSheet={
          <FilterSheet
            activeCount={state.activeFilterCount}
            onClear={state.clearFilters}
            onApply={state.applyFilters}
            onDiscard={state.discardDraft}
            canApply={state.isFilterDirty}
            showLabel={false}
          >
            <Field>
              <FieldLabel htmlFor="filter-in-lieu">In-lieu only</FieldLabel>
              <Select
                value={state.draftFilters.inLieu ?? ""}
                onValueChange={(value) =>
                  state.setDraftFilter("inLieu", value || null)
                }
              >
                <SelectTrigger id="filter-in-lieu">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In-lieu only</SelectItem>
                  <SelectItem value="false">Not in-lieu</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FilterSheet>
        }
      />
    </SingleCardTemplate>
  );
};
