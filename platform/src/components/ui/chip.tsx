/**
 * Chip — a selected *value* with an optional remove control.
 *
 * NOT a `Badge`. Badge is a non-interactive status pill (`rounded-full`, wording only,
 * DESIGN.md §6 Badges); a chip is a value you can take back out, and DESIGN.md §5 puts chips
 * on `--radius-sm` alongside inputs and buttons. The Primitives page carried a placeholder
 * saying this component didn't exist yet — this is it.
 *
 * Fill is `bg-highlight`, not `bg-muted`. In this repo `--muted` is 97% lightness, which
 * `src/theme.css` itself records as "nearly invisible against the page background" (it is why
 * the switch track was moved off it), and `--muted` is reserved for table zebra striping.
 * `--highlight`'s documented role includes "selection highlights", which is what a chip is.
 */
import { PiX } from "react-icons/pi";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

type ChipProps = React.ComponentProps<"span"> & {
  /**
   * Renders a trailing remove button. Omit for a read-only chip — a summary chip such as
   * MultiSelect's "All" deliberately has none, because "remove all" is ambiguous.
   */
  onRemove?: () => void;
  /** Accessible name for the remove button, e.g. "Remove Alpha". Required with `onRemove`. */
  removeLabel?: string;
  disabled?: boolean;
};

const Chip = ({
  className,
  children,
  onRemove,
  removeLabel,
  disabled,
  ...props
}: ChipProps) => {
  return (
    <span
      data-slot="chip"
      data-disabled={disabled || undefined}
      className={cn(
        "inline-flex h-5 max-w-40 shrink-0 items-center gap-1 overflow-hidden rounded-sm border border-border bg-highlight px-1.5 text-xs font-medium text-foreground",
        "data-disabled:text-disabled-text",
        onRemove && !disabled && "pr-0.5",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          aria-label={removeLabel}
          className="inline-flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-border hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-secondary"
          /*
           * A chip lives inside a clickable container — MultiSelect renders chips inside the
           * combobox trigger. Base UI's combobox trigger opens on **mousedown**
           * (combobox/trigger/ComboboxTrigger.js: `useClick(..., { event: 'mousedown' })`),
           * so stopping `click` alone is not enough: the popup would open on the way to
           * removing the chip. And the trigger is a non-native button, whose keyboard
           * activation is synthesised from keydown, so Enter/Space need stopping too.
           *
           * All four handlers are load-bearing. Do not delete them as redundant.
           */
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
            }
          }}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <PiX className="size-3" />
        </button>
      )}
    </span>
  );
};

export { Chip };
export type { ChipProps };
