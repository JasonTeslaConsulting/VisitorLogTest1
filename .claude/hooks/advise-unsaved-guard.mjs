#!/usr/bin/env node
// PostToolUse hook (matcher: Edit|Write|MultiEdit).
//
// Notices a form rendered inside a Dialog/Sheet with no `useUnsavedChangesGuard` and says so, while
// the agent is still working on that file. `local/require-unsaved-guard` catches the same thing, but
// only when someone runs lint — which may be many edits later, or in CI after a push. This closes
// that gap.
//
// WHY PostToolUse AND NOT PreToolUse. The other two hooks here (guard-framework, guard-generated)
// block on PreToolUse because they answer "may this file be written at all", which is knowable from
// the path alone. This question needs the finished content, and a dialog is legitimately written a
// couple of edits before its guard is wired up — blocking that would fight the agent rather than
// help it. So: advise, never block. Exit 0 always.
//
// Text-based rather than AST-based on purpose: this runs on every matching write and must be cheap
// and dependency-free. The precise check is the ESLint rule; the name lists are shared with it via
// unsaved-guard-shared.js so the two cannot disagree about what counts.

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  OVERLAY_COMPONENTS,
  FIELD_COMPONENTS,
  isFormComponentName,
  GUARD_HOOK,
  isExemptPath,
  ADVICE,
} from "../../platform/scripts/eslint-rules/unsaved-guard-shared.js";

let payload;
try {
  payload = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path ?? "";
if (!filePath.endsWith(".tsx")) process.exit(0);

const relative = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
if (isExemptPath(relative) || relative.includes("/samples/")) process.exit(0);

let source = "";
try {
  source = readFileSync(filePath, "utf8");
} catch {
  process.exit(0); // deleted or moved between the write and this hook — not our problem
}

if (source.includes(GUARD_HOOK)) process.exit(0);

const hasOverlay = [...OVERLAY_COMPONENTS].some((name) =>
  new RegExp(`<${name}[\\s>]`).test(source),
);
if (!hasOverlay) process.exit(0);

const jsxNames = [...source.matchAll(/<([A-Z][A-Za-z0-9_]*)[\s/>]/g)].map(
  (m) => m[1],
);
const dataEntry = jsxNames.find(
  (name) => FIELD_COMPONENTS.has(name) || isFormComponentName(name),
);
if (!dataEntry) process.exit(0);

// Non-blocking: stdout becomes context the agent reads, and exit 0 lets the write stand.
console.log(
  `[unsaved-changes] ${relative} — <${dataEntry}> inside an overlay.\n\n${ADVICE}`,
);
process.exit(0);
