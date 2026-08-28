/**
 * PlaceholderRegion
 *
 * A labelled, dashed stand-in for one of a template's holes. Used only by the
 * template preview pages under `src/pages/sample/templates/`, which exist to show
 * the *frame* — width, header placement, card arrangement — with nothing that
 * could be mistaken for a design proposal.
 *
 * `label` names the prop the content would arrive through (`children`, `aside`),
 * so the preview reads as documentation of the shell's API.
 */

import { cn } from "@framework/lib/shadcn/shadcn-utils";

type PlaceholderRegionProps = {
  label: string;
  /** Shown under the label — what belongs here in a real page. */
  hint?: string;
  /** Minimum height class. Regions collapse to nothing without one. */
  className?: string;
};

export const PlaceholderRegion = ({
  label,
  hint,
  className,
}: PlaceholderRegionProps) => {
  return (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-primary p-6 text-center",
        className,
      )}
    >
      <p className="font-mono text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};
