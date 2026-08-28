/**
 * Resolves a template's arrangement props from the URL for its gallery preview
 * page, falling back to the first allowed value in the registry's `options`.
 *
 * An unknown or misspelt query value falls back too, so a hand-edited URL can
 * never render a configuration the shell doesn't support.
 *
 * Lives in its own file rather than beside `TemplateControls`: a file exporting
 * both a component and a non-component trips `react-refresh/only-export-components`.
 */

import { useSearchParams } from "react-router";
import type { TemplateEntry } from "@framework/types/templates";

export const useTemplateConfig = (entry: TemplateEntry) => {
  const [searchParams] = useSearchParams();

  return Object.fromEntries(
    Object.entries(entry.options).map(([prop, values]) => {
      const fromUrl = searchParams.get(prop);
      return [prop, fromUrl && values.includes(fromUrl) ? fromUrl : values[0]];
    }),
  );
};
