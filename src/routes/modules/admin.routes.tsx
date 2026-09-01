import type { AppRoute } from "@framework/types/routing";
import { ROLES } from "@/lib/constants/roles";
import { UserManagement } from "@/pages/UserManagement";

export const routes = [
  {
    path: "/admin/users",
    element: <UserManagement />,
    requiredRole: ROLES.USER_ADMIN,
  },
] satisfies AppRoute[];
