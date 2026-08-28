/**
 * /sample and /sample/overview — the index of every sample area.
 *
 * One section per navbar parent (excluding Overview itself, which is this
 * page), each a heading followed by its entries as cards. Driven by
 * SAMPLE_NAV_MODULES — the same constant Navbar swaps in on any /sample route —
 * so this page and the navbar can't drift apart.
 */

import { Link } from "react-router";
import { Card, CardHeader, CardTitle } from "@framework/components/ui/card";
import { MenuIcon } from "@framework/app/layout/MenuIcon";
import { SAMPLE_NAV_MODULES } from "@framework/lib/constants/sampleNav";
import { CardGridTemplate } from "@framework/templates/CardGridTemplate";

const SECTIONS = SAMPLE_NAV_MODULES.filter((m) => m.modulename !== "Overview");

export const SampleHome = () => {
  return (
    <CardGridTemplate
      title="Samples"
      subtitle="Everything built so far — reachable only by URL, not linked from the real app."
      cardWidth="lg"
    >
      {SECTIONS.map((module) => (
        <div key={module.moduleid} className="col-span-full space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {module.modulename}
          </h2>
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))]">
            {module.screens.map((screen) => (
              <Link key={screen.screenid} to={screen.urladdress}>
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader className="flex-row items-center gap-2">
                    <MenuIcon
                      name={screen.menuicon}
                      className="size-4 text-muted-foreground"
                    />
                    <CardTitle>{screen.screentitle}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </CardGridTemplate>
  );
};
