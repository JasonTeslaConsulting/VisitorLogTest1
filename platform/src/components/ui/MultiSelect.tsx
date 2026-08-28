/**
 * MultiSelect — pick several values, shown as chips in the trigger.
 *
 * The trigger is a fixed-height *summary*, not a growing tag field:
 *
 *   nothing selected      → the placeholder
 *   everything selected   → one "All" chip
 *   otherwise             → up to `maxChips` chips, then "+N more"
 *
 * That is why the search field lives at the top of the popup rather than inline in the trigger
 * (DESIGN.md § Dropdown / selection menus): a trigger whose height grows with the selection has
 * nothing for "+N more" to overflow into.
 *
 * Why this is a component and the searchable *single*-select is not: everything below the trigger
 * summary is plain `Combobox*` composition, which a page can do at the call site exactly the way it
 * composes `Select`/`SelectTrigger`/`SelectItem` today. The chip overflow, the "All" collapse and
 * the filter-scoped select-all are the parts that must not be reimplemented per page.
 */
import * as React from "react";
// Straight from Base UI rather than re-exported through combobox.tsx: that file is shadcn
// scaffold, and every line added to it is a line a future regeneration has to have
// reapplied. A sibling in this same folder is allowed to reach the library directly.
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";

import { Chip } from "@framework/components/ui/chip";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFieldLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@framework/components/ui/combobox";
import { cn } from "@framework/lib/shadcn/shadcn-utils";

type MultiSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  /** Controlled only — bind with react-hook-form's `Controller` in a form. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /**
   * Renders a `ComboboxFieldLabel`. Use this rather than wrapping the component in a
   * `FieldLabel htmlFor` — the trigger is a `<div role="combobox">`, and `htmlFor` cannot
   * associate with one. `aria-labelledby` is the escape hatch when the label must live elsewhere.
   */
  label?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-invalid"?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Chips shown in the trigger before the rest collapse into "+N more". */
  maxChips?: number;
  /** Label for the single chip that replaces all the others at full selection. */
  allLabel?: string;
  /** Pinned Select all / Clear row at the top of the popup. */
  showSelectAll?: boolean;
  /** Height: default 40px matches `Input`, `md` 36px matches the DataTable toolbar band. */
  size?: "md" | "default";
  /** Width, same scale as `Select`; fills the container by default. */
  width?: "xs" | "sm" | "md" | "lg" | "full";
  disabled?: boolean;
  /** Submits one form value per selection. */
  name?: string;
  id?: string;
  /** On the trigger. */
  className?: string;
  /** On the popup. */
  contentClassName?: string;
};

