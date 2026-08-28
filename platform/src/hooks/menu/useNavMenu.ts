import { useAuth } from "@framework/contexts/AuthContext";
import { STALE_TIMES } from "@framework/lib/constants/app";
import { getNavMenu } from "@framework/services/menu";
import { useQuery } from "@tanstack/react-query";

export function useNavMenu() {
  const { currentUser } = useAuth();
  const organizationUserId = currentUser?.organizationUserId;

  return useQuery({
    queryKey: ["navMenu", organizationUserId],
    queryFn: () => getNavMenu(),
    enabled: !!organizationUserId,
    staleTime: STALE_TIMES.STATIC,
  });
}
