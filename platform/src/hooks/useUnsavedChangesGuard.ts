import { useCallback, useEffect, useState } from "react";
import { useBeforeUnload, useBlocker } from "react-router";

/**
 * One guard for every way a user can walk away from unsaved work.
 *
 * WHY ONE HOOK COVERS THREE UNRELATED-LOOKING TRIGGERS. Closing a dialog and navigating to another
 * route are the same shape underneath — "an intent to leave that can be held, then either released
 * or abandoned":
 *
 *   Base UI Dialog/Sheet   hold: details.cancel()   release: setOpen(false)   abandon: (nothing)
 *   React Router blocker   hold: automatic          release: blocker.proceed  abandon: blocker.reset
 *
 * So the whole hook is one nullable "pending release" slot. Base UI funnels EVERY exit route — the X
 * button, a Cancel inside DialogClose, Esc, and a backdrop click — through a single `onOpenChange`
 * with a `reason`, which is why `guardOpenChange` catches all four rather than needing four
 * interceptions.
 *
 * THE ASYMMETRY THAT MATTERS: the router path *must* call `reset()` when the user backs out. Skip it
 * and the router stays blocked, so every later navigation silently does nothing and the app looks
 * frozen with no error anywhere. The dialog path needs no undo. That is the only reason `abandon` is
 * optional rather than absent.
 *
 * Opt-in by design: a page calls this. The primitives are deliberately NOT guarded automatically —
 * plenty of dialogs hold input where losing a keystroke does not matter (FilterSheet's
 * draft-then-apply panel being the clearest case). `local/require-unsaved-guard` is what stops
 * "opt-in" becoming "forgotten"; see platform/scripts/eslint-rules/unsaved-guard.js.
 */

type Pending = { release: () => void; abandon?: () => void };

/** The slice of Base UI's change-event details this needs. Structural, so it stays decoupled. */
type DismissDetails = { cancel: () => void };

export type UnsavedChangesGuard = {
  /** Wrap a dialog/sheet `setOpen` into a Base-UI-shaped `onOpenChange`. */
  guardOpenChange: (
    setOpen: (open: boolean) => void,
  ) => (open: boolean, details?: DismissDetails) => void;
  /** Guard anything that is neither a Base UI container nor a router navigation. */
  requestClose: (release: () => void) => void;
  /** Spread onto `UnsavedChangesDialog` (or `ConfirmDialog` directly). */
  confirmProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
  };
  /** True while the confirmation is being shown. */
  isPrompting: boolean;
};

export function useUnsavedChangesGuard({
  when,
  alsoGuardPageUnload = true,
}: {
  /** Usually react-hook-form's `formState.isDirty`. */
  when: boolean;
  alsoGuardPageUnload?: boolean;
}): UnsavedChangesGuard {
  const [pending, setPending] = useState<Pending | null>(null);

  // Called unconditionally (hooks rules); `when` decides whether it blocks. This is the first use
  // of useBlocker in the repo — one of the two reasons React Router data mode was adopted at all
  // (.claude/rules/architecture-rules.md).
  const blocker = useBlocker(useCallback(() => when, [when]));

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    setPending({ release: blocker.proceed, abandon: blocker.reset });
  }, [blocker]);

  // The third exit route, which neither API covers: leaving the site entirely (tab close, reload,
  // external link). The browser shows its own prompt here and it CANNOT be styled or replaced —
  // that is a platform limit, not a gap to design around, so don't try to route it through
  // ConfirmDialog.
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (!alsoGuardPageUnload || !when) return;
        event.preventDefault();
      },
      [alsoGuardPageUnload, when],
    ),
  );

  const guardOpenChange = useCallback(
    (setOpen: (open: boolean) => void) =>
      (open: boolean, details?: DismissDetails) => {
        // Opening is never guarded — there is nothing to lose yet.
        if (open) {
          setOpen(true);
          return;
        }
        if (!when) {
          setOpen(false);
          return;
        }
        // Holds the dialog open WITHOUT unmounting it, so every typed value survives being asked.
        details?.cancel();
        setPending({ release: () => setOpen(false) });
      },
    [when],
  );

  const requestClose = useCallback(
    (release: () => void) => {
      if (!when) {
        release();
        return;
      }
      setPending({ release });
    },
    [when],
  );

  const confirmProps = {
    open: pending !== null,
    onOpenChange: (open: boolean) => {
      if (open) return;
      // Backing out. `abandon` unblocks the router; without it navigation stays dead.
      pending?.abandon?.();
      setPending(null);
    },
    onConfirm: () => {
      // Clear BEFORE releasing: release() may navigate or unmount, and setting state afterwards
      // would be an update on a gone component.
      const released = pending;
      setPending(null);
      released?.release();
    },
  };

  return {
    guardOpenChange,
    requestClose,
    confirmProps,
    isPrompting: pending !== null,
  };
}
