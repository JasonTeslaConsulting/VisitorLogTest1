/**
 * Live preview for the `stacked-card` template.
 *
 * Shows the shell's holes, not a design — the toolbar switches `ratio` so the
 * minimum-height behaviour is visible. The placeholders here are deliberately
 * short, so `auto` (no minimum) reads as clearly different from the three that
 * impose one.
 */

import { StackedCardTemplate } from "@framework/templates/StackedCardTemplate";
import { PlaceholderRegion } from "@framework/components/TemplatePreview/PlaceholderRegion";
import { TemplateControls } from "@framework/components/TemplatePreview/TemplateControls";
import { useTemplateConfig } from "@framework/components/TemplatePreview/useTemplateConfig";
import { TEMPLATES } from "@framework/templates/registry";

const ENTRY = TEMPLATES.find((t) => t.id === "stacked-card")!;

const HEIGHTS_BY_RATIO = {
  auto: "no minimum on either card — both size to their content",
  equal: "the same minimum height on both",
  "top-tall": "a taller minimum on the upper card",
  "bottom-tall": "a taller minimum on the lower card",
} as const;

export const StackedCard = () => {
  const config = useTemplateConfig(ENTRY);
  const ratio = config.ratio as keyof typeof HEIGHTS_BY_RATIO;

  return (
    <>
      <TemplateControls entry={ENTRY} className="mb-6" />
      <StackedCardTemplate
        title={ENTRY.name}
        subtitle={`StackedCardTemplate · ratio=${ratio} · ${HEIGHTS_BY_RATIO[ratio]}`}
        ratio={ratio}
        top={
          <PlaceholderRegion
            label="top"
            hint="The upper card — a summary, or the filters the lower card responds to"
            className="min-h-0"
          />
        }
      >
        <PlaceholderRegion
          label="children"
          hint="The lower card — the main content"
          className="min-h-0"
        />
      </StackedCardTemplate>
    </>
  );
};
