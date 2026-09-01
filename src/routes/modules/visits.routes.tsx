import type { AppRoute } from "@framework/types/routing";
import { ROLES } from "@/lib/constants/roles";
import { Visits } from "@/pages/Visits";
import { VisitsManager } from "@/pages/VisitsManager";
import { VisitsToday } from "@/pages/VisitsToday";

export const routes = [
  { path: "/visits", element: <Visits />, requiredRole: ROLES.STAFF },
  {
    path: "/visits/manager",
    element: <VisitsManager />,
    requiredRole: ROLES.OFFICE_MANAGER,
  },
  {
    path: "/visits/today",
    element: <VisitsToday />,
    requiredRole: ROLES.OFFICE_MANAGER,
  },
] satisfies AppRoute[];
