import { listAssignableRoles, listUsers } from "@/services/users";
import { STALE_TIMES } from "@framework/lib/constants/app";
import { useQuery } from "@tanstack/react-query";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    staleTime: STALE_TIMES.STANDARD,
  });
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: ["assignableRoles"],
    queryFn: listAssignableRoles,
    staleTime: STALE_TIMES.STATIC,
  });
}
