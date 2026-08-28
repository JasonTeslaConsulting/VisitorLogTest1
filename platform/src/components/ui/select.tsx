import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";

import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { PiCaretDown, PiCheck, PiCaretUp } from "react-icons/pi";

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  );
}

/**
 * Height and width are resolved through `cn()` — deliberately NOT as `data-[size=…]:h-10`
 * variants.
 *
 * A `data-*` variant compiles to `.cls[data-size="default"]`, which outranks a caller's plain
 * `.h-8` on specificity, so the override loses no matter what order the classes are in and no
 * matter what `tailwind-merge` does. That is not hypothetical: `Pagination`'s page-size picker
 * asked for `h-8 w-[70px]` and silently rendered at the trigger's default height for as long as
 * the variant form was in place. Passing plain utilities through `cn()` keeps them in the same
 * specificity band, so `tailwind-merge` can drop the losing one and `className` wins as every
 * other component here promises.
 *
 * `data-size` / `data-width` stay on the element as attributes: they cost nothing, they make the
 * resolved value visible in devtools, and children can target them.
 */
const TRIGGER_HEIGHTS = {
  sm: "h-8",
  md: "h-9",
  default: "h-10",
} as const;

const TRIGGER_WIDTHS = {
  xs: "w-24",
  sm: "w-40",
  md: "w-56",
  lg: "w-80",
  full: "w-full",
} as const;

function SelectTrigger({
  className,
  size = "default",
  width = "full",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  /**
   * Height. `default` (40px) matches `Input` and `Button`; `md` (36px) matches the DataTable
   * toolbar's Searchbar and RefreshButton; `sm` (32px) is the compact one.
   */
  size?: "sm" | "md" | "default";
  /**
   * Width. Defaults to filling the container, like `Input` — DESIGN.md §6 Forms. Pass a named
   * width for a toolbar control that should not stretch, or a `className` for anything else.
   */
  width?: "xs" | "sm" | "md" | "lg" | "full";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      data-width={width}
      className={cn(
        "flex items-center justify-between gap-1.5 rounded-sm border border-border-dark bg-card px-3 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-disabled-text aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        TRIGGER_HEIGHTS[size],
        TRIGGER_WIDTHS[width],
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <PiCaretDown className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <PiCheck className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <PiCaretUp />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <PiCaretDown />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
