import { useMemo, useState } from "react";
import { PiSignOut, PiUsers } from "react-icons/pi";
import { ConfirmDialog } from "@framework/components/ui/ConfirmDialog";
import { DataTable } from "@framework/components/ui/datatable/DataTable";
import { EmptyState } from "@framework/components/ui/EmptyState";
import { InfoTable } from "@framework/components/ui/InfoTable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@framework/components/ui/tabs";
import { toast } from "@framework/components/ui/toast";
import { useAuth } from "@framework/contexts/AuthContext";
import { useTableState } from "@framework/hooks/useTableState";
import type { RowAction } from "@framework/types/table";
import { getVisitColumns } from "@/components/Visits/VisitColumns";
import {
  useEquipmentItemTypes,
  useVisitPurposes,
} from "@/hooks/visitor/useVisitLookups";
import { useLogVisitExit } from "@/hooks/visitor/useVisitMutations";
import { useVisits } from "@/hooks/visitor/useVisits";
import type { Visit } from "@/types/visitor";

/**
 * Read-only detail the row already carries — contact info, consent flags, equipment. No fetch, no
 * hooks; `equipmentTypeNameById` is resolved once by the caller and passed in.
 */
function VisitDetailsPanel({
  visit,
  equipmentTypeNameById,
}: {
  visit: Visit;
  equipmentTypeNameById: Map<string, string>;
}) {
  return (
    <div className="space-y-4">
      <InfoTable
        dividers={false}
        rows={[
          { label: "Email", value: visit.emailAddress ?? "—" },
          { label: "Mobile", value: visit.mobileNumber ?? "—" },
          {
            label: "Privacy policy read",
            value: visit.isPrivacyPolicyRead ? "Yes" : "No",
          },
          {
            label: "Video recording consent",
            value: visit.isConsentVideoRecord ? "Yes" : "No",
          },
        ]}
      />
      {visit.equipment.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Equipment</p>
          <div className="space-y-3">
            {visit.equipment.map((item) => (
              <InfoTable
                key={item.visitorEquipmentId}
                dividers={false}
                rows={[
                  {
                    label: "Item type",
                    value:
                      equipmentTypeNameById.get(item.itemTypeId) ??
                      item.itemTypeId,
                  },
                  { label: "Description", value: item.itemDescription },
                  { label: "Quantity", value: item.quantity },
                  { label: "Serial number", value: item.serialNumber ?? "—" },
                ]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const VisitTables = () => {
  const { currentUser } = useAuth();

  const activeState = useTableState();
  const pastState = useTableState();

  const activeVisits = useVisits({
    status: "active",
    page: activeState.currentPage,
    perPage: activeState.resultsPerPage,
    search: activeState.searchTerm,
    sort: activeState.sort,
  });

  const pastVisits = useVisits({
    status: "past",
    page: pastState.currentPage,
    perPage: pastState.resultsPerPage,
    search: pastState.searchTerm,
    sort: pastState.sort,
  });

  const { data: purposes } = useVisitPurposes();
  const { data: equipmentTypes } = useEquipmentItemTypes();

  const purposeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const purpose of purposes ?? [])
      map.set(purpose.referenceDataId, purpose.referenceDataName);
    return map;
  }, [purposes]);

  const equipmentTypeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of equipmentTypes ?? [])
      map.set(type.referenceDataId, type.referenceDataName);
    return map;
  }, [equipmentTypes]);

  const activeColumns = useMemo(
    () => getVisitColumns({ tab: "active", purposeNameById }),
    [purposeNameById],
  );
  const pastColumns = useMemo(
    () => getVisitColumns({ tab: "past", purposeNameById }),
    [purposeNameById],
  );

  const logVisitExit = useLogVisitExit();
  const [exitingVisit, setExitingVisit] = useState<Visit | null>(null);

  const handleConfirmExit = () => {
    if (!exitingVisit || !currentUser) return;
    logVisitExit.mutate(
      {
        visitorRegisterId: exitingVisit.visitorRegisterId,
        exitLoggedBy: currentUser.organizationUserId,
      },
      {
        onSuccess: () => {
          toast.success("Visit ended");
          setExitingVisit(null);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const activeActions = (row: Visit): RowAction[] => [
    { label: "Log exit", icon: PiSignOut, onClick: () => setExitingVisit(row) },
  ];

  const renderExpanded = (row: Visit) => (
    <VisitDetailsPanel
      visit={row}
      equipmentTypeNameById={equipmentTypeNameById}
    />
  );
  const canExpand = (row: Visit) => row.equipment.length > 0;

  return (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active Visits</TabsTrigger>
        <TabsTrigger value="past">Past Visits</TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <DataTable
          columns={activeColumns}
          data={activeVisits.data?.rows ?? []}
          totalItems={activeVisits.data?.count ?? 0}
          state={activeState}
          queryKey={["visits", "active"]}
          isLoading={activeVisits.isLoading}
          searchPlaceholder="Search by name"
          actions={activeActions}
          canExpand={canExpand}
          expandMode="single"
          renderExpanded={renderExpanded}
          emptyState={<EmptyState icon={PiUsers} title="No active visits" />}
        />
      </TabsContent>

      <TabsContent value="past">
        <DataTable
          columns={pastColumns}
          data={pastVisits.data?.rows ?? []}
          totalItems={pastVisits.data?.count ?? 0}
          state={pastState}
          queryKey={["visits", "past"]}
          isLoading={pastVisits.isLoading}
          searchPlaceholder="Search by name"
          canExpand={canExpand}
          expandMode="single"
          renderExpanded={renderExpanded}
          emptyState={<EmptyState icon={PiUsers} title="No past visits" />}
        />
      </TabsContent>

      <ConfirmDialog
        open={exitingVisit !== null}
        onOpenChange={(open) => {
          if (!open) setExitingVisit(null);
        }}
        title="Log exit"
        description={
          exitingVisit
            ? `Log ${exitingVisit.fullName} out? This marks their visit as ended and moves it to Past Visits.`
            : ""
        }
        confirmLabel="Log exit"
        isPending={logVisitExit.isPending}
        onConfirm={handleConfirmExit}
      />
    </Tabs>
  );
};
