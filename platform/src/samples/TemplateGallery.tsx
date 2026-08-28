/**
 * Template gallery — the page a developer is pointed at when choosing a template.
 *
 * Driven entirely by `src/templates/registry.ts`, so adding a template adds a card
 * here with no edit to this file.
 *
 * A visual aid for a human comparing options, nothing more — this is not where a
 * template gets picked into a build unit. spec-page reads the registry and writes
 * `template:` itself; the gallery just lets someone look before spec-page asks.
 * Every card leads with what the props vary. "Commonly used for" is deliberately
 * last and deliberately labelled — those are examples, not the template's
 * identity, which is why none of them is called "Form page".
 */

import { Link } from "react-router";
import { PiArrowRight } from "react-icons/pi";
import { TEMPLATES } from "@framework/templates/registry";
import { CardGridTemplate } from "@framework/templates/CardGridTemplate";
import { Button } from "@framework/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@framework/components/ui/card";

export const TemplateGallery = () => {
  return (
    <CardGridTemplate
      title="Page templates"
      subtitle="Pre-designed layout and structure. Open a preview to switch its props and watch the frame change."
      cardWidth="lg"
    >
      {TEMPLATES.map((entry) => (
        <Card key={entry.id}>
          <CardHeader>
            <CardTitle>{entry.name}</CardTitle>
            <CardDescription>{entry.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Props
                </p>
                {Object.entries(entry.options).map(([prop, values]) => (
                  <p key={prop} className="font-mono text-xs text-foreground">
                    {prop}: {values.join(" · ")}
                  </p>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Commonly used for
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {entry.commonlyUsedFor.map((use) => (
                    <li key={use}>{use}</li>
                  ))}
                </ul>
              </div>
            </div>

            <Button
              render={<Link to={entry.previewRoute} />}
              nativeButton={false}
              variant="outline"
              className="w-full"
              endIcon={<PiArrowRight className="size-4" />}
            >
              Open live preview
            </Button>
          </CardContent>
        </Card>
      ))}
    </CardGridTemplate>
  );
};
