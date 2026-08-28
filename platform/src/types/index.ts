// Framework-owned barrel, reachable as `@framework/types`. A separate, app-owned barrel exists
// at src/types/index.ts (`@/types`) — new type domains added by an app go there, not here.
// Framework code imports the domain file directly (e.g. `@framework/types/routing`) so nothing
// depends on this file's location.
export * from "./auth";
export * from "./navigation";
export * from "./roles";
export * from "./routing";
export * from "./users";
export * from "./templates";
