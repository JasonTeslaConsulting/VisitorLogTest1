/**
 * SingleCardTemplate
 *
 * One card, with a title block that sits either above it or inside it.
 *
 * Registry entry backed by this shell: `single-card`.
 *
 * Two arrangement props, and everything else is what goes in `children`:
 *
 * - `width` — how far the card spans, and how the header aligns when above it.
 * - `headerPlacement` — `"above"` puts the title block in the page, over the card;
 *   `"inside"` puts it in the card's own header row. Same holes either way, which
 *   is why this is a prop rather than a second shell (see the hole test in
 *   `docs/architecture/templates.md`).
 *
 * Both placements render the same `PageContentHeader`, so the title stays the
 * page's `h1` and keeps one typography wherever it sits — an "inside" header is a
 * page title that happens to be in the card, not a card title.
 *
 * Owns: header placement, the card wrapper, and the spacing rhythm between them.
 * Page-edge padding and max content width are `PageLayout`'s job (DESIGN.md §7),
 * not this shell's — `wide` simply fills whatever width the page allows. Owns
 * nothing about what's inside the card.
 *
 * `narrow` is the one width this shell does set, and it is deliberately NOT tied
 * to `--container-max`: it's a readability constraint (DESIGN.md §3 caps body text
 * at ~70–75 characters), so a form stays ~672px even if the app widens.
 */

import { Card, CardContent, CardHeader } from "@framework/components/ui/card";
import { PageContentHeader } from "@framework/components/ui/PageContentHeader";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import type { TemplateProps } from "@framework/types/templates";

type SingleCardTemplateProps = TemplateProps & {
  /**
   * "narrow" — a focused form (max-w-2xl, header centred over the card).
   * "wide"   — a management/search page (fills the page width, header
   *            left-aligned with the card).
   */
  width?: "narrow" | "wide";
  /**
   * "above"  — title block in the page, above the card.
   * "inside" — title block in the card's header row, always left-aligned.
   */
  headerPlacement?: "above" | "inside";
};

export const SingleCardTemplate = ({
  title,
  subtitle,
  headerActions,
  children,
  className,
  width = "narrow",
  headerPlacement = "above",
}: SingleCardTemplateProps) => {
  const isNarrow = width === "narrow";
  const isInside = headerPlacement === "inside";

  const header = (
    // Centring only ever applies above a narrow card. A centred heading inside a
    // card reads as a mistake, so "inside" is always left-aligned regardless of width.
    <PageContentHeader
      title={title}
      subtitle={subtitle}
      align={!isInside && isNarrow ? "center" : "start"}
    >
      {headerActions}
    </PageContentHeader>
  );

  return (
    <div className={cn(isNarrow && "mx-auto max-w-2xl", className)}>
      {!isInside && header}

      <Card className={cn(!isInside && "mt-6")}>
        {isInside && <CardHeader>{header}</CardHeader>}
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
};
