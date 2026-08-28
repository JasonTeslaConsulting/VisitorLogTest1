// App-owned: role names are rows in *this* portal's database, so the framework cannot know them
// and never syncs this file. Add an entry per role the app guards a route with, then use it as
// `requiredRole` (see .claude/skills/add-new-route/SKILL.md).
//
// Starts empty on purpose. The previous `USER_ADMIN` entry existed only to guard the framework's
// admin-page stub, which was deleted — see docs/architecture/user-administration.md. Generation
// must ask which roles a portal has rather than inherit an example.
//
// Entries sorted alphabetically by key — sorted lists conflict less than appending at a marker
// when two branches add a role at the same time.
export const ROLES = {} as const;
