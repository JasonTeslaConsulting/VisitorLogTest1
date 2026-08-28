/**
 * CardGridTemplate
 *
 * A responsive grid of equal cards under a title block — a module picker, a card
 * list, a gallery of records. The page supplies the cards as `children`.
 *
 * Registry entry backed by this shell: `card-grid`.
 *
 * Owns: header placement and the auto-filling grid. Page-edge padding and max
 * content width are `PageLayout`'s job (DESIGN.md §7), not this shell's. Owns
 * nothing about the cards themselves.
 */

import { PageContentHeader } from "@framework/components/ui/PageContentHeader";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import type { TemplateProps } from "@framework/types/templates";

type CardGridTemplateProps = TemplateProps & {
  /** Minimum card width before the grid reflows to fewer columns. */
  cardWidth?: "sm" | "md" | "lg";
};

// A fixed set rather than a free `minmax()` string: Tailwind can only compile class
// names it can see at build time, and CLAUDE.md bans the `style={{}}` prop that a
// dynamic value would otherwise need.
//
// `min(<size>,100%)` rather than a bare size — `minmax(24rem,1fr)` forces a 384px
// track even in a 343px container, pushing the whole page into horizontal scroll on
// a 375px phone. The `min()` lets the track collapse to the container instead.
const GRID_BY_CARD_WIDTH = {
  sm: "grid-cols-[repeat(auto-fill,minmax(min(14rem,100%),1fr))]",
  md: "grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))]",
  lg: "grid-cols-[repeat(auto-fill,minmax(min(24rem,100%),1fr))]",
} as const;

export const CardGridTemplate = ({
  title,
  subtitle,
  headerActions,
  children,
  className,
  cardWidth = "md",
}: CardGridTemplateProps) => {
  return (
    <div className={cn(className)}>
      <PageContentHeader title={title} subtitle={subtitle}>
        {headerActions}
      </PageContentHeader>

      <div className={cn("mt-6 grid gap-6", GRID_BY_CARD_WIDTH[cardWidth])}>
        {children}
      </div>
    </div>
  );
};
