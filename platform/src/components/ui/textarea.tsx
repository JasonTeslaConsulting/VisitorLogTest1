import * as React from "react";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-sm border border-border-dark bg-card px-2.5 py-2 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-disabled-text aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
