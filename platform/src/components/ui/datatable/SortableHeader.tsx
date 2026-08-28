/**
 * SortableHeader
 *
 * A clickable column header with a sort indicator. We own this rather than
 * letting the table library render it, so the whole icon vocabulary is one edit
 * in one file — TanStack only supplies the asc | desc | null state.
 *
 * Sorting is signalled by the **arrow only**. Headers keep their muted-grey
 * styling in every state; colour is reserved for link cells.
 */

import { PiArrowDown, PiArrowUp, PiArrowsDownUp } from "react-icons/pi";
import { cn } from "@framework/lib/shadcn/shadcn-utils";

type SortableHeaderProps = {
  label: string;
  direction: "asc" | "desc" | null;
  onToggle: () => void;
  className?: string;
};

export const SortableHeader = ({
  label,
  direction,
  onToggle,
  className,
}: SortableHeaderProps) => {
  const Icon =
    direction === "asc"
      ? PiArrowUp
      : direction === "desc"
        ? PiArrowDown
        : PiArrowsDownUp;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "-mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      aria-label={`Sort by ${label}${
        direction === "asc"
          ? ", currently ascending"
          : direction === "desc"
            ? ", currently descending"
            : ""
      }`}
    >
      {label}
      <Icon className={cn("size-3", !direction && "opacity-40")} aria-hidden />
    </button>
  );
};
