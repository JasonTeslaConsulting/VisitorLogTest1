/**
 * combobox.tsx
 *
 * Generated from shadcn's `base-vega` combobox registry entry, then customized. Divergences from
 * pristine, and why:
 *
 * - **`ComboboxChips` / `ComboboxChip` / `ComboboxChipsInput` / `useComboboxAnchor` deleted**, with
 *   the `anchor` prop and `data-chips` they exist to serve. They implement the *inline* tags-input
 *   layout — chips wrapping inside the field with the text cursor beside them — which this design
 *   system does not use: DESIGN.md § Dropdown / selection menus puts the search field at the top of
 *   the popup and keeps the trigger a fixed-height summary, so that `+N more` has something to
 *   overflow into. `MultiSelect` could not use them anyway: Base UI's `Combobox.Chip` and
 *   `ChipRemove` are `tabIndex: -1` roving composite items reachable only by arrow keys from a
 *   *visible* `Combobox.Input`, and `ChipRemove` removes by composite index and then focuses
 *   `inputRef` — which is unmounted whenever the input lives in the popup. Chips come from
 *   `chip.tsx` instead, removed through `onValueChange`.
 *   **This is the divergence a regeneration is most likely to silently undo.**
 * - **`ComboboxTrigger` renders a `<div role="combobox">`, not a `<button>`**
 *   (`nativeButton={false}`), and carries `SelectTrigger`'s full styling rather than shadcn's bare
 *   caret icon-button. Two reasons. The styling: pristine's trigger is a small addon button for the
 *   inline layout, where ours *is* the field. The element: a removable chip's remove control is a
 *   `<button>`, and a button inside a button is not merely invalid — the parser closes the outer one
 *   at the inner one. Base UI gives the trigger `role="combobox"` and `tabIndex=0` whenever the
 *   input is inside the popup (`combobox/trigger/ComboboxTrigger.js`), which it is by default, so
 *   the div keeps full combobox semantics and the remove buttons stay exposed to assistive tech.
 * - **No vertical padding; height comes from `data-size` plus `items-center`.** A 20px `Chip` and
 *   its focus ring do not fit inside the content box `py-2` leaves at the smaller sizes (20px at
 *   `h-9`, 16px at `h-8`). `SelectTrigger` dropped its own `py-2` for the same reason when the two
 *   were brought onto one size/width scale.
 * - **`size` and `width` mirror `SelectTrigger`'s props**, so the two triggers are
 *   interchangeable in a layout: `default` is 40px tall and fills its container, matching `Input`
 *   and `Button` per DESIGN.md §6 Forms. Horizontal padding is `px-3`, matching `Input`, rather
 *   than pristine's addon-sized inset.
 * - **`disabled:` becomes `data-disabled:` on the trigger** — a `<div>` has no `:disabled`.
 * - **`ComboboxInput` is the popup's search field only.** Pristine's version doubles as the inline
 *   field and renders a `ComboboxTrigger` in a trailing addon; that branch is gone, and a leading
 *   magnifier replaces it. `ComboboxClear` went with it.
 * - **`ComboboxFieldLabel` added**, wrapping Base UI's `Combobox.Label`. shadcn exports no
 *   equivalent, and it is required: `FieldLabel` is a `<label htmlFor>`, and `htmlFor` cannot
 *   associate with a `<div role="combobox">`. Note `ComboboxLabel` keeps shadcn's meaning — the
 *   *group* label — which also matches `select.tsx`'s `SelectLabel`.
 * - **`no-scrollbar` dropped from `ComboboxList`.** It hides the scrollbar outright, where
 *   DESIGN.md § Scrollbars specifies one thin styled gutter for "every scrolling surface, not just
 *   the page: dialogs, sheets, popovers, table bodies". The class is also defined nowhere in this
 *   repo's CSS.
 * - `"use client"` dropped (Vite SPA, no RSC — `components.json` has `"rsc": false`).
 * - Registry import paths rewritten to `@framework/*`, and the `lucide-react` icons the CLI emits —
 *   lucide is not a dependency of this repo — replaced with `react-icons/pi` per DESIGN.md §4.
 *
 * Deliberately left as pristine: `ComboboxItem`'s `data-highlighted:bg-accent`. It looks like it
 * should be `focus:bg-accent` to match `SelectItem`, and it must not be changed to it — Select
 * moves DOM focus onto its items, while Combobox keeps focus in the search input, so a Combobox
 * item is never focused and `focus:` would simply never match.
 *
 * - **`ComboboxList` carries no padding, and the popup's `*:data-[slot=input-group]:*` rules were
 *   rewritten.** Pristine insets the list by `p-1` and floats the search field as a `m-1` box with
 *   its own `border-input/30` fill. Both are dropped: `SelectPrimitive.List` has no padding, so a
 *   highlighted `SelectItem` spans the full width of its menu, and a `ComboboxItem` stopping 4px
 *   short of the popup edge made the two menus visibly different at the one moment a user compares
 *   them — while hovering. The search field is now flush with a `border-b` divider instead, which
 *   also lines it up with the select-all row `MultiSelect` renders directly beneath it.
 *
 * `ComboboxGroup` / `ComboboxLabel` / `ComboboxSeparator` / `ComboboxCollection` are exported
 * without a demo, matching `select.tsx`, whose `SelectGroup` / `SelectLabel` / `SelectSeparator`
 * are likewise unused today. Parity between the two menu primitives beats trimming four
 * passthroughs.
 */
