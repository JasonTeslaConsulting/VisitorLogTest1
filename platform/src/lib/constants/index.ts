// Framework-owned barrel, reachable as `@framework/lib/constants`. A separate, app-owned barrel
// exists at src/lib/constants/index.ts (`@/lib/constants`), which re-exports `./roles` — role
// names are per portal, so `ROLES` is app-owned and deliberately absent from this file. Framework
// code imports the domain file directly (e.g. `@framework/lib/constants/app`) so nothing depends
// on this file's location.
export * from "./app";
export * from "./permissions";
export * from "./status";
