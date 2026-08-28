/**
 * SampleControls
 *
 * Wraps the state-toggle switches sample pages use to demo a component's props
 * (loading, striped, etc.), so they read as sample scaffolding and never as
 * part of the component being demoed. Sibling to
 * `src/components/TemplatePreview/PlaceholderRegion.tsx` — same idea, kept out
 * of `src/components/ui/` on purpose so it never shows up in
 * docs/architecture/inventory.md's "UI components" list as if it were a real
 * reusable primitive.
 */

import { cn } from "@framework/lib/shadcn/shadcn-utils";

type SampleControlsProps = {
  children: React.ReactNode;
  /** Override the warning line — the default names a component, not a template. */
  message?: string;
  className?: string;
};

export const SampleControls = ({
  children,
  message = "Sample-only controls — not part of the component. Toggle to compare states.",
  className,
}: SampleControlsProps) => (
  <div
    className={cn(
      "space-y-3 rounded-md border border-warning/30 bg-warning/10 p-4",
      className,
    )}
  >
    <p className="text-xs font-medium text-warning-text">{message}</p>
    {/* Children are usually `Field orientation="horizontal"`, which is w-full by
        design — reset it here so the toggles wrap as a row instead of stacking.
        The container owns its own layout; the call sites shouldn't each repeat it. */}
    <div className="flex flex-wrap gap-6 *:w-auto">{children}</div>
  </div>
);
