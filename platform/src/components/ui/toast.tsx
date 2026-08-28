import { cva, type VariantProps } from "class-variance-authority";
import {
  PiCheckCircle,
  PiInfo,
  PiWarning,
  PiX,
  PiXCircle,
} from "react-icons/pi";
import { toast as sonnerToast } from "sonner";

import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { Button } from "@framework/components/ui/button";

/**
 * The only sanctioned way to raise a toast. `local/no-direct-toast` blocks importing `sonner`
 * anywhere else, so every toast in the app renders through the component below.
 *
 * WHY toast.custom RATHER THAN STYLING SONNER'S OWN CARD. sonner renders its default card outside
 * the component tree and colours it from CSS custom properties it injects at runtime — so matching
 * this repo's tokens meant overriding nine variables with `!important` (they load after our
 * stylesheet and match on two attributes). tailwind.md §7 has the history; the block that would
 * have done it sat commented out in framework.css for months, referencing a token that never
 * existed.
 *
 * `toast.custom` sidesteps all of it. From sonner's own source:
 *
 *     "data-styled": !Boolean(toast.jsx || toast.unstyled || unstyled)
 *
 * Every default card style is scoped to `[data-styled=true]`, so a custom toast gets NO wrapper
 * styling — ordinary Tailwind classes, no `!important`, and no double card to fight.
 *
 * The look follows DESIGN.md §6: the background is the standard overlay surface in every state and
 * never varies by type. Type is carried by the icon, plus text colour for errors only. This is
 * where Toast diverges from Alert on purpose — Alert tints success and warning text with the
 * `-text` tokens from §2.5, and Toast deliberately does not.
 */

const toastVariants = cva(
  "pointer-events-auto flex w-full items-start gap-3 rounded-md border border-border bg-popover p-4 shadow-lg md:max-w-[364px]",
  {
    variants: {
      // Only the text colour varies. The fill is `bg-popover` above, for every type.
      variant: {
        success: "text-foreground",
        warning: "text-foreground",
        info: "text-foreground",
        error: "text-destructive",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;

const ICONS: Record<ToastVariant, typeof PiInfo> = {
  success: PiCheckCircle,
  warning: PiWarning,
  info: PiInfo,
  error: PiXCircle,
};

type ToastOptions = {
  description?: string;
  /** Pass `Infinity` for a notice that must be dismissed. Always pair it with `closeButton`. */
  duration?: number;
  /**
   * sonner draws no close button for a custom toast (`data-styled=false`), so this one is ours.
   * Without it a `duration: Infinity` toast would be undismissable.
   */
  closeButton?: boolean;
  id?: string | number;
};

function Toast({
  id,
  variant,
  title,
  description,
  closeButton,
}: {
  id: string | number;
  variant: ToastVariant;
  title: string;
  description?: string;
  closeButton?: boolean;
}) {
  const Icon = ICONS[variant];

  return (
    // data-slot, like every other component here — and load-bearing for testing: sonner wraps
    // custom JSX in its own `<div data-content><div data-title>`, so "the first div in the li" is
    // sonner's transparent wrapper, not this card.
    <div
      data-slot="toast"
      data-variant={variant}
      className={cn(toastVariants({ variant }))}
    >
      {/* `text-current` on error only, so the icon goes red with the text; neutral otherwise. */}
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          variant === "error" ? "text-current" : "text-muted-foreground",
        )}
      />
      <div className="flex-1 space-y-1">
        <p data-slot="toast-title" className="text-sm font-medium">
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "text-sm",
              variant === "error"
                ? "text-destructive/90"
                : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {closeButton && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mt-1 -mr-1 shrink-0"
          onClick={() => sonnerToast.dismiss(id)}
        >
          <PiX />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </div>
  );
}

const show =
  (variant: ToastVariant) => (title: string, options?: ToastOptions) => {
    // ONLY DEFINED KEYS. `sonnerToast.custom` computes the toast id and then spreads our data over
    // it — `this.create({ jsx: jsx(id), id, ...data })` — so an explicit `id: undefined` overwrites
    // the id it just computed. `create` then generates a *different* id for the stored toast, while
    // `jsx(id)` has already captured the first one, and `dismiss(thatId)` matches nothing: the close
    // button silently does nothing. Same trap for any other key we forward as undefined.
    const data: { duration?: number; id?: string | number } = {};
    if (options?.duration !== undefined) data.duration = options.duration;
    if (options?.id !== undefined) data.id = options.id;

    // `description`/`closeButton` are ours and handled in the component, not passed to sonner.
    return sonnerToast.custom(
      (id) => (
        <Toast
          id={id}
          variant={variant}
          title={title}
          description={options?.description}
          closeButton={options?.closeButton}
        />
      ),
      data,
    );
  };

/**
 * Deliberately the same call shape as sonner's own (`toast.success(message, options)`), so moving
 * a call site is an import change and nothing else.
 */
export const toast = {
  success: show("success"),
  warning: show("warning"),
  info: show("info"),
  error: show("error"),
  dismiss: sonnerToast.dismiss,
};