const MultiSelect = ({
  options,
  value,
  onValueChange,
  label,
  placeholder = "Select options",
  searchPlaceholder = "Search options",
  maxChips = 3,
  allLabel = "All",
  showSelectAll = true,
  size = "default",
  width = "full",
  disabled,
  name,
  id,
  className,
  contentClassName,
  ...ariaProps
}: MultiSelectProps) => {
  /*
   * Base UI runs on the option objects, not the string values: `{ value, label }` is the shape it
   * derives both the display label and the submitted form value from, so no `itemToStringLabel` or
   * `itemToStringValue` is needed. The mapping to and from `string[]` happens here, at the edge.
   */
  const selected = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const emit = React.useCallback(
    (next: MultiSelectOption[]) => onValueChange(next.map((o) => o.value)),
    [onValueChange],
  );

  return (
    <Combobox
      items={options}
      multiple
      value={selected}
      onValueChange={emit}
      /*
       * Without this, a filter pass that hands back a structurally-equal but non-referential
       * option object would compare false under `Object.is` and silently deselect it.
       */
      isItemEqualToValue={(a: MultiSelectOption, b: MultiSelectOption) =>
        a.value === b.value
      }
      disabled={disabled}
      name={name}
    >
      {label ? <ComboboxFieldLabel>{label}</ComboboxFieldLabel> : null}
      <ComboboxTrigger
        id={id}
        size={size}
        width={width}
        className={className}
        {...ariaProps}
      >
        <ComboboxValue>
          {(current: MultiSelectOption[]) => (
            <MultiSelectSummary
              selected={current}
              total={options.length}
              maxChips={maxChips}
              allLabel={allLabel}
              placeholder={placeholder}
              disabled={disabled}
              onRemove={(option) =>
                emit(current.filter((o) => o.value !== option.value))
              }
            />
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent className={contentClassName}>
        <ComboboxInput placeholder={searchPlaceholder} />
        {showSelectAll && options.length > 0 ? (
          <MultiSelectSelectAll
            selected={selected}
            total={options.length}
            onChange={emit}
          />
        ) : null}
        <ComboboxEmpty>
          {options.length === 0
            ? "No options available."
            : "No options match your search."}
        </ComboboxEmpty>
        <ComboboxList>
          {(option: MultiSelectOption) => (
            <ComboboxItem
              key={option.value}
              value={option}
              disabled={option.disabled}
            >
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

/**
 * The trigger's contents. Split out so the render-prop body stays readable, not because a page
 * would ever render it directly.
 */
const MultiSelectSummary = ({
  selected,
  total,
  maxChips,
  allLabel,
  placeholder,
  disabled,
  onRemove,
}: {
  selected: MultiSelectOption[];
  total: number;
  maxChips: number;
  allLabel: string;
  placeholder: string;
  disabled?: boolean;
  onRemove: (option: MultiSelectOption) => void;
}) => {
  if (selected.length === 0) {
    return <span className="text-muted-foreground">{placeholder}</span>;
  }

  /*
   * `total > 0` is redundant behind the branch above — an empty option list can only ever produce
   * an empty selection — but it is kept so this condition reads correctly on its own. Without it,
   * `0 === 0` claims "All" for a selection of nothing.
   */
  const allSelected = total > 0 && selected.length === total;
  const overflow = selected.length - maxChips;

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
      {allSelected ? (
        /*
         * No remove control on "All", deliberately: "remove all" is ambiguous — clear everything,
         * or drop one? "Clear all" in the popup is the unambiguous action. Same reasoning as
         * "+N more" below, which is a count rather than a value.
         */
        <Chip disabled={disabled}>{allLabel}</Chip>
      ) : (
        <>
          {selected.slice(0, maxChips).map((option) => (
            <Chip
              key={option.value}
              disabled={disabled}
              removeLabel={`Remove ${option.label}`}
              onRemove={() => onRemove(option)}
            >
              {option.label}
            </Chip>
          ))}
          {overflow > 0 ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              +{overflow} more
            </span>
          ) : null}
        </>
      )}
      <span className="sr-only">
        {selected.length} of {total} selected
      </span>
    </span>
  );
};

/**
 * The pinned Select all / Clear row.
 *
 * It acts on the **currently filtered** options and names the count when a query is active. A
 * "Select all" that silently selects two hundred options the user cannot see is the failure mode
 * here, and the label is what prevents it.
 *
 * Its own component because `useFilteredItems()` takes no arguments and reads from context — it
 * only works inside `Combobox`, so this cannot be computed in `MultiSelect`'s body. Reading Base
 * UI's own filtered set rather than re-running a matcher is also what keeps "all matching" and
 * "what is on screen" from drifting apart.
 */
const MultiSelectSelectAll = ({
  selected,
  total,
  onChange,
}: {
  selected: MultiSelectOption[];
  /** Every option, not just the visible ones — this is how "is a query active" is known. */
  total: number;
  onChange: (next: MultiSelectOption[]) => void;
}) => {
  const filtered = ComboboxPrimitive.useFilteredItems<MultiSelectOption>();
  const selectable = filtered.filter((option) => !option.disabled);

  if (selectable.length === 0) {
    return null;
  }

  const selectedValues = new Set(selected.map((o) => o.value));
  const allFilteredSelected = selectable.every((option) =>
    selectedValues.has(option.value),
  );
  /*
   * A query is active exactly when the list is showing fewer options than exist. Compare against
   * the total, NOT against `filtered` — `selectable` is `filtered` minus disabled options, so
   * `selectable.length !== filtered.length` is false whenever nothing is disabled, which is most
   * of the time. That version silently read "Select all" while a query was narrowing the list.
   */
  const isFiltered = filtered.length !== total;

  const label = allFilteredSelected
    ? isFiltered
      ? `Clear ${selectable.length} matching`
      : "Clear all"
    : isFiltered
      ? `Select ${selectable.length} matching`
      : "Select all";

  const apply = () => {
    if (allFilteredSelected) {
      const drop = new Set(selectable.map((o) => o.value));
      onChange(selected.filter((option) => !drop.has(option.value)));
      return;
    }
    const merged = [...selected];
    for (const option of selectable) {
      if (!selectedValues.has(option.value)) {
        merged.push(option);
      }
    }
    onChange(merged);
  };

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 py-1.5 text-xs text-muted-foreground">
      <span>{selected.length} selected</span>
      <button
        type="button"
        onClick={apply}
        className="cursor-pointer rounded-sm px-1 font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-secondary"
      >
        {label}
      </button>
    </div>
  );
};

export { MultiSelect };
export type { MultiSelectOption, MultiSelectProps };
