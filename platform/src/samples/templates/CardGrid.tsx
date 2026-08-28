/**
 * Live preview for the `card-grid` template.
 *
 * Shows the shell's holes, not a design — the toolbar switches `cardWidth`, which
 * changes how many cards fit per row before the grid reflows. Realistic content
 * built on this template lives at /sample/card-list-page.
 */

import { CardGridTemplate } from "@framework/templates/CardGridTemplate";
import { PlaceholderRegion } from "@framework/components/TemplatePreview/PlaceholderRegion";
import { TemplateControls } from "@framework/components/TemplatePreview/TemplateControls";
import { useTemplateConfig } from "@framework/components/TemplatePreview/useTemplateConfig";
import { TEMPLATES } from "@framework/templates/registry";

const ENTRY = TEMPLATES.find((t) => t.id === "card-grid")!;

const MIN_WIDTH_BY_CARD_WIDTH = {
  sm: "minmax(min(14rem,100%),1fr)",
  md: "minmax(min(18rem,100%),1fr)",
  lg: "minmax(min(24rem,100%),1fr)",
} as const;

export const CardGrid = () => {
  const config = useTemplateConfig(ENTRY);
  const cardWidth = config.cardWidth as keyof typeof MIN_WIDTH_BY_CARD_WIDTH;

  return (
    <>
      <TemplateControls entry={ENTRY} className="mb-6" />
      <CardGridTemplate
        title={ENTRY.name}
        subtitle={`CardGridTemplate · cardWidth=${cardWidth} · auto-filling grid, ${MIN_WIDTH_BY_CARD_WIDTH[cardWidth]}`}
        cardWidth={cardWidth}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <PlaceholderRegion
            key={i}
            label={i === 0 ? "children" : ""}
            hint={i === 0 ? "One card per item." : undefined}
            className="min-h-40 border"
          />
        ))}
      </CardGridTemplate>
    </>
  );
};
