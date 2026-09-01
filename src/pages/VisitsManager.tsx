import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { VisitTables } from "@/components/Visits/VisitTables";

export const VisitsManager = () => {
  return (
    <SingleCardTemplate title="All Visits" width="wide">
      <VisitTables scope="all" />
    </SingleCardTemplate>
  );
};
