import type { AppRoute } from "@framework/types/routing";
import { Home } from "@/pages/Home";

export const routes = [
  { path: "/home", element: <Home /> },
] satisfies AppRoute[];
