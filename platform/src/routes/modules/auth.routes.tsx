import type { AppRoute } from "@framework/types/routing";
import { Login } from "@framework/pages/Login";

export const routes = [
  { path: "/", element: <Login />, access: "public", layout: "none" },
] satisfies AppRoute[];
