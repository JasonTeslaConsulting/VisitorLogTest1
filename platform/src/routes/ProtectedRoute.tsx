import { Navigate, Outlet } from "react-router";
import { useAuth } from "@framework/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "@framework/components/ui/toast";
import { AUTH } from "@framework/lib/constants/app";
import { LoadingScreen } from "@framework/components/ui/LoadingScreen";

type ProtectedRouteProps = {
  requiredRole?: string | string[];
};

const ProtectedRoute = (props: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole, currentUser, loading } = useAuth();
  const { requiredRole } = props;

  const hasAccess = !requiredRole
    ? true
    : Array.isArray(requiredRole)
      ? requiredRole.some(hasRole)
      : hasRole(requiredRole);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to continue.");
    } else if (!hasAccess) {
      toast.error("You don't have permission to access this page.");
    }
  }, [loading, isAuthenticated, hasAccess]);

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={AUTH.LOGIN_PATH} replace />;
  if (!hasAccess) return <Navigate to={AUTH.REDIRECT_PATH} replace />;
  return <Outlet />;
};

export default ProtectedRoute;
