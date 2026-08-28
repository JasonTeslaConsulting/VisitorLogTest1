// App-owned barrel. Add a domain's line here only if it needs to stay reachable via the barrel
// for existing imports — new code should import from the domain file directly
// (e.g. `@/types/<domain>`).
//
// Starts empty: every type domain that used to live here (auth, navigation, roles, routing,
// table, templates, users) is framework-owned and moved to `platform/src/types/`, reachable as
// `@framework/types/<domain>` (or the `@framework/types` barrel). Add this portal's own type
// domains here as they're created.
export {};
