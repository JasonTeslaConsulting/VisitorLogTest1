import { useMemo, useState } from "react";
import { PiPlus, PiUsers } from "react-icons/pi";

import { Button } from "@framework/components/ui/button";
import { ConfirmDialog } from "@framework/components/ui/ConfirmDialog";
import { DataTable } from "@framework/components/ui/datatable/DataTable";
import { EmptyState } from "@framework/components/ui/EmptyState";
import { Field, FieldLabel } from "@framework/components/ui/field";
import { FilterSheet } from "@framework/components/ui/FilterSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";
import { toast } from "@framework/components/ui/toast";
import { useTableState } from "@framework/hooks/useTableState";
import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";

import { AddUserSheet } from "@/components/UserManagement/AddUserSheet";
import { EditRolesSheet } from "@/components/UserManagement/EditRolesSheet";
import {
  getUserColumns,
  getUserRowActions,
} from "@/components/UserManagement/UserColumns";
import { useDeactivateUser } from "@/hooks/users/useUserMutations";
import { useUsers } from "@/hooks/users/useUsers";
import type { PortalUser } from "@/types/users";

export const UserManagement = () => {
  const state = useTableState();
  const { data: users, isLoading } = useUsers();
  const { mutate: deactivateUser, isPending: isDeactivating } =
    useDeactivateUser();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PortalUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<PortalUser | null>(
    null,
  );

  // DataTable runs mode="client" — listUsers() has no pagination params, so it
  // only searches/sorts/paginates in memory. The status filter is this page's
  // own predicate over that full result, per ScopedListPage.tsx's convention.
  const filteredUsers = useMemo(() => {
    const status = state.filters.status ?? "active";
    if (status === "all") return users ?? [];
    return (users ?? []).filter((user) =>
      status === "active"
        ? user.employmentEndDate === null
        : user.employmentEndDate !== null,
    );
  }, [users, state.filters.status]);

  const columns = useMemo(() => getUserColumns(), []);
  const rowActions = useMemo(
    () =>
      getUserRowActions({
        onEditRoles: setEditingUser,
        onDeactivate: setDeactivatingUser,
      }),
    [],
  );

  const handleConfirmDeactivate = () => {
    if (!deactivatingUser) return;
    deactivateUser(deactivatingUser.organizationUserId, {
      onSuccess: () => {
        toast.success("User deactivated");
        setDeactivatingUser(null);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <SingleCardTemplate
      title="Users"
      width="wide"
      headerActions={
        <Button
          startIcon={<PiPlus className="size-4" />}
          onClick={() => setIsAddOpen(true)}
        >
          Add user
        </Button>
      }
    >
      <DataTable
        mode="client"
        columns={columns}
        data={filteredUsers}
        state={state}
        queryKey={["users"]}
        isLoading={isLoading}
        actions={rowActions}
        searchPlaceholder="Search by name"
        emptyState={
          <EmptyState
            icon={PiUsers}
            title="No users found"
            action={
              <Button onClick={() => setIsAddOpen(true)}>Add user</Button>
            }
          />
        }
        filterSheet={
          <FilterSheet
            activeCount={state.activeFilterCount}
            onClear={state.clearFilters}
            onApply={state.applyFilters}
            onDiscard={state.discardDraft}
            canApply={state.isFilterDirty}
          >
            <Field>
              <FieldLabel htmlFor="filter-status">Status</FieldLabel>
              <Select
                value={state.draftFilters.status ?? "active"}
                onValueChange={(value) => state.setDraftFilter("status", value)}
              >
                <SelectTrigger id="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deactivated">Deactivated</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FilterSheet>
        }
      />

      <AddUserSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={() => setIsAddOpen(false)}
      />

      {editingUser && (
        <EditRolesSheet
          key={editingUser.organizationUserId}
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      <ConfirmDialog
        open={deactivatingUser !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivatingUser(null);
        }}
        title={
          deactivatingUser ? `Deactivate ${deactivatingUser.fullName}?` : ""
        }
        description="They will no longer be able to sign in."
        confirmLabel="Deactivate"
        variant="secondary"
        isPending={isDeactivating}
        onConfirm={handleConfirmDeactivate}
      />
    </SingleCardTemplate>
  );
};
