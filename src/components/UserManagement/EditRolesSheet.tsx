import { useState } from "react";

import { Button } from "@framework/components/ui/button";
import { MultiSelect } from "@framework/components/ui/MultiSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@framework/components/ui/sheet";
import { toast } from "@framework/components/ui/toast";
import { UnsavedChangesDialog } from "@framework/components/ui/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "@framework/hooks/useUnsavedChangesGuard";

import { useAssignableRoles } from "@/hooks/users/useUsers";
import { useAssignRole, useUnassignRole } from "@/hooks/users/useUserMutations";
import type { PortalUser } from "@/types/users";

type EditRolesSheetProps = {
  user: PortalUser;
  onClose: () => void;
};

export const EditRolesSheet = ({ user, onClose }: EditRolesSheetProps) => {
  const { data: assignableRoles } = useAssignableRoles();
  const { mutateAsync: assignRole } = useAssignRole();
  const { mutateAsync: unassignRole } = useUnassignRole();

  // This sheet is only ever opened for a user with a linked application account
  // (UserColumns.tsx hides "Edit roles" otherwise), so assignRole's required id is safe here.
  const applicationUserId = user.applicationUserId as string;

  const originalRoleIds = user.roles.map((role) => role.roleId);
  const [selectedRoleIds, setSelectedRoleIds] =
    useState<string[]>(originalRoleIds);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    [...selectedRoleIds].sort().join(",") !==
    [...originalRoleIds].sort().join(",");

  const guard = useUnsavedChangesGuard({ when: isDirty });

  const options =
    assignableRoles?.map((role) => ({
      value: role.roleId,
      label: role.roleName,
    })) ?? [];

  const handleSave = async () => {
    const toAdd = selectedRoleIds.filter(
      (roleId) => !originalRoleIds.includes(roleId),
    );
    const toRemove = user.roles.filter(
      (role) => !selectedRoleIds.includes(role.roleId),
    );

    setIsSaving(true);
    try {
      await Promise.all([
        ...toAdd.map((roleId) => assignRole({ applicationUserId, roleId })),
        ...toRemove.map((role) => unassignRole(role.applicationUserRoleId)),
      ]);
      toast.success("Roles updated");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update roles",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={guard.guardOpenChange(() => onClose())}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit roles</SheetTitle>
          <SheetDescription>{user.fullName}</SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <MultiSelect
            label="Roles"
            options={options}
            value={selectedRoleIds}
            onValueChange={setSelectedRoleIds}
          />
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => guard.requestClose(onClose)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save changes
          </Button>
        </SheetFooter>

        <UnsavedChangesDialog guard={guard} />
      </SheetContent>
    </Sheet>
  );
};
