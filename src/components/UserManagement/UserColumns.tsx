import { PiPencilSimple, PiUserMinus } from "react-icons/pi";
import { Badge } from "@framework/components/ui/badge";
import { DateTimeUtils } from "@framework/lib";
import type { DataTableColumn, RowAction } from "@framework/types/table";
import type { PortalUser } from "@/types/users";

export function getUserColumns(): DataTableColumn<PortalUser>[] {
  return [
    {
      id: "fullname",
      header: "Full name",
      accessor: (row) => row.fullName,
      sortable: true,
    },
    {
      id: "primaryemail",
      header: "Email",
      accessor: (row) => row.primaryEmail,
    },
    {
      id: "roles",
      header: "Roles",
      wrap: true,
      accessor: (row) =>
        row.roles.length === 0 ? null : (
          <div className="flex flex-wrap gap-1">
            {row.roles.map((role) => (
              <Badge key={role.roleId} variant="secondary">
                {role.roleName}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      id: "employmentstartdate",
      header: "Employment start",
      accessor: (row) => DateTimeUtils.formatDateTime(row.employmentStartDate),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) =>
        row.employmentEndDate === null ? "active" : "deactivated",
      badge: { variants: { active: "success", deactivated: "secondary" } },
    },
  ];
}

type GetUserRowActionsParams = {
  onEditRoles: (user: PortalUser) => void;
  onDeactivate: (user: PortalUser) => void;
};

export function getUserRowActions({
  onEditRoles,
  onDeactivate,
}: GetUserRowActionsParams) {
  return (row: PortalUser): RowAction[] => {
    const actions: RowAction[] = [];

    if (row.applicationUserId !== null) {
      actions.push({
        label: "Edit roles",
        icon: PiPencilSimple,
        onClick: () => onEditRoles(row),
      });
    }

    if (row.employmentEndDate === null) {
      actions.push({
        label: "Deactivate",
        icon: PiUserMinus,
        onClick: () => onDeactivate(row),
      });
    }

    return actions;
  };
}
