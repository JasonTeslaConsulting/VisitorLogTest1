export type RouteLayout = "default" | "none";
export type RouteAccess = "public" | "authenticated";

export type AppRoute = {
  path: string;
  element: React.ReactNode;
  /** default: "authenticated" */
  access?: RouteAccess;
  /** implies "authenticated"; adds the extra ProtectedRoute role guard */
  requiredRole?: string | string[];
  /** default: "default" */
  layout?: RouteLayout;
};
