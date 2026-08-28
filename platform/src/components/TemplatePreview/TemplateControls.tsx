/**
 * TemplateControls
 *
 * The props toolbar on a template's preview page: one toggle group per
 * arrangement prop in the template's registry `options`, so a new allowed value
 * appears here with no edit to this file or the page.
 *
 * Gallery-only — it exists to compare configurations side by side and is not part
 * of any template, which is why it renders *above* the shell rather than in one of
 * its holes, inside `SampleControls`' unmistakable "not the real thing" treatment.
 *
 * Selection lives in the URL (`?width=wide`) rather than component state, so a
 * specific configuration stays linkable — `spec-page` points people at these
 * previews when choosing a template.
 */

import { useSearchParams } from "react-router";
import { Field, FieldTitle } from "@framework/components/ui/field";
import { SampleControls } from "@framework/components/SamplePreview/SampleControls";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@framework/components/ui/toggle-group";
import { useTemplateConfig } from "@framework/components/TemplatePreview/useTemplateConfig";
import type { TemplateEntry } from "@framework/types/templates";

type TemplateControlsProps = {
  entry: TemplateEntry;
  className?: string;
};

export const TemplateControls = ({
  entry,
  className,
}: TemplateControlsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const config = useTemplateConfig(entry);

  const setOption = (prop: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(prop, value);
    setSearchParams(next, { replace: true });
  };

  return (
    <SampleControls
      message="Gallery-only controls — not part of the template. Switch a prop to see the frame change."
      className={className}
    >
      {Object.entries(entry.options).map(([prop, values]) => (
        // A ToggleGroup has no single control to point htmlFor at, so the label
        // was previously a bare <Label> associated with nothing. FieldTitle + an
        // id the group references via aria-labelledby is the accessible form of
        // the same thing.
        <Field key={prop}>
          <FieldTitle id={`${prop}-label`} className="font-mono text-xs">
            {prop}
          </FieldTitle>
          <ToggleGroup
            aria-labelledby={`${prop}-label`}
            variant="outline"
            size="sm"
            value={[config[prop]]}
            // Base UI reports the group's pressed values as an array. Clicking the
            // already-pressed item would clear it, so an empty array keeps the
            // current value — these props always need exactly one.
            onValueChange={(pressed) =>
              pressed[0] && setOption(prop, pressed[0])
            }
          >
            {values.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      ))}
    </SampleControls>
  );
};
