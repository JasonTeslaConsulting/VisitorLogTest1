import type { AppRoute } from "@framework/types/routing";
import { ROLES } from "@/lib/constants/roles";
import { Visits } from "@/pages/Visits";

export const routes = [
  { path: "/visits", element: <Visits />, requiredRole: ROLES.STAFF },
] satisfies AppRoute[];
