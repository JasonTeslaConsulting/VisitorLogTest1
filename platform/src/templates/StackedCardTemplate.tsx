/**
 * StackedCardTemplate
 *
 * Two cards, one above the other, filling the page width. `top` is the upper card,
 * `children` the lower one — mirroring `SplitCardTemplate`'s `aside` + `children`,
 * where the named extra hole is the secondary region and `children` stays the main
 * content.
 *
 * Registry entry backed by this shell: `stacked-card`.
 *
 * Owns: header placement, the two card wrappers, and the gap between them.
 * Page-edge padding and max content width are `PageLayout`'s job (DESIGN.md §7),
 * not this shell's. Owns nothing about what's inside either card.
 *
 * Why this is its own shell and not a `direction` prop on `SplitCardTemplate`,
 * given both have a header plus two content regions: their arrangement props can't
 * share a vocabulary — `aside-left`/`aside-right` is meaningless vertically — and
 * this one pins its width. See the hole test in `docs/architecture/templates.md`.
 */

import { Card, CardContent } from "@framework/components/ui/card";
import { PageContentHeader } from "@framework/components/ui/PageContentHeader";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import type { TemplateProps } from "@framework/types/templates";

type StackedCardTemplateProps = TemplateProps & {
  /**
   * "auto"        — no minimum on either card; both size to their content.
   * "equal"       — the same minimum height on both.
   * "top-tall"    — a taller minimum on the upper card.
   * "bottom-tall" — a taller minimum on the lower card.
   */
  ratio?: "auto" | "equal" | "top-tall" | "bottom-tall";
  /** The upper card. */
  top: React.ReactNode;
};

// Minimum heights, not `grid-rows-[1fr_2fr]` fractions: row fractions only resolve
// inside a container with a bounded height, so on a normal content-driven page they
// would collapse to the content's own height and the prop would silently do nothing.
// A minimum is honest — it sets a floor, and either card still grows past it.
const MIN_HEIGHT_BY_RATIO = {
  auto: ["", ""],
  equal: ["min-h-64", "min-h-64"],
  "top-tall": ["min-h-96", "min-h-48"],
  "bottom-tall": ["min-h-48", "min-h-96"],
} as const;

export const StackedCardTemplate = ({
  title,
  subtitle,
  headerActions,
  top,
  children,
  className,
  ratio = "auto",
}: StackedCardTemplateProps) => {
  const [topMinHeight, bottomMinHeight] = MIN_HEIGHT_BY_RATIO[ratio];

  return (
    <div className={cn(className)}>
      <PageContentHeader title={title} subtitle={subtitle}>
        {headerActions}
      </PageContentHeader>

      <div className="mt-6 flex flex-col gap-6">
        <Card>
          <CardContent className={topMinHeight}>{top}</CardContent>
        </Card>
        <Card>
          <CardContent className={bottomMinHeight}>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
};
