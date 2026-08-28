import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-border outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-secondary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-secondary data-checked:bg-secondary data-checked:text-secondary-foreground dark:data-checked:bg-secondary data-disabled:border-control-disabled! data-disabled:bg-control-disabled!",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary-foreground group-data-disabled/radio-group-item:bg-control-disabled-icon" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
