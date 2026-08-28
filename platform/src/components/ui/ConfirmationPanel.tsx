/**
 * ConfirmationPanel — the "you're done" block a form shows after a successful submit.
 *
 * Drop it into a card and it lays out the whole outcome: badge, title, description, an optional
 * fine-print line under a divider, whatever body the page needs, the actions, and a slot after
 * them. Everything except the title is optional, so the same component covers a three-line
 * acknowledgement and a full visit summary.
 *
 * ```tsx
 * <SingleCardTemplate title="…" width="narrow">
 *   <ConfirmationPanel
 *     title="Registration completed"
 *     description="Please wait for your host at the designated reception area."
 *     secondary="Guests must remain accompanied by their host while on company premises."
 *     actions={<Button className="w-full">Done</Button>}
 *   />
 * </SingleCardTemplate>
 * ```
 *
 * **The tick is `--color-success`, not `--color-primary`** — even where a design shows it in the
 * brand accent. DESIGN.md §2.4 assigns positive confirmation to the success role, and §2 reserves
 * primary for the one action on the screen; a large accent-coloured badge directly above an accent
 * Done button spreads the accent across two competing elements, which is the thing that rule
 * exists to stop. The badge is tinted (`bg-success/10`) rather than solid for the same reason
 * DESIGN.md §6 tints Badges: at this size a solid fill is louder than the action beneath it.
 *
 * **This component does not decide where the buttons go.** `actions` is a slot, and the
 * destinations are a per-page question — see `.claude/rules/components-rules.md` § Confirmation
 * pages. Two buttons that do the same thing is a real design smell, not a default to inherit.
 */
import { PiCheck } from "react-icons/pi";

import { cn } from "@framework/lib/shadcn/shadcn-utils";

type ConfirmationPanelProps = {
  title: React.ReactNode;
  /** The main explanatory line. Says what happens next, not that the submit worked. */
  description?: React.ReactNode;
  /**
   * Fine print below a divider — a standing condition or obligation, not a restatement of the
   * description. Omit it rather than padding the page out.
   */
  secondary?: React.ReactNode;
  /** Before the badge. An alert, a logo, a step indicator. */
  above?: React.ReactNode;
  /** The body: a summary `InfoTable`, declared items, a note. Sits between text and actions. */
  children?: React.ReactNode;
  /** The button cluster. Full-width buttons read best on a narrow card. */
  actions?: React.ReactNode;
  /** After the actions — a secondary link, a reference number, support contact. */
  below?: React.ReactNode;
  className?: string;
};

const ConfirmationPanel = ({
  title,
  description,
  secondary,
  above,
  children,
  actions,
  below,
  className,
}: ConfirmationPanelProps) => {
  return (
    <div
      data-slot="confirmation-panel"
      className={cn("flex flex-col gap-6", className)}
    >
      {above}

      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-success/10 text-success dark:bg-success/20"
        >
          <PiCheck className="size-8" />
        </span>
        <div className="space-y-2">
          <h2 className="font-heading text-title-lg font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {secondary ? (
          /* The divider is what makes this read as fine print rather than a third paragraph of
             the description. It only exists when there is something to separate. */
          <>
            <hr className="w-12 border-t border-border" />
            <p className="text-xs text-muted-foreground">{secondary}</p>
          </>
        ) : null}
      </div>

      {children}

      {actions ? (
        <div className="flex flex-col items-center gap-3">{actions}</div>
      ) : null}

      {below}
    </div>
  );
};

export { ConfirmationPanel };
export type { ConfirmationPanelProps };
