// Shared glob-matching and classification logic for the framework/app boundary
// (platform/framework.json). Used by framework-verify.mjs, framework-lock.mjs, and the
// .claude/hooks/guard-framework.mjs PreToolUse hook.
//
// Factored out rather than duplicated: a second, independently-maintained copy of "how does a
// path get classified" is exactly the kind of silent-drift bug this whole boundary exists to
// prevent — two copies disagreeing about whether a path is framework-owned would be worse than
// having no check at all, since it would look enforced without actually being consistent.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

// Content hashing for platform/framework.lock, with CRLF collapsed to LF first.
//
// THIS NORMALIZATION IS LOAD-BEARING, not tidiness. `.gitattributes` declares `* text=auto
// eol=lf`, so git stores LF and a fresh clone checks out LF — but a working tree that predates
// that setting (or any tool that rewrote a file) can still hold CRLF. Hashing raw bytes therefore
// produces DIFFERENT hashes for identical content depending on when the file was checked out, and
// a freshly-cloned portal lights up with a dozen "framework file modified" errors on files nobody
// touched. That trains people to ignore Gate B, which is worse than not having it.
//
// Verified: tsconfig.node.json hashed 8dc2fd2a… in a CRLF tree and a96b9ba5… in an LF clone; both
// hash to a96b9ba5… once normalized.
//
// The trade is that a pure line-ending change to a framework file is not flagged. That is the
// right call — `.gitattributes` owns line endings, and it is not a content change.
export const normalizeEol = (text) => text.replace(/\r\n/g, "\n");

export const hashContent = (text) =>
  createHash("sha256").update(normalizeEol(text)).digest("hex");

export const CATEGORY_ORDER = [
  "ignored",
  "framework",
  "materialized",
  "seeded",
  "app",
];

// A category name that is hash-checked against platform/framework.lock in a consumer repo.
// "seeded" and "app" are never hash-checked — an app is expected, and meant, to edit them.
export const HASH_CHECKED_CATEGORIES = new Set(["framework", "materialized"]);

export function readJson(root, relativePath) {
  try {
    return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    return null;
  }
}

export function loadManifest(root) {
  return readJson(root, "platform/framework.json");
}

// The directory inside the synced prefix holding canonical copies of `materialized` files —
// framework content that has to sit at a path the toolchain hardcodes (vite.config.ts, the
// tsconfigs, src/main.tsx, …) and therefore cannot live under platform/ at its real location.
//
// WHY THIS EXISTS: `git subtree split --prefix=platform` only carries what is *inside* platform/.
// Without a copy in here, a framework update could never deliver a new vite.config.ts — and
// worse, the incoming framework.lock would carry upstream's hash for a file that never changed
// locally, so framework:verify would falsely accuse the app of editing a framework file.
// `npm run framework:apply` deploys each copy to its real path; verify hash-checks both.
export const MATERIALIZED_DIR = "platform/materialized";

export const materializedSourceFor = (targetPath) =>
  `${MATERIALIZED_DIR}/${targetPath}`;

export function materializedPaths(manifest) {
  const node = manifest.ownership?.materialized;
  return node && Array.isArray(node.paths) ? node.paths : [];
}

// `role` deliberately does NOT live in platform/framework.json, even though that file is
// otherwise the whole manifest. framework.json is inside the subtree prefix, so a
// `framework:update` would overwrite it — flipping a portal's role from "consumer" back to
// "source" and silently disabling every part of Gate B (both the lock hash-check and
// guard-framework.mjs key off this one field). A portal would look protected and not be.
//
// package.json is `seeded` — written once by app:init, app-owned, never synced — which makes it
// the one place a per-repo setting can survive an update.
//
// Defaults to "source" when undeclared, and callers surface that. Failing *open* is right here:
// this boundary prevents drift, it is not a security control (see docs/OWNERS.md), and a missing
// declaration most likely means someone is running a script outside a real portal — where
// defaulting to "consumer" would produce nothing but false accusations.
export function resolveRole(root) {
  const pkg = readJson(root, "package.json");
  const declared = pkg?.framework?.role;
  if (declared === "source" || declared === "consumer") {
    return { role: declared, declared: true };
  }
  return { role: "source", declared: false };
}

// Deliberately minimal — the manifest only ever needs `**` for "everything under here" and `*`
// for "one path segment". Pulling in a glob library for two constructs would be the wrong trade
// in a script (and a PreToolUse hook, which runs on every Edit/Write) that has to be fast and
// dependency-free.
export function toRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const body = escaped
    .replace(/\*\*/g, " ")
    .replace(/\*/g, "[^/]*")
    .replace(/ /g, ".*");
  return new RegExp(`^${body}$`);
}

function patternsFor(manifest, name) {
  const node = manifest.ownership?.[name];
  if (Array.isArray(node)) return node;
  if (node && Array.isArray(node.paths)) return node.paths;
  return [];
}

// Order matters: FIRST MATCH WINS. This is what lets one specific file be framework-owned while
// its whole containing directory is app-owned (`platform/src/services/auth.ts` used to need this
// before the phase-2 move; the mechanism itself is still load-bearing for any future case).
export function getCategories(manifest) {
  return CATEGORY_ORDER.map((name) => {
    const patterns = patternsFor(manifest, name);
    return { name, patterns, regexes: patterns.map(toRegex), files: [] };
  });
}

export function classify(categories, file) {
  return categories.find((c) => c.regexes.some((r) => r.test(file))) ?? null;
}

// Normalizes a path a caller might hand in as either absolute (a hook's `tool_input.file_path`)
// or already repo-relative (a manifest entry, a `git ls-files` line) to the repo-relative,
// forward-slash form every glob in the manifest is written against.
export function toRepoRelative(root, filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (!path.isAbsolute(filePath)) return normalized;
  return path.relative(root, filePath).split(path.sep).join("/");
}
