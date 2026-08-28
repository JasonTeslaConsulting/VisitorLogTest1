/**
 * Sample gallery — the page a developer is pointed at when they want to say
 * "build it like that one".
 *
 * Driven entirely by `src/samples/registry.ts`, so adding a sample adds a card here with no edit to
 * this file. Same shape as `TemplateGallery`, deliberately: Samples and Templates are one navbar
 * link each, and both lead to a registry-driven grid.
 *
 * Two views, because the page serves two readers and the library is expected to grow:
 *
 * - **Compact** (default) — name plus the one line that distinguishes it from its siblings. What
 *   someone *choosing* a sample needs, four to a row, scannable at a glance.
 * - **Detailed** — adds use cases, the component configuration, the template it composes, and the
 *   routing a real copy needs. That is implementation information: useful once the choice is made,
 *   noise while making it. Three to a row, because four columns of dense text reads worse than
 *   three.
 *
 * The view lives in the URL (`?view=detailed`), matching `useTemplateConfig` on the template
 * previews — so a link can carry it and a reload doesn't reset it.
 *
 * Most people using this will never need to know what a template is, which is why "Built from" is
 * detailed-only and never the thing a card leads with.
 */

import { Link, useSearchParams } from "react-router";
import { PiArrowRight } from "react-icons/pi";
import { SAMPLES } from "@framework/samples/registry";
import { CardGridTemplate } from "@framework/templates/CardGridTemplate";
import { Button } from "@framework/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@framework/components/ui/toggle-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@framework/components/ui/card";

/**
 * Registry order, with each variant pulled in directly after the sample it varies — so a family
 * reads as a group without an alphabetical sort throwing away the order the registry was written
 * in. The registry lists samples roughly by how often they are reached for.
 */
const ORDERED = SAMPLES.filter((s) => !s.variantOf).flatMap((base) => [
  base,
  ...SAMPLES.filter((s) => s.variantOf === base.id),
]);

const DETAILED = "detailed";

export const SampleGallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const detailed = searchParams.get("view") === DETAILED;

  const setView = (next: string) => {
    const params = new URLSearchParams(searchParams);
    // Compact is the default, so it stays out of the URL rather than pinning the default in.
    if (next === DETAILED) params.set("view", DETAILED);
    else params.delete("view");
    setSearchParams(params, { replace: true });
  };

  return (
    <CardGridTemplate
      title="Sample pages"
      subtitle="Whole pages you can point at. Say “build it like Form Page Internal” and the layout, structure and component choices come from here — only the content changes."
      cardWidth={detailed ? "lg" : "md"}
      headerActions={
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[detailed ? DETAILED : "compact"]}
          onValueChange={(pressed) => pressed[0] && setView(pressed[0])}
          aria-label="Card detail"
        >
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          <ToggleGroupItem value={DETAILED}>Detailed</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {ORDERED.map((entry) => {
        const parent = entry.variantOf
          ? SAMPLES.find((s) => s.id === entry.variantOf)
          : undefined;

        return (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle>{entry.name}</CardTitle>
              <CardDescription>{entry.distinguishedBy}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <div className="space-y-4">
                {/* Shown in both views: which sample this varies is part of its identity, and
                    whoever is choosing between siblings needs it most. */}
                {parent && (
                  <p className="text-sm text-muted-foreground">
                    Same structure as{" "}
                    <span className="text-foreground">{parent.name}</span> —
                    only the configuration differs.
                  </p>
                )}

                {detailed && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {entry.description}
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Use it for
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {entry.useCases.map((use) => (
                          <li key={use}>{use}</li>
                        ))}
                      </ul>
                    </div>

                    {entry.configuration && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Configuration
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {entry.configuration.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Built from
                      </p>
                      <p className="font-mono text-xs text-foreground">
                        {entry.template ?? "no template"}
                        {Object.entries(entry.templateOptions).map(
                          ([prop, value]) => ` · ${prop}=${value}`,
                        )}
                      </p>
                    </div>

                    {/* Stated on every card rather than badged on the odd one out. Every sample
                        route is layout:"default", access:"public" so the sample menu survives and
                        an unauthenticated visitor can browse — so what a REAL copy needs is
                        genuinely different from what is on screen, and it is the copy that
                        matters. */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        A real page using this
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.realLayout === "none"
                          ? "Renders with no navbar"
                          : "Renders inside the app, with the navbar"}
                        {" · "}
                        {entry.realAccess === "authenticated"
                          ? "requires sign-in"
                          : "is reachable without signing in"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <Button
                render={<Link to={entry.route} />}
                nativeButton={false}
                variant="outline"
                className="w-full"
                endIcon={<PiArrowRight className="size-4" />}
              >
                Open the sample
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </CardGridTemplate>
  );
};
