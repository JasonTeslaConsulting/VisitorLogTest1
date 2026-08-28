/**
 * Sample: Confirmation Page Simple — what a public form shows after a successful submit.
 *
 * The standalone shape, like Form Page Public: a real copy renders with **no navbar**
 * (`realLayout: "none"`, `realAccess: "public"` in the sample registry), because a guest who
 * followed a link has nowhere to navigate to. This preview shows a navbar since every sample
 * route is `layout: "default"` or the sample menu disappears.
 *
 * Its sibling Confirmation Page Detailed is this page with a summary table added.
 *
 * **The two buttons here do the same thing, and that is a placeholder, not a pattern.** Where each
 * one goes is a per-page decision the implementing agent must confirm with the user — see
 * `.claude/rules/components-rules.md` § Confirmation pages. Two controls with one destination is
 * a design smell; it survives in the sample only because a sample has nowhere to navigate.
 *
 * Inline mock content only — previews must render on a fresh clone with no .env.
 */

import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { Button } from "@framework/components/ui/button";
import { ConfirmationPanel } from "@framework/components/ui/ConfirmationPanel";

export const ConfirmationPageSimple = () => {
  return (
    <SingleCardTemplate
      title="Visitor registration"
      subtitle="Reception check-in"
      width="narrow"
    >
      <ConfirmationPanel
        title="Registration completed"
        description="You have been successfully registered. Please wait for your host at the designated reception area."
        secondary="Guests must remain accompanied by their host while on company premises."
        actions={
          <>
            {/* Full-width primary on a narrow card: the thumb target should span the card on a
                phone, and DESIGN.md §7 puts the confirming action last. */}
            <Button className="w-full">Done</Button>
            {/* No destination wired up, exactly like Cancel in the form samples — a preview has
                nowhere to go, and inventing one would imply a decision nobody has made. */}
            <Button variant="link">Back to home</Button>
          </>
        }
      />
    </SingleCardTemplate>
  );
};
