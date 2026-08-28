// src/routes/AppRouter.tsx
import { createBrowserRouter, RouterProvider } from "react-router";
import type { RouteObject } from "react-router";
import type { AppRoute } from "@framework/types/routing";
import { publicRoutes, guardedRoutes } from "./registry";
import ProtectedRoute from "@framework/routes/ProtectedRoute";
import RootLayout from "@framework/app/layout/RootLayout";
import PageLayout from "@framework/app/layout/PageLayout";
import NotFound from "@framework/pages/NotFound";

// `layout` and `requiredRole` are config fields on AppRoute, not tree shape — they become
// pathless wrapper routes here so route modules never have to express nesting themselves.
const withLayout = (r: AppRoute): RouteObject => {
  const leaf: RouteObject = { path: r.path, element: r.element };
  return r.layout === "none"
    ? leaf
    : { element: <PageLayout />, children: [leaf] };
};

const withRoleGuard = (r: AppRoute): RouteObject =>
  r.requiredRole
    ? {
        element: <ProtectedRoute requiredRole={r.requiredRole} />,
        children: [withLayout(r)],
      }
    : withLayout(r);

// Created once at module scope — createBrowserRouter must not run inside a component body.
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...publicRoutes.map(withLayout),
      {
        element: <ProtectedRoute />,
        children: guardedRoutes.map(withRoleGuard),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
