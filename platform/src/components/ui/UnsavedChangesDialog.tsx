import { ConfirmDialog } from "@framework/components/ui/ConfirmDialog";
import type { UnsavedChangesGuard } from "@framework/hooks/useUnsavedChangesGuard";

/**
 * The confirmation half of `useUnsavedChangesGuard`. Exists so the copy lives in one place instead
 * of being retyped, slightly differently, on every guarded form.
 *
 * Wording follows DESIGN.md §8: state the consequence, don't just ask "Are you sure?". The default
 * labels are verbs the user can act on ("Discard" / "Keep editing") rather than "OK" / "Cancel",
 * which read ambiguously when the question itself is about cancelling.
 *
 * It is a ConfirmDialog, therefore an AlertDialog — Base UI forces `disablePointerDismissal` for
 * those, so the user cannot dodge the question by clicking outside *this* dialog. That matters:
 * a dismissible "are you sure" is not a guard.
 */
export const UnsavedChangesDialog = ({
  guard,
  title = "Discard your changes?",
  description = "The details you've entered won't be saved.",
  confirmLabel = "Discard",
  cancelLabel = "Keep editing",
}: {
  guard: UnsavedChangesGuard;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) => (
  <ConfirmDialog
    {...guard.confirmProps}
    title={title}
    description={description}
    confirmLabel={confirmLabel}
    cancelLabel={cancelLabel}
  />
);
