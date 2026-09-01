import { listVisits } from "@/services/visitor";
import type { ListVisitsParams } from "@/types/visitor";
import { STALE_TIMES } from "@framework/lib/constants/app";
import { useQuery } from "@tanstack/react-query";

export function useVisits(params: ListVisitsParams) {
  return useQuery({
    queryKey: ["visits", params],
    queryFn: () => listVisits(params),
    staleTime:
      params.status === "active" ? STALE_TIMES.FREQUENT : STALE_TIMES.STATIC,
  });
}
