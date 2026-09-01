import {
  getPolicyText,
  listCountryDialCodes,
  listEquipmentItemTypes,
  listVisitHosts,
  listVisitPurposes,
} from "@/services/visitor";
import { STALE_TIMES } from "@framework/lib/constants/app";
import { useQuery } from "@tanstack/react-query";

export function useVisitHosts() {
  return useQuery({
    queryKey: ["visitHosts"],
    queryFn: () => listVisitHosts(),
    staleTime: STALE_TIMES.STATIC,
  });
}

export function useVisitPurposes() {
  return useQuery({
    queryKey: ["visitPurposes"],
    queryFn: () => listVisitPurposes(),
    staleTime: STALE_TIMES.STATIC,
  });
}

export function useEquipmentItemTypes() {
  return useQuery({
    queryKey: ["equipmentItemTypes"],
    queryFn: () => listEquipmentItemTypes(),
    staleTime: STALE_TIMES.STATIC,
  });
}

export function usePolicyText() {
  return useQuery({
    queryKey: ["policyText"],
    queryFn: () => getPolicyText(),
    staleTime: STALE_TIMES.STATIC,
  });
}

export function useCountryDialCodes() {
  return useQuery({
    queryKey: ["countryDialCodes"],
    queryFn: () => listCountryDialCodes(),
    staleTime: STALE_TIMES.STATIC,
  });
}
