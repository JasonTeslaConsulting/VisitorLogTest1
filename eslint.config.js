// App-owned. Deliberately thin: the framework's layering rules (Pages → Hooks → Services →
// Supabase, Base UI only through components/ui, the DataTable seam) and its design-token
// enforcement live in platform/config/eslint.base.js and are read-only in a portal.
//
// Add rules that are genuinely specific to THIS portal below. A rule every portal should follow
// belongs upstream in the framework base instead — that is what makes it reach the other portals.
import { frameworkConfig } from "./platform/config/eslint.base.js";

export default [
  ...frameworkConfig,

  // ---------------------------------------------------------------------------
  // This portal's own rules go here. Empty by design on a fresh app.
  // ---------------------------------------------------------------------------
];
