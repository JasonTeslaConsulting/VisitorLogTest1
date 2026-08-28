import type { AppRoute } from "@framework/types/routing";

// Glob-discovered route modules — the aggregator, not a place to add routes.
// Add a route by editing/creating a file in the app's src/routes/modules/ (never here, and
// never in platform/src/routes/modules/, which is framework-owned).
//
// Two roots, because framework and app route modules physically live in different trees since
// the framework/app split moved this file to platform/src/routes/. Vite's import.meta.glob
// resolves a leading "/" as project-root-relative, so the app root is spelled that way rather
// than a depth-fragile "../../../src/...". An app never edits platform/src/routes/modules/ (it's
// framework-owned), and the framework never edits src/routes/modules/ — so a route can only ever
// be discovered once, never duplicated across the two globs.
//
// Ordering note: react-router@8's createBrowserRouter ranks matches by path
// specificity (rankRouteBranches), not declaration order, so the order these
// modules are discovered in has no effect on which route wins a match.
// Don't "fix" this into a sorted/explicit list.
const frameworkModules = import.meta.glob<{ routes: AppRoute[] }>(
  "./modules/*.routes.tsx",
  { eager: true },
);
const appModules = import.meta.glob<{ routes: AppRoute[] }>(
  "/src/routes/modules/*.routes.tsx",
  { eager: true },
);
const modules = { ...frameworkModules, ...appModules };

const allRoutes: AppRoute[] = Object.entries(modules).flatMap(([file, mod]) => {
  if (!Array.isArray(mod?.routes)) {
    if (import.meta.env.DEV) {
      console.error(`[routes] ${file} has no exported \`routes\` array`);
    }
    return [];
  }
  return mod.routes;
});

if (import.meta.env.DEV) {
  const seen = new Set<string>();
  for (const r of allRoutes) {
    if (seen.has(r.path)) {
      console.error(`[routes] duplicate path: ${r.path}`);
    }
    seen.add(r.path);
  }
  console.info(
    `[routes] ${allRoutes.length} routes from ${Object.keys(modules).length} modules`,
  );
}

export const publicRoutes = allRoutes.filter((r) => r.access === "public");
export const guardedRoutes = allRoutes.filter((r) => r.access !== "public");
