/**
 * InfoTable — read-only label/value rows, label on the left, value on the right.
 *
 * Named "table" because that is what it is called in conversation and in the designs; it renders a
 * `<dl>`, not a `<table>`, because these are term/description pairs rather than tabular data with
 * meaningful columns. A real `<table>` would promise a header row and sortable columns that this
 * does not have.
 *
 * **Values wrap; they are never truncated.** A summary exists to confirm what was submitted, so
 * hiding half of a company name or a timestamp behind an ellipsis defeats the point. On a narrow
 * screen a long value wraps to two or three lines against a short label. That is deliberate — the
 * layout stays side-by-side at every width so the reading pattern never changes mid-breakpoint.
 *
 * Distinct from `DetailPage`'s summary list, which stacks label *above* value. That shape suits a
 * dense sidebar of many short fields; this one suits a handful of fields the reader scans by label.
 */
import { cn } from "@framework/lib/shadcn/shadcn-utils";

type InfoTableRow = {
  label: React.ReactNode;
  /** A `ReactNode`, so a row can hold a `Badge`, a `Chip`, or a formatted date. */
  value: React.ReactNode;
};

type InfoTableProps = {
  rows: InfoTableRow[];
  /** Hairline between rows. Off for two or three rows, on once the list needs scanning. */
  dividers?: boolean;
  className?: string;
};

const InfoTable = ({ rows, dividers = true, className }: InfoTableProps) => {
  return (
    <dl
      data-slot="info-table"
      className={cn(
        "text-sm",
        dividers && "divide-y divide-border border-y border-border",
        className,
      )}
    >
      {rows.map((row, index) => (
        <div
          // The label is the natural key, but it is a ReactNode and callers may legitimately
          // repeat one (two "Item" rows), so the index is the honest choice here. These rows are
          // never reordered or filtered in place, which is what makes it safe.
          key={index}
          className="flex items-start justify-between gap-4 py-3"
        >
          <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
          {/* min-w-0 is what lets a long value wrap instead of forcing the row wider than the
              card — a flex item defaults to min-width:auto and refuses to shrink below its
              content. Without it the card itself overflows on a phone. */}
          <dd className="min-w-0 text-right font-medium text-foreground">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export { InfoTable };
export type { InfoTableProps, InfoTableRow };
