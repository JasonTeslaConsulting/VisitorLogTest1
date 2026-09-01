import { SplitCardTemplate } from "@framework/templates/SplitCardTemplate";
import { OnSiteList, OnSiteStats } from "@/components/Visits/OnSiteSummary";

export const VisitsToday = () => {
  return (
    <SplitCardTemplate
      title="On Site Today"
      ratio="equal"
      aside={
        <div className="space-y-4">
          <h2 className="font-heading text-base font-medium">On site now</h2>
          <OnSiteList />
        </div>
      }
    >
      <OnSiteStats />
    </SplitCardTemplate>
  );
};
