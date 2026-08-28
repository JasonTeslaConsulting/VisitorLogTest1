/**
 * FilterSheet
 *
 * The chrome around a filter panel: trigger button with an active-count badge,
 * a side sheet, and a Clear all / Apply footer. The fields themselves are
 * domain-specific and come in as `children`. Not table-specific — usable
 * anywhere a draft-then-apply filter panel is needed; pair it with
 * `useFilterDraft` (`src/hooks/useFilterDraft.ts`) for the draft state, or
 * `useTableState`, which already composes that hook for table pages.
 *
 * Deliberate choices worth knowing before changing them:
 *
 * - **Open state is internal**, unlike forms, where build-form-page requires the
 *   parent to own it. A filter sheet has no submit-and-navigate-away semantics,
 *   so lifting the open flag buys nothing and costs three lines on every page.
 * - **Filters apply on a button press, not live.** This used to be the reverse —
 *   every field write applied immediately, on the reasoning that an Apply step
 *   adds a click to a task repeated all day. That held for a fast client-side
 *   table; it holds less well once the default is server-side, where every edit
 *   is a round trip. `onApply`/`onDiscard`/`canApply` below are how a draft gets
 *   committed or thrown away — `FilterSheet` itself holds no draft state, it
 *   just calls back into whatever the page is using to hold one.
 * - **Any dismissal (X, Esc, backdrop) discards, with no separate Cancel
 *   button.** All three already read as "cancel"; a fourth explicit control
 *   next to Clear all / Apply would be one control too many. Pressing Apply
 *   also routes through the same close path — safe by construction, since the
 *   draft equals the applied values right after applying, so the discard that
 *   fires alongside it is a no-op.
 *
 * Uses `Sheet`, not `Drawer`: swipe-to-dismiss is unsafe over inputs, and the
 * side sheet is the container DESIGN.md §6 already sanctions.
 */

import { useState } from "react";
import { PiFunnel } from "react-icons/pi";
import { Badge } from "@framework/components/ui/badge";
import { Button } from "@framework/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@framework/components/ui/sheet";
import { cn } from "@framework/lib/shadcn/shadcn-utils";

type FilterSheetProps = {
  /** Number of filters currently applied — renders as a badge on the trigger. */
  activeCount: number;
  onClear: () => void;
  /** Commits the draft. Called right before the sheet closes. */
  onApply: () => void;
  /** Reverts the draft to the applied values — fires on any dismissal. */
  onDiscard: () => void;
  /** Disables Apply, e.g. while the draft matches what's already applied. */
  canApply?: boolean;
  title?: string;
  /** Hide the trigger's text label, leaving the icon and count badge. */
  showLabel?: boolean;
  children: React.ReactNode;
  className?: string;
};

export const FilterSheet = ({
  activeCount,
  onClear,
  onApply,
  onDiscard,
  canApply = true,
  title = "Filters",
  showLabel = true,
  children,
  className,
}: FilterSheetProps) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onDiscard();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("h-9", !showLabel && "min-w-0 px-2", className)}
            aria-label={title}
          />
        }
      >
        <PiFunnel className="h-3.5 w-3.5" aria-hidden />
        {showLabel && (
          <span className="hidden sm:inline text-muted-foreground">
            {title}
          </span>
        )}
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeCount}
          </Badge>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">{children}</div>

        <SheetFooter className="flex-row justify-end border-t border-border">
          <Button
            variant="ghost"
            onClick={onClear}
            disabled={activeCount === 0}
          >
            Clear all
          </Button>
          <Button
            onClick={() => {
              onApply();
              handleOpenChange(false);
            }}
            disabled={!canApply}
          >
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
