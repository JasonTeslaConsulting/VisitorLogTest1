#!/usr/bin/env node
// Discards local edits to framework-owned files, restoring them to what this repo last committed
// — which, in a consumer portal, is what the last `framework:update` pinned.
//
// This is the escape hatch `framework:update` points at when it aborts: the sanctioned way to get
// back to a clean boundary without hand-picking paths. The other sanctioned way is to move the
// change upstream into the framework repo, which this command deliberately cannot do for you.
//
// Scope is exactly the framework surface: the subtree prefix (platform/) plus every materialized
// target (vite.config.ts, the tsconfigs, src/main.tsx, …). App-owned and seeded files are never
// touched — an app's own work is not this command's business.
//
// Run: npm run framework:reset
//      npm run framework:reset -- --dry-run    list what would be discarded, change nothing
//
// It restores from HEAD, not from the remote. If HEAD *itself* contains a committed fork (someone
// committed an edit to platform/), this cannot help — that needs `framework:update` after the
// change is upstreamed, or a manual revert. The command says so rather than pretending.

import { execFileSync, spawnSync } from "node:child_process";
import {
  loadManifest,
  materializedPaths,
  resolveRole,
} from "./framework-lib.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const manifest = loadManifest(root);
if (!manifest) {
  console.error(
    "framework:reset — platform/framework.json not found or not valid JSON.",
  );
  process.exit(1);
}

const { prefix = "platform" } = manifest.subtree ?? {};
const scope = [prefix, ...materializedPaths(manifest)];

// Only paths git actually reports as changed — so the summary names what really happened rather
// than implying it rewrote the whole framework.
let changed = [];
try {
  const out = execFileSync("git", ["status", "--porcelain", "--", ...scope], {
    encoding: "utf8",
  }).trim();
  changed = out ? out.split("\n").map((l) => l.trim()) : [];
} catch (e) {
  console.error(`framework:reset — \`git status\` failed: ${e.message}`);
  process.exit(1);
}

if (changed.length === 0) {
  console.log(
    "framework:reset — nothing to discard; every framework-owned file already matches HEAD.",
  );
  console.log(
    "\nIf `framework:verify` is still reporting a violation, the fork is COMMITTED rather than " +
      "uncommitted — this command cannot help with that. Either upstream the change and run " +
      "`npm run framework:update`, or revert the commit that introduced it.",
  );
  process.exit(0);
}

console.log(
  `framework:reset — ${changed.length} framework-owned path(s) differ from HEAD:\n`,
);
for (const line of changed) console.log(`  ${line}`);

if (dryRun) {
  console.log("\nframework:reset — dry run, nothing changed.");
  process.exit(0);
}

// `git checkout --` discards working-tree changes for tracked files; `git clean -fd` removes
// untracked files that appeared inside the framework surface (e.g. a stray new file under
// platform/). Both are scoped to the framework paths only.
console.log("\nframework:reset — restoring from HEAD…");
const checkout = spawnSync("git", ["checkout", "--", ...scope], {
  stdio: "inherit",
});
if (checkout.status !== 0) {
  console.error(
    "framework:reset — `git checkout` failed; nothing further attempted.",
  );
  process.exit(checkout.status ?? 1);
}
const clean = spawnSync("git", ["clean", "-fd", "--", ...scope], {
  stdio: "inherit",
});
if (clean.status !== 0) {
  console.error(
    "framework:reset — `git clean` failed; the checkout above did succeed.",
  );
  process.exit(clean.status ?? 1);
}

const { role } = resolveRole(root);
console.log(
  `\nframework:reset — done. platform/ and the materialized files match HEAD` +
    (role === "consumer" ? " (the last pinned framework version)." : "."),
);
console.log("Re-check with: npm run framework:verify");
