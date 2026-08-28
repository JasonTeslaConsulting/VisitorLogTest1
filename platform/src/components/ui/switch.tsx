import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

function Switch({
  className,
  size = "default",
  color = "secondary",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
  /** Track color when on — "secondary" is for table row-level switches, where primary orange
   * stays reserved for the view's one main action (DESIGN.md §6 Tables) */
  color?: "primary" | "secondary";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-color={color}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-[color=primary]:data-checked:bg-primary data-[color=secondary]:data-checked:bg-secondary data-unchecked:bg-switch-track-off data-disabled:cursor-not-allowed data-disabled:bg-control-disabled!",
        className,
      )}
      {...props}
    >
      {/* translate-x-[1px] (rest) and calc(100%-3px) (checked) both land the thumb 2px from the
          track edge, per DESIGN.md §6 — not 1px/2px as they read. The track's own 1px border
          already consumes 1px of the inset before either transform runs, so both offsets are one
          pixel short of a naive calc; verified empirically via getBoundingClientRect, not derived
          from Base UI's docs. */}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-3px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-3px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-[1px] group-data-[size=sm]/switch:data-unchecked:translate-x-[1px] dark:data-unchecked:bg-primary-foreground group-data-disabled/switch:bg-control-disabled-knob"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
