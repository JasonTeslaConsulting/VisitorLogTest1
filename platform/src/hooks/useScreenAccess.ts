import { useAuth } from "@framework/contexts/AuthContext";

export const useScreenAccess = (screenId: string) => {
  const { hasScreenAccess } = useAuth();

  return {
    canRead: hasScreenAccess(screenId, "read"),
    canWrite: hasScreenAccess(screenId, "write"),
    canDelete: hasScreenAccess(screenId, "delete"),
  };
};
