import * as React from "react";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // `[a:hover>&]` is the interactive-card state from DESIGN.md §6: a Card that is a link's
        // direct child IS an interactive card, so the stronger edge applies with nothing to opt
        // into and nothing to remember. --elevation-2 is §5's role for it — a border/outline colour
        // change, never a shadow, since §6 allows cards no shadow at any state. Expressed on the
        // ring because this card's edge is a ring, not a border.
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-md bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 transition-[--tw-ring-color] [--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(6)] [a:hover>&]:ring-elevation-2 has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-md *:[img:last-child]:rounded-b-md",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // Column count is derived from which slots are present, so a caller never sets grid
        // classes by hand: [1fr auto] with an action, [auto 1fr] with a CardMedia, and
        // [auto 1fr auto] with both. `gap-x` only appears once there is a leading column to
        // separate from — the vertical `gap-1` stays the title/description rhythm.
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-md px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] has-data-[slot=card-media]:grid-cols-[auto_1fr] has-data-[slot=card-media]:gap-x-4 has-data-[slot=card-media]:has-data-[slot=card-action]:grid-cols-[auto_1fr_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-normal font-medium",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        // col-start-2 is right for [1fr auto]; with a CardMedia the grid gains a leading column
        // and the action has to move over, or it lands on top of the title. Keyed off the
        // header's group rather than `has-`, because the media is a SIBLING, not a descendant.
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end group-has-data-[slot=card-media]/card-header:col-start-3",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A leading icon/graphic slot inside CardHeader — the `[icon] [title + description] [chevron]` row.
 *
 * Mirrors `AlertDialogMedia` in alert-dialog.tsx: a rounded `bg-muted` square that spans both
 * header rows and sizes an unsized child `svg` for you. Smaller than the dialog's `size-16`,
 * because a card row is not a dialog's hero slot.
 *
 * `row-span-2` is what keeps the icon beside the title/description pair rather than above it. Note
 * that with a title and NO description the header has one explicit row, so the span creates an
 * implicit second one — harmless, and the same property `AlertDialogMedia` has.
 */
function CardMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-media"
      className={cn(
        "row-span-2 inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted *:[svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // Divider spacing is 16px on BOTH sides of the rule, not 24. The space *above* belongs to
        // the card's own flex gap, so the footer can only claw it back with a negative margin —
        // and expressing that as `1rem - var(--card-spacing)` rather than a flat `-mt-2` makes it
        // self-neutralising: −8px at the default 24px spacing (24→16), and 0 on a compact card
        // where --card-spacing is already 16px. A hardcoded -mt-2 would over-tighten that one to
        // 8px. Both are gated on `border-t`, so a plain metadata footer is untouched.
        "flex items-center rounded-b-md px-(--card-spacing) [.border-t]:mt-[calc(var(--spacing)*4-var(--card-spacing))] [.border-t]:pt-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardMedia,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
