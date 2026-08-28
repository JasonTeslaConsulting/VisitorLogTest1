import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { PiCheck } from "react-icons/pi";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-border shadow-xs transition-shadow outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-secondary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-secondary data-checked:bg-secondary data-checked:text-secondary-foreground dark:data-checked:bg-secondary data-disabled:border-control-disabled! data-disabled:bg-control-disabled! data-disabled:text-control-disabled-icon!",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <PiCheck />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