import { Combobox as ComboboxPrimitive } from "@base-ui/react";

import { cn } from "@framework/lib/shadcn/shadcn-utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@framework/components/ui/input-group";
import { PiCaretDown, PiCheck, PiMagnifyingGlass } from "react-icons/pi";

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

/**
 * Labels the trigger, via `aria-labelledby`. Renders a `<div>`, not a `<label>` — which is
 * precisely why it exists: `FieldLabel`'s `htmlFor` cannot reach a `<div role="combobox">`.
 */
function ComboboxFieldLabel({
  className,
  ...props
}: ComboboxPrimitive.Label.Props) {
  return (
    <ComboboxPrimitive.Label
      data-slot="combobox-field-label"
      className={cn(
        "flex items-center gap-2 text-sm leading-snug font-medium select-none",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Height and width are resolved through `cn()` — deliberately NOT as `data-[size=…]:h-10`
 * variants. Same scale and same reasoning as `select.tsx`, so the two triggers stay swappable.
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

function ComboboxTrigger({
  className,
  children,
  size = "default",
  width = "full",
  ...props
}: ComboboxPrimitive.Trigger.Props & {
  /**
   * Height. `default` 40px matches `Input`; `md` 36px matches the DataTable toolbar band.
   *
   * No 32px `sm`, deliberately, even though `SelectTrigger` still offers one. A size scale
   * belongs to the whole field vocabulary or to none of it — `Input` and `Textarea` have no
   * sizes at all, so a compact searchable select would be the only field in the system that
   * could shrink, and pages would reach for it to solve layout problems the rest of the
   * vocabulary cannot. When sizes are introduced properly it should be across every field
   * component at once, and this union should grow then.
   */
  size?: "md" | "default";
  /** Width. Same scale as `SelectTrigger`; fills the container by default, like `Input`. */
  width?: "xs" | "sm" | "md" | "lg" | "full";
}) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      data-size={size}
      data-width={width}
      nativeButton={false}
      render={<div />}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-1.5 rounded-sm border border-border-dark bg-card px-3 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-secondary data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-muted data-disabled:text-disabled-text aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        TRIGGER_HEIGHTS[size],
        TRIGGER_WIDTHS[width],
        className,
      )}
      {...props}
    >
      {children}
      <PiCaretDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  );
}

/**
 * The search field. Render it as the first child of `ComboboxContent` — the popup's
 * `*:data-[slot=input-group]:*` rules are what size and inset it, and keeping it *inside* the popup
 * is what earns the trigger its `role="combobox"` and its tab stop.
 */
function ComboboxInput({
  className,
  children,
  disabled = false,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <InputGroup className={cn("w-auto", className)}>
      <InputGroupAddon align="inline-start">
        <PiMagnifyingGlass className="pointer-events-none size-4 text-muted-foreground" />
      </InputGroupAddon>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:h-9 *:data-[slot=input-group]:rounded-none *:data-[slot=input-group]:border-0 *:data-[slot=input-group]:border-b *:data-[slot=input-group]:border-border *:data-[slot=input-group]:bg-transparent *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <PiCheck className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFieldLabel,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
};
