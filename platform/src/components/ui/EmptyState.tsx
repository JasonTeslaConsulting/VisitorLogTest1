/**
 * EmptyState
 *
 * Implements the empty-state pattern already specified in
 * .claude/rules/components-rules.md: icon → heading → subtext → optional CTA,
 * no card border or table chrome around it. Copy passed in should be factual
 * ("No results found"), not conversational.
 */

import type { IconType } from "react-icons";
import { cn } from "@framework/lib/shadcn/shadcn-utils";

export type EmptyStateProps = {
  icon: IconType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Override the icon's default text-muted-foreground, e.g. "text-destructive" for an error state */
  iconClassName?: string;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className,
    )}
  >
    <Icon
      className={cn("size-10 text-muted-foreground", iconClassName)}
      aria-hidden
    />
    <p className="mt-4 text-base font-medium">{title}</p>
    {description && (
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
