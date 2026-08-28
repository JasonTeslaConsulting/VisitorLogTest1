#!/usr/bin/env node
// PreToolUse hook (matcher: Edit|Write|MultiEdit).
//
// Blocks Claude Code's own Edit/Write/MultiEdit tools from touching a framework-owned or
// materialized path when platform/framework.json's role is "consumer". A no-op in this repo
// (role: "source") — framework development happens here, editing platform/** is normal.
//
// This is not a security boundary — it stops an agent wandering into read-only territory by
// accident, the same way `guard-generated.mjs` stops a hand-edit of a generated file. A human
// editing the same path with their own editor is unaffected; the real enforcement for a consumer
// repo is `npm run framework:verify -- --check` in CI (platform/framework.lock), which this hook
// exists to help nobody ever need to invoke in anger.

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  HASH_CHECKED_CATEGORIES,
  loadManifest,
  getCategories,
  classify,
  toRepoRelative,
  resolveRole,
} from "../../platform/scripts/framework-lib.mjs";

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
if (!filePath) process.exit(0);

const root = process.cwd();
const manifest = loadManifest(root);
if (!manifest) process.exit(0);
// Role comes from package.json, not the manifest — see resolveRole()'s comment for why.
if (resolveRole(root).role !== "consumer") process.exit(0);

const categories = getCategories(manifest);
const relative = toRepoRelative(root, path.resolve(root, filePath));
const category = classify(categories, relative);

if (category && HASH_CHECKED_CATEGORIES.has(category.name)) {
  console.error(
    `${relative} is framework-owned (${category.name}) and read-only in this repo — ` +
      `package.json's framework.role is "consumer". Extend it from app code instead, or ` +
      `request the change upstream in the framework repo. See docs/DECISIONS.md for the ` +
      "framework/app boundary this repo follows.",
  );
  process.exit(2);
}

process.exit(0);
