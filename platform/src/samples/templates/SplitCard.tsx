/**
 * Live preview for the `split-card` template.
 *
 * Shows the shell's holes, not a design — the toolbar switches `ratio` through all
 * three arrangements. Realistic content built on this template lives at
 * /sample/dashboard-page and /sample/detail-page.
 */

import { SplitCardTemplate } from "@framework/templates/SplitCardTemplate";
import { PlaceholderRegion } from "@framework/components/TemplatePreview/PlaceholderRegion";
import { TemplateControls } from "@framework/components/TemplatePreview/TemplateControls";
import { useTemplateConfig } from "@framework/components/TemplatePreview/useTemplateConfig";
import { TEMPLATES } from "@framework/templates/registry";

const ENTRY = TEMPLATES.find((t) => t.id === "split-card")!;

const SPLIT_BY_RATIO = {
  equal: "two cards of the same width",
  "aside-left": "aside on the left at 1fr, children on the right at 2fr",
  "aside-right": "children on the left at 2fr, aside on the right at 1fr",
} as const;

export const SplitCard = () => {
  const config = useTemplateConfig(ENTRY);
  const ratio = config.ratio as keyof typeof SPLIT_BY_RATIO;

  return (
    <>
      <TemplateControls entry={ENTRY} className="mb-6" />
      <SplitCardTemplate
        title={ENTRY.name}
        subtitle={`SplitCardTemplate · ratio=${ratio} · ${SPLIT_BY_RATIO[ratio]}, stacking on mobile`}
        ratio={ratio}
        aside={
          <PlaceholderRegion
            label="aside"
            hint="The secondary panel"
            className="min-h-64"
          />
        }
      >
        <PlaceholderRegion
          label="children"
          hint="The main panel"
          className="min-h-64"
        />
      </SplitCardTemplate>
    </>
  );
};
