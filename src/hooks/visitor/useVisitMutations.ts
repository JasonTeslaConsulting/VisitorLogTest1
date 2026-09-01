import { createVisit, logVisitExit } from "@/services/visitor";
import type { CreateVisitPayload } from "@/types/visitor";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVisitPayload) => createVisit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

export function useLogVisitExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visitorRegisterId,
      exitLoggedBy,
    }: {
      visitorRegisterId: string;
      exitLoggedBy: string;
    }) => logVisitExit(visitorRegisterId, exitLoggedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}
