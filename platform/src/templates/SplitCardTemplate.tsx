/**
 * SplitCardTemplate
 *
 * Two cards side by side under a title block, stacking on mobile. `ratio` decides
 * their relative widths and which side the `aside` sits on.
 *
 * Registry entry backed by this shell: `split-card`.
 *
 * Owns: header placement, the two card wrappers, the grid and its mobile collapse.
 * Page-edge padding and max content width are `PageLayout`'s job (DESIGN.md §7),
 * not this shell's. Owns nothing about what's inside either card.
 */

import { Card, CardContent } from "@framework/components/ui/card";
import { PageContentHeader } from "@framework/components/ui/PageContentHeader";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import type { TemplateProps } from "@framework/types/templates";

type SplitCardTemplateProps = TemplateProps & {
  /** The secondary card. Rendered left or right per `ratio`. */
  aside: React.ReactNode;
  /**
   * "equal"       — two cards of the same width.
   * "aside-left"  — narrower aside on the left, main content on the right.
   * "aside-right" — main content on the left, narrower aside on the right.
   */
  ratio?: "equal" | "aside-left" | "aside-right";
};

// `minmax(0,…)` on both tracks, not plain `1fr`/`2fr` — a grid child's default
// `min-width: auto` otherwise refuses to shrink below its content, which is how a
// wide table or a long unbroken string pushes the whole page into horizontal scroll.
const GRID_BY_RATIO = {
  equal: "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
  "aside-left": "md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
  "aside-right": "md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
} as const;

export const SplitCardTemplate = ({
  title,
  subtitle,
  headerActions,
  aside,
  children,
  className,
  ratio = "equal",
}: SplitCardTemplateProps) => {
  const asideFirst = ratio === "aside-left";

  const mainCard = (
    <Card>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const asideCard = (
    <Card>
      <CardContent>{aside}</CardContent>
    </Card>
  );

  return (
    <div className={cn(className)}>
      <PageContentHeader title={title} subtitle={subtitle}>
        {headerActions}
      </PageContentHeader>

      <div className={cn("mt-6 grid gap-6", GRID_BY_RATIO[ratio])}>
        {asideFirst ? (
          <>
            {asideCard}
            {mainCard}
          </>
        ) : (
          <>
            {mainCard}
            {asideCard}
          </>
        )}
      </div>
    </div>
  );
};
