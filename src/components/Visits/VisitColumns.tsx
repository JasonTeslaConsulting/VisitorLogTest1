import { DateTimeUtils } from "@framework/lib";
import type { DataTableColumn } from "@framework/types/table";
import type { Visit } from "@/types/visitor";

type GetVisitColumnsParams = {
  /** Active tab omits the Exit column entirely; Past tab includes it. */
  tab: "active" | "past";
  /** `visitPurposeId` -> display name, from `useVisitPurposes()`. */
  purposeNameById: Map<string, string>;
};

export function getVisitColumns({
  tab,
  purposeNameById,
}: GetVisitColumnsParams): DataTableColumn<Visit>[] {
  const columns: DataTableColumn<Visit>[] = [
    {
      id: "fullname",
      header: "Full name",
      accessor: (row) => row.fullName,
      sortable: true,
    },
    {
      id: "organization",
      header: "Organization",
      accessor: (row) => row.organization ?? "—",
    },
    {
      id: "visitpurposeid",
      header: "Purpose",
      accessor: (row) =>
        purposeNameById.get(row.visitPurposeId) ?? row.visitPurposeId ?? "—",
    },
    {
      id: "entrydate",
      header: "Entry",
      accessor: (row) => DateTimeUtils.formatDateTime(row.entryDate),
      sortable: true,
    },
  ];

  if (tab === "past") {
    columns.push({
      id: "exitdate",
      header: "Exit",
      accessor: (row) =>
        row.exitDate ? DateTimeUtils.formatDateTime(row.exitDate) : "—",
      sortable: true,
    });
  }

  columns.push({
    id: "equipment",
    header: "Equipment",
    accessor: (row) =>
      row.equipment.length === 0
        ? "—"
        : `${row.equipment.length} item${row.equipment.length === 1 ? "" : "s"}`,
  });

  return columns;
}
