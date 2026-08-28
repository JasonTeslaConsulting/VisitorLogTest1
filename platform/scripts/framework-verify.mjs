#!/usr/bin/env node
// Checks a repo against the framework/app ownership boundary in platform/framework.json.
//
// WHY: a portal must be able to receive framework updates forever, and that only holds if
// every file has exactly one owner. The failure mode this catches is not a dramatic one —
// it's a new file nobody classified, or a framework file quietly edited in an app repo.
// Both are invisible until a `framework:update` merges badly months later.
//
// Two independent things get checked, and only one depends on `role`:
//   - Classification (every tracked file has exactly one owner) — always checked, either role.
//   - Content hashes against platform/framework.lock — only in role: "consumer". In role:
//     "source" (this repo, mid-development) framework files are SUPPOSED to keep changing;
//     `npm run framework:lock` is the deliberate, separate step that re-pins them before a
//     release, not something this command should be nagging about on every run.
//
// Run: npm run framework:verify
//      npm run framework:verify -- --check                 exit 1 on any problem (CI)
//      npm run framework:verify -- --list framework        print one category's files
//
// `--list framework` is also phase 2's move-list: every path it prints must end up under
// platform/, and nothing else may.

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  CATEGORY_ORDER,
  HASH_CHECKED_CATEGORIES,
  loadManifest,
  getCategories,
  classify,
  resolveRole,
  materializedPaths,
  materializedSourceFor,
  hashContent,
  normalizeEol,
} from "./framework-lib.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes("--check");
const listCategory = args[args.indexOf("--list") + 1] ?? null;
const wantsList = args.includes("--list");

const read = (p) => {
  try {
    return readFileSync(path.join(root, p), "utf8");
  } catch {
    return null;
  }
};

const manifest = loadManifest(root);
if (!manifest) {
  console.error(
    "framework:verify — platform/framework.json not found or not valid JSON. This repo has no " +
      "declared framework boundary; nothing to check.",
  );
  process.exit(strict ? 1 : 0);
}

const categories = getCategories(manifest);

// ---------------------------------------------------------------------------
// Tracked files only. An untracked scratch file is not a boundary violation —
// it just isn't in the repo yet.
// ---------------------------------------------------------------------------
let tracked;
try {
  tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  console.error(
    "framework:verify — `git ls-files` failed; is this a git repo?",
  );
  process.exit(1);
}

const unclassified = [];
for (const file of tracked) {
  const category = classify(categories, file);
  if (category) category.files.push(file);
  else unclassified.push(file);
}

