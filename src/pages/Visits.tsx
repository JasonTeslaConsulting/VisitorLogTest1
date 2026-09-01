import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { VisitTables } from "@/components/Visits/VisitTables";

export const Visits = () => {
  return (
    <SingleCardTemplate title="My Visits" width="wide">
      <VisitTables />
    </SingleCardTemplate>
  );
};
