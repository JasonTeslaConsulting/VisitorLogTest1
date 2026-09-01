import { useMemo, useState } from "react";
import { PiSignOut, PiUsers } from "react-icons/pi";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFieldLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@framework/components/ui/combobox";
import { ConfirmDialog } from "@framework/components/ui/ConfirmDialog";
import { DataTable } from "@framework/components/ui/datatable/DataTable";
import { EmptyState } from "@framework/components/ui/EmptyState";
import { FilterSheet } from "@framework/components/ui/FilterSheet";
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
import type { RowAction, TableState } from "@framework/types/table";
import { getVisitColumns } from "@/components/Visits/VisitColumns";
import {
  useEquipmentItemTypes,
  useVisitHosts,
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

type VisitTablesProps = {
  /**
   * "mine" (default): the Staff-facing /visits page — unchanged from before this prop existed.
   * "all": the Office Manager's /visits/manager page — adds a Host column and a per-tab host
   * filter. RLS (`is_visitor_admin()`) is what actually widens the result set; this only changes
   * what's requested and displayed.
   */
  scope?: "mine" | "all";
};

/**
 * The host filter field inside a tab's `FilterSheet` — bound to that tab's own
 * `draftFilters.hostId`/`setDraftFilter`, independent from the other tab's.
 */
function HostFilterField({
  state,
  hostOptions,
}: {
  state: TableState;
  hostOptions: { value: string; label: string }[];
}) {
  const selected =
    hostOptions.find((option) => option.value === state.draftFilters.hostId) ??
    null;

  return (
    <Combobox
      items={hostOptions}
      value={selected}
      onValueChange={(item) =>
        state.setDraftFilter("hostId", item?.value ?? null)
      }
    >
      <ComboboxFieldLabel>Host</ComboboxFieldLabel>
      <ComboboxTrigger>
        <ComboboxValue placeholder="Any host" />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search hosts" />
        <ComboboxEmpty>No hosts found.</ComboboxEmpty>
        <ComboboxList>
          {(option: (typeof hostOptions)[number]) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export const VisitTables = ({ scope = "mine" }: VisitTablesProps = {}) => {
  const { currentUser } = useAuth();

  const activeState = useTableState();
  const pastState = useTableState();

  const activeVisits = useVisits({
    status: "active",
    page: activeState.currentPage,
    perPage: activeState.resultsPerPage,
    search: activeState.searchTerm,
    sort: activeState.sort,
    hostId:
      scope === "all" ? (activeState.filters.hostId ?? undefined) : undefined,
  });

  const pastVisits = useVisits({
    status: "past",
    page: pastState.currentPage,
    perPage: pastState.resultsPerPage,
    search: pastState.searchTerm,
    sort: pastState.sort,
    hostId:
      scope === "all" ? (pastState.filters.hostId ?? undefined) : undefined,
  });

  const { data: purposes } = useVisitPurposes();
  const { data: equipmentTypes } = useEquipmentItemTypes();
  // Rules of Hooks require this to be called unconditionally; Staff's /visits page (scope "mine")
  // just doesn't use the result below. It shares the "visitHosts" query cache with the
  // registration form, so the cost of the extra call is a cache hit, not a network request.
  const { data: hosts } = useVisitHosts();

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

  const hostNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const host of hosts ?? [])
      map.set(host.organizationUserId, host.fullName);
    return map;
  }, [hosts]);

  const hostOptions = useMemo(
    () =>
      (hosts ?? []).map((host) => ({
        value: host.organizationUserId,
        label: host.fullName,
      })),
    [hosts],
  );

  const showHost = scope === "all";

  const activeColumns = useMemo(
    () =>
      getVisitColumns({
        tab: "active",
        purposeNameById,
        showHost,
        hostNameById,
      }),
    [purposeNameById, showHost, hostNameById],
  );
  const pastColumns = useMemo(
    () =>
      getVisitColumns({
        tab: "past",
        purposeNameById,
        showHost,
        hostNameById,
      }),
    [purposeNameById, showHost, hostNameById],
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
          filterSheet={
            showHost ? (
              <FilterSheet
                activeCount={activeState.activeFilterCount}
                onClear={activeState.clearFilters}
                onApply={activeState.applyFilters}
                onDiscard={activeState.discardDraft}
                canApply={activeState.isFilterDirty}
              >
                <HostFilterField
                  state={activeState}
                  hostOptions={hostOptions}
                />
              </FilterSheet>
            ) : undefined
          }
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
          filterSheet={
            showHost ? (
              <FilterSheet
                activeCount={pastState.activeFilterCount}
                onClear={pastState.clearFilters}
                onApply={pastState.applyFilters}
                onDiscard={pastState.discardDraft}
                canApply={pastState.isFilterDirty}
              >
                <HostFilterField state={pastState} hostOptions={hostOptions} />
              </FilterSheet>
            ) : undefined
          }
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
