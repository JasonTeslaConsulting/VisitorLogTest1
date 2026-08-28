/**
 * LoadingScreen
 *
 * Full-viewport loading state for route-level gates (e.g. ProtectedRoute while
 * auth is resolving) — not a component-level skeleton, which stays inline per
 * .claude/rules/components-rules.md.
 */

import { PiSpinner } from "react-icons/pi";
import { cn } from "@framework/lib/shadcn/shadcn-utils";

export type LoadingScreenProps = {
  message?: string;
  className?: string;
};

export const LoadingScreen = ({
  message = "Loading...",
  className,
}: LoadingScreenProps) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      "flex min-h-screen flex-col items-center justify-center gap-4 bg-background",
      className,
    )}
  >
    <PiSpinner
      className="size-8 animate-spin text-muted-foreground"
      aria-hidden
    />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);
