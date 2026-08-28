/**
 * RefreshButton
 *
 * Shared refresh button for data table pages.
 * Triggers a TanStack Query cache invalidation via the provided queryKey,
 * or calls an onRefresh callback if you prefer to handle it yourself.
 *
 * Props:
 * - queryKey: TanStack Query key to invalidate on click (preferred)
 * - onRefresh: alternative manual callback (used if queryKey is not provided)
 * - label: button label, defaults to "Refresh"
 * - className: additional classes (optional)
 *
 * Usage with queryKey (preferred — no imports needed in the page):
 *   <RefreshButton queryKey={["users"]} />
 *
 * Usage with manual callback:
 *   <RefreshButton onRefresh={() => queryClient.invalidateQueries(...)} />
 */

import { useState } from "react";
import { PiArrowsClockwise } from "react-icons/pi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@framework/components/ui/toast";
import { Button } from "@framework/components/ui/button";
import { cn } from "@framework/lib/shadcn/shadcn-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RefreshButtonProps = {
  /** TanStack Query key to invalidate. Preferred over onRefresh. */
  queryKey?: unknown[];
  /** Manual callback. Used only when queryKey is not provided. */
  onRefresh?: () => void | Promise<void>;
  /** Toast message shown after refresh. Pass false to suppress. */
  successMessage?: string | false;
  label?: string;
  /** Hide the label and render icon-only. The aria-label is kept either way. */
  showLabel?: boolean;
  className?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RefreshButton = ({
  queryKey,
  onRefresh,
  successMessage = "Refreshed",
  label = "Refresh",
  showLabel = true,
  className,
}: RefreshButtonProps) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey });
      } else if (onRefresh) {
        await onRefresh();
      }
      if (successMessage) toast.success(successMessage);
    } finally {
      // Small delay so the spin animation is visible even on fast responses
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "flex items-center gap-2 h-9",
        !showLabel && "min-w-0 px-2",
        className,
      )}
      aria-label={label}
    >
      <PiArrowsClockwise
        className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
        aria-hidden
      />
      {showLabel && (
        <span className="hidden sm:inline text-muted-foreground">{label}</span>
      )}
    </Button>
  );
};
