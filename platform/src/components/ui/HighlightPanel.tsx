import * as React from "react";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

/**
 * A recessed, filled panel that sits INSIDE a card to make a block of content stand apart —
 * a leading instructional banner at the top of a form, a note in the middle of one, or just a
 * darker section wrapping arbitrary children.
 *
 * This is the surface use of `--highlight` that DESIGN.md §2.3 specifies (down to the example:
 * "a leading instructional banner at the top of a form/page"). The token's other job is
 * interaction state — button hover (button.tsx) and table row hover/selection (table.tsx).
 *
 * WHY NOT AN `Alert` VARIANT, since that is where you would look first:
 *  1. `Alert` sets `role="alert"` — an ARIA live region for time-sensitive messages. A static
 *     instructional banner announced on every page load is wrong, and there is no prop to opt out.
 *  2. Every `Alert` variant is `bg-card`: that family colors *text*, it does not fill a surface.
 *  3. DESIGN.md §2.3 calls highlight explicitly "not a status color", while `Alert`'s variants
 *     are exactly the status roles (destructive / success / warning).
 *
 * Fill only — no border and no shadow. Contrast against the card is what separates the two
 * surfaces (DESIGN.md §2.3), and shadow is reserved for dropdowns/modals/popovers.
 */
function HighlightPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="highlight-panel"
      className={cn(
        // `rounded-md` is the card-family radius (CLAUDE.md § Radius). Note alert.tsx uses
        // `rounded-lg` — not followed here, since that step is specified for modals and sheets.
        //
        // The grid only appears when a direct-child <svg> is present, so an icon lines up with
        // the title and the description indents under it without the caller adding a wrapper
        // div. Same technique as alert.tsx. With no icon this stays a plain block.
        "group/highlight-panel grid w-full gap-1 rounded-md bg-highlight p-4 text-left has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-muted-foreground *:[svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function HighlightPanelTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="highlight-panel-title"
      className={cn(
        "text-sm font-medium text-foreground group-has-[>svg]/highlight-panel:col-start-2",
        className,
      )}
      {...props}
    />
  );
}

function HighlightPanelDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="highlight-panel-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { HighlightPanel, HighlightPanelTitle, HighlightPanelDescription };
