#!/usr/bin/env node
// PreToolUse hook (matcher: Edit|Write|MultiEdit).
//
// Blocks hand-edits to generated files. `.claude/rules/architecture-rules.md` already says
// "never modify types.ts manually — always regenerate"; this makes that mechanical instead of
// relying on every session remembering it. inventory.md and ROADMAP.md are generated and
// CI-blocking exactly like types.ts, so they're guarded the same way.

import { readFileSync } from "node:fs";

const GUARDED_PATHS = [
  {
    path: "src/integrations/supabase/types.ts",
    fix: "npm run gen-supabase-types",
    rule: ".claude/rules/architecture-rules.md",
  },
  {
    path: "docs/architecture/inventory.md",
    fix: "npm run docs:arch",
    rule: "docs/architecture/inventory.md's own header comment",
  },
  {
    path: "docs/plan/ROADMAP.md",
    fix: "npm run docs:plan",
    rule: "docs/plan/README.md",
  },
];

let input = "";
try {
  input = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path ?? "";
const normalized = filePath.replace(/\\/g, "/");

const guarded = GUARDED_PATHS.find((g) => normalized.endsWith(g.path));
if (guarded) {
  console.error(
    `${guarded.path} is generated. Run \`${guarded.fix}\` instead of editing it directly. See ${guarded.rule}.`,
  );
  process.exit(2);
}

process.exit(0);
