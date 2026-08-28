import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { PiSpinner } from "react-icons/pi";
import * as React from "react";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // Disabled treatment per DESIGN.md §6 Buttons — Disabled: flat neutral-600 replaces the
      // button's identity color entirely (never dimmed/tinted); filled variants collapse to
      // neutral-600 fill + white text, outlined/transparent variants collapse to a neutral-600
      // border + text on a transparent fill. These are the only two disabled treatments.
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-muted disabled:text-disabled-text",
        outline:
          "border-border-dark text-foreground bg-transparent shadow-xs hover:bg-highlight hover:text-foreground aria-expanded:bg-highlight aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 disabled:border-muted disabled:bg-transparent disabled:text-disabled-text",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-hightlight dark:hover:bg-secondary/90 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground disabled:bg-muted disabled:border-muted disabled:text-disabled-text",
        tertiary:
          "border-border text-foreground bg-transparent shadow-xs hover:bg-highlight hover:text-foreground aria-expanded:bg-highlight aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 disabled:border-muted disabled:bg-transparent disabled:text-disabled-text",
        ghost:
          "hover:bg-highlight hover:text-foreground aria-expanded:bg-highlight aria-expanded:text-foreground dark:hover:bg-highlight/50  disabled:bg-transparent disabled:text-disabled-text",
        // destructive:
        //   "bg-destructive text-destructive-foreground hover:bg-destructive-hover focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 disabled:bg-disabled disabled:text-disabled-text",
        link: "text-info underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default:
          "h-12 sm:h-10 min-w-24 gap-1.5 px-4 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 min-w-24 gap-1 px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 min-w-24 gap-1 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 min-w-24 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  /** Async action in progress — keeps the button's color, replaces label + icons with a spinner */
  isLoading?: boolean;
  /** Icon before the label — e.g. startIcon={<Plus />} */
  startIcon?: React.ReactNode;
  /** Icon after the label — e.g. endIcon={<ChevronDown />} */
  endIcon?: React.ReactNode;
}

function Button({
  className,
  variant = "default",
  size = "default",
  isLoading = false,
  startIcon,
  endIcon,
  children,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        // `relative` goes FIRST so it stays a default the caller can override.
        // It exists only to anchor the isLoading spinner below; when it was
        // appended after `className`, tailwind-merge's last-wins rule silently
        // beat any position class a caller passed — Sheet's close button asked
        // for `absolute top-4 right-4`, got `relative`, and fell to the bottom
        // of the flex column with right-4 pushing it off-screen.
        // A caller overriding to `absolute` still anchors the spinner, since an
        // absolutely-positioned element is itself a containing block.
        "relative",
        buttonVariants({ variant, size, className }),
        isLoading && "pointer-events-none",
      )}
      aria-busy={isLoading || undefined}
      onClick={isLoading ? undefined : onClick}
      {...props}
    >
      {isLoading && (
        <PiSpinner
          className="absolute inset-0 m-auto animate-spin"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "inline-flex items-center gap-2",
          isLoading && "invisible",
        )}
      >
        {startIcon}
        {children}
        {endIcon}
      </span>
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
