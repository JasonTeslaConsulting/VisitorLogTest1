import type { AppRoute } from "@framework/types/routing";
import { Register } from "@/pages/Register";

export const routes = [
  {
    path: "/register",
    element: <Register />,
    access: "public",
    layout: "none",
  },
] satisfies AppRoute[];
