// App-owned barrel. Add a domain's line here only if it needs to stay reachable via the barrel
// for existing imports — new code should import from the domain file directly
// (e.g. `@/lib/constants/roles`).
//
// `STALE_TIMES`/`PAGINATION`/`AUTH` (`./app`) and `PERMISSION_OPTIONS` (`./permissions`) are
// framework-owned and moved to `platform/src/lib/constants/`, reachable as
// `@framework/lib/constants/<domain>` (or the `@framework/constants` barrel).
export * from "./roles";