// --list short-circuits: it's a query, not a check.
if (wantsList) {
  const found = categories.find((c) => c.name === listCategory);
  if (!found) {
    console.error(
      `framework:verify — unknown category "${listCategory}". ` +
        `Expected one of: ${CATEGORY_ORDER.join(", ")}`,
    );
    process.exit(1);
  }
  for (const f of found.files) console.log(f);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Declared-but-absent. A literal path in the manifest that doesn't exist is
// either a file a later phase still has to create, or a stale entry. Both are
// worth seeing; neither is a failure on its own.
// ---------------------------------------------------------------------------
const absent = [];
for (const { name, patterns } of categories) {
  if (name === "ignored") continue;
  for (const p of patterns) {
    if (p.includes("*")) continue;
    if (!existsSync(path.join(root, p)))
      absent.push(`${p}  (declared ${name})`);
  }
}

// ---------------------------------------------------------------------------
// Required dependencies. An app owns package.json, so this never edits it —
// it prints the install line and lets a human decide.
// ---------------------------------------------------------------------------
const depProblems = [];
const pkgRaw = read("package.json");
if (pkgRaw) {
  const pkg = JSON.parse(pkgRaw);
  for (const field of ["dependencies", "devDependencies"]) {
    const required = manifest.requiredDeps?.[field] ?? {};
    const actual = pkg[field] ?? {};
    const missing = [];
    for (const [dep, range] of Object.entries(required)) {
      if (!actual[dep]) missing.push(`${dep}@${range}`);
      else if (actual[dep] !== range) {
        depProblems.push(
          `${field}: ${dep} is ${actual[dep]}, framework declares ${range} (informational)`,
        );
      }
    }
    if (missing.length) {
      const flag = field === "devDependencies" ? " -D" : "";
      depProblems.push(
        `${field}: ${missing.length} framework dependency/ies missing — ` +
          `npm i${flag} ${missing.join(" ")}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// App contracts — files the APP must provide because the FRAMEWORK imports them.
// The inverse of the usual direction, so each entry is checked strictly: the file
// has to exist AND still contain the markers the framework's code relies on.
//
// The live case is the generated Supabase types. A portal that regenerates them
// with a narrower `--schema` list drops `_arch`/`_secure`, and every framework
// service silently loses its typing — the kind of breakage that surfaces as a
// runtime error weeks later. Catching it here makes it a one-line message.
// ---------------------------------------------------------------------------
const contractProblems = [];
for (const [file, spec] of Object.entries(manifest.appContracts ?? {})) {
  if (file.startsWith("$")) continue;
  const content = read(file);
  if (content === null) {
    contractProblems.push(
      `MISSING app contract ${file} — the framework imports it ` +
        `(${(spec.requiredBy ?? []).length} file(s)). Create it with: ${spec.regenerateWith ?? "?"}`,
    );
    continue;
  }
  const absentMarkers = (spec.mustContain ?? []).filter(
    (m) => !content.includes(m),
  );
  if (absentMarkers.length) {
    contractProblems.push(
      `${file} is missing ${absentMarkers.join(", ")} — the framework's services query ` +
        `those schemas, so they must be included. Regenerate with: ${spec.regenerateWith ?? "?"}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Content hashes — ONLY in role: "consumer". This is Gate B: whether a portal's vendored
// platform/ (plus the materialized files outside it) still matches what it was pinned to.
//
// Deliberately skipped in role: "source" — that's this repo. Framework files here are
// *supposed* to keep changing; hash-checking every run would just be permanent, meaningless
// noise. `npm run framework:lock` is the separate, deliberate step a maintainer runs before
// tagging a release, and that command's own summary is where "did I forget to re-lock?" gets
// answered — not this one.
// ---------------------------------------------------------------------------
const lockProblems = [];
const { role, declared: roleDeclared } = resolveRole(root);
if (role === "consumer") {
  const lockRaw = read("platform/framework.lock");
  if (!lockRaw) {
    lockProblems.push(
      'package.json declares framework.role "consumer" but platform/framework.lock is missing ' +
        "— the vendored framework copy has nothing to be verified against. This should have " +
        "been pinned when the framework was last applied.",
    );
  } else {
    let lock;
    try {
      lock = JSON.parse(lockRaw);
    } catch (e) {
      lockProblems.push(
        `platform/framework.lock is not valid JSON: ${e.message}`,
      );
      lock = null;
    }
    if (lock) {
      const lockedFiles = lock.files ?? {};

      for (const [file, expectedHash] of Object.entries(lockedFiles)) {
        const raw = read(file);
        if (raw === null) {
          lockProblems.push(
            `framework file deleted: ${file} — restore it or run framework:reset`,
          );
          continue;
        }
        const actualHash = hashContent(raw);
        if (actualHash !== expectedHash) {
          lockProblems.push(
            `framework file modified: ${file} — this is read-only downstream. Discard the ` +
              `edit (git checkout -- "${file}"), or if the change is genuinely needed, request ` +
              `it upstream in the framework repo instead of editing the local copy.`,
          );
        }
      }

      // platform/framework.lock itself is classified "framework" (it's under platform/**) but is
      // never a key in its own file list — see framework-lock.mjs's SELF constant — so it's
      // excluded here too, or it would always show up as "unexpected new".
      const lockedSet = new Set(Object.keys(lockedFiles));
      const unexpectedNew = [];
      for (const { name, files } of categories) {
        if (!HASH_CHECKED_CATEGORIES.has(name)) continue;
        for (const f of files) {
          if (f !== "platform/framework.lock" && !lockedSet.has(f))
            unexpectedNew.push(f);
        }
      }
      if (unexpectedNew.length) {
        lockProblems.push(
          `${unexpectedNew.length} framework-owned file(s) exist but aren't in ` +
            "platform/framework.lock (added locally, not part of the pinned framework version):",
        );
        for (const f of unexpectedNew) lockProblems.push(`    ${f}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Materialized drift — checked in EITHER role, because it's a different failure from a hash
// mismatch and it can happen here in the source repo too.
//
// Each `materialized` target (vite.config.ts, the tsconfigs, src/main.tsx, …) has a canonical
// copy at platform/materialized/<same path>, which is what a subtree update actually delivers.
// If the two diverge, `npm run framework:apply` hasn't been run since the last change — meaning
// either an update landed a new canonical copy that was never deployed, or someone edited the
// deployed file directly. Both leave the repo in a state where the *next* framework:lock would
// pin whichever version happens to be on disk.
// ---------------------------------------------------------------------------
const materializedProblems = [];
for (const target of materializedPaths(manifest)) {
  const source = materializedSourceFor(target);
  const sourceContent = read(source);
  const targetContent = read(target);
  if (sourceContent === null) {
    materializedProblems.push(
      `${target} is declared materialized but has no canonical copy at ${source} — a framework ` +
        "update cannot deliver it. Create the copy (npm run framework:apply -- --adopt).",
    );
    continue;
  }
  if (targetContent === null) {
    materializedProblems.push(
      `${target} is missing — run: npm run framework:apply`,
    );
    continue;
  }
  if (normalizeEol(sourceContent) !== normalizeEol(targetContent)) {
    materializedProblems.push(
      `${target} differs from its canonical copy ${source} — run \`npm run framework:apply\` to ` +
        "deploy the framework's version, or if you changed the deployed file directly, move that " +
        "change into the canonical copy instead (it is what updates actually carry).",
    );
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log(
  `framework:verify — framework v${manifest.version ?? "?"}, role: ${role}` +
    (roleDeclared
      ? ""
      : " (defaulted — package.json declares no framework.role)") +
    ` (${tracked.length} tracked files)\n`,
);

for (const { name, files } of categories) {
  console.log(`  ${String(files.length).padStart(4)}  ${name}`);
}
console.log("");

const problems = [];
if (unclassified.length) {
  problems.push(
    `${unclassified.length} file(s) have no declared owner. Add each to a category in ` +
      `platform/framework.json, or to "ignored" if it belongs to nobody:`,
  );
  for (const f of unclassified) problems.push(`    ${f}`);
}
for (const d of depProblems) problems.push(d);
for (const c of contractProblems) problems.push(c);
for (const l of lockProblems) problems.push(l);
for (const m of materializedProblems) problems.push(m);

if (absent.length) {
  console.log("  Declared in the manifest but not present yet:");
  for (const a of absent) console.log(`    ${a}`);
  console.log("");
}

if (problems.length) {
  console.warn(
    `framework:verify — ${problems.length} line(s) needing attention:\n`,
  );
  for (const p of problems) console.warn(`  ${p}`);
  console.warn("");
  if (strict) {
    console.error("framework:verify — failing because --check was passed.");
    process.exit(1);
  }
  console.warn("framework:verify — reporting only (pass --check to fail).");
  process.exit(0);
}

console.log(
  "framework:verify — every tracked file has exactly one declared owner.",
);
if (role === "consumer") {
  console.log(
    "framework:verify — vendored platform/ matches platform/framework.lock.",
  );
}
process.exit(0);
