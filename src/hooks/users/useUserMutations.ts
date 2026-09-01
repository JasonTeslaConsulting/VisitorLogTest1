import {
  addPortalUser,
  assignRole,
  deactivateUser,
  unassignRole,
} from "@/services/users";
import type { AddPortalUserPayload } from "@/types/users";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAddPortalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddPortalUserPayload) => addPortalUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationUserId: string) =>
      deactivateUser(organizationUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationUserId,
      roleId,
    }: {
      applicationUserId: string;
      roleId: string;
    }) => assignRole({ applicationUserId, roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUnassignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applicationUserRoleId: string) =>
      unassignRole(applicationUserRoleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
