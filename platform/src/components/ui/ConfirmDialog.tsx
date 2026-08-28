/**
 * ConfirmDialog
 *
 * The one way a destructive or hard-to-reverse action gets confirmed —
 * components-rules.md requires destructive actions to sit inside an AlertDialog,
 * and every page was otherwise rebuilding ~25 lines of AlertDialog scaffolding.
 *
 * Action buttons render bottom-right, Cancel immediately left of the confirming
 * action — DESIGN.md §7 applies that placement to modals as well as forms and
 * side sheets, and says not to vary it per screen. (This used to claim modals
 * were a deliberate centred exception; no such exception exists in DESIGN.md.)
 *
 * `description` must state the consequence, not just ask "are you sure?"
 * (DESIGN.md §8).
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@framework/components/ui/alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** State what will happen, e.g. "This removes 3 records permanently." */
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "secondary";
  isPending?: boolean;
  onConfirm: () => void;
  className?: string;
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isPending,
  onConfirm,
  className,
}: ConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {/* AlertDialogFooter right-aligns at sm: per DESIGN.md §7. */}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "secondary" ? "secondary" : "default"}
            isLoading={isPending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
