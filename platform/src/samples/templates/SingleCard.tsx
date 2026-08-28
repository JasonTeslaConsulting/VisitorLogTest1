/**
 * Live preview for the `single-card` template.
 *
 * Shows the shell's holes, not a design — the toolbar switches each arrangement
 * prop so every configuration is one click apart. Realistic content built on this
 * template lives at /sample/form-page-public and /sample/standard-management-page.
 *
 * TemplateControls renders a toggle per key in the registry entry's `options`, but
 * the value still has to be threaded into the shell here — a new option adds the
 * control for free, not the behaviour.
 */

import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { PlaceholderRegion } from "@framework/components/TemplatePreview/PlaceholderRegion";
import { TemplateControls } from "@framework/components/TemplatePreview/TemplateControls";
import { useTemplateConfig } from "@framework/components/TemplatePreview/useTemplateConfig";
import { TEMPLATES } from "@framework/templates/registry";

const ENTRY = TEMPLATES.find((t) => t.id === "single-card")!;

export const SingleCard = () => {
  const config = useTemplateConfig(ENTRY);
  const width = config.width as "narrow" | "wide";
  const headerPlacement = config.headerPlacement as "above" | "inside";

  return (
    <>
      <TemplateControls entry={ENTRY} className="mb-6" />
      <SingleCardTemplate
        title={ENTRY.name}
        subtitle={`SingleCardTemplate · width=${width} · headerPlacement=${headerPlacement} · ${
          headerPlacement === "inside"
            ? "title block in the card's header row, always left-aligned"
            : width === "narrow"
              ? "max-w-2xl, header centred over the card"
              : "fills the page width, header left-aligned with the card"
        }`}
        width={width}
        headerPlacement={headerPlacement}
      >
        <PlaceholderRegion
          label="children"
          hint="The card's whole body — fields, or a toolbar with a table and pagination"
          className="min-h-64"
        />
      </SingleCardTemplate>
    </>
  );
};
