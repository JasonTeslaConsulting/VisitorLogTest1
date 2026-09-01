import { SplitCardTemplate } from "@framework/templates/SplitCardTemplate";
import { OnSiteList, OnSiteStats } from "@/components/Visits/OnSiteSummary";

export const VisitsToday = () => {
  return (
    <SplitCardTemplate
      title="On Site Today"
      ratio="aside-left"
      aside={
        <div className="space-y-4">
          <h2 className="font-heading text-base font-medium">Summary</h2>
          <OnSiteStats />
        </div>
      }
    >
      <div className="space-y-4">
        <h2 className="font-heading text-base font-medium">On site now</h2>
        <OnSiteList />
      </div>
    </SplitCardTemplate>
  );
};
