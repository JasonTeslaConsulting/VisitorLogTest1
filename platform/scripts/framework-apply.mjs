#!/usr/bin/env node
// Deploys every `materialized` file from its canonical copy inside the subtree prefix
// (platform/materialized/<path>) to its real location (<path>).
//
// WHY MATERIALIZED FILES NEED THIS AT ALL: a handful of framework files must sit at a path the
// toolchain hardcodes — vite.config.ts, the three tsconfigs, components.json, src/main.tsx,
// src/vite-env.d.ts, the dotfiles. They cannot live under platform/ at their real location, so
// `git subtree split --prefix=platform` cannot carry them, so a framework update could never
// deliver a new one. Keeping a canonical copy *inside* the prefix and deploying it here is what
// closes that hole. `framework:verify` checks the two stay identical in either role.
//
// Run: npm run framework:apply
//      npm run framework:apply -- --check    report what would change, write nothing (exit 1 if any)
//      npm run framework:apply -- --adopt    seed missing canonical copies FROM the deployed files
//
// `--adopt` is the one-time bootstrap direction (deployed -> canonical), used when introducing
// this mechanism to a repo whose materialized files already exist. Normal operation is the other
// way round.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  loadManifest,
  materializedPaths,
  materializedSourceFor,
  normalizeEol,
  resolveRole,
} from "./framework-lib.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const adopt = args.includes("--adopt");

const manifest = loadManifest(root);
if (!manifest) {
  console.error(
    "framework:apply — platform/framework.json not found or not valid JSON.",
  );
  process.exit(1);
}

const read = (p) => {
  try {
    return readFileSync(path.join(root, p), "utf8");
  } catch {
    return null;
  }
};

const write = (p, content) => {
  const abs = path.join(root, p);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content);
};

const { role } = resolveRole(root);

const targets = materializedPaths(manifest);
if (targets.length === 0) {
  console.log(
    "framework:apply — no materialized paths declared; nothing to do.",
  );
  process.exit(0);
}

const deployed = [];
const adopted = [];
const wouldChange = [];
const problems = [];

for (const target of targets) {
  const source = materializedSourceFor(target);
  const sourceContent = read(source);
  const targetContent = read(target);

  if (sourceContent === null) {
    if (adopt) {
      if (targetContent === null) {
        problems.push(
          `${target}: neither the canonical copy (${source}) nor the deployed file exists — ` +
            "nothing to adopt from.",
        );
        continue;
      }
      if (!checkOnly) write(source, targetContent);
      adopted.push(`${target}  ->  ${source}`);
      continue;
    }
    problems.push(
      `${source} is missing, so ${target} cannot be deployed. If this repo predates the ` +
        "canonical copies, seed them once with: npm run framework:apply -- --adopt",
    );
    continue;
  }

  // Compared eol-agnostically for the same reason the lock hashes are — see normalizeEol().
  // Without this, a CRLF working tree would make apply rewrite every file on every run.
  if (
    targetContent !== null &&
    normalizeEol(targetContent) === normalizeEol(sourceContent)
  )
    continue;

  // --adopt means "the deployed file is authoritative", so when the two differ it must copy
  // deployed -> canonical, NOT the reverse. Without this branch, running --adopt after editing a
  // materialized file in place silently overwrote the edit with the older canonical copy — the
  // exact mistake it is meant to fix, and how DESIGN.md is realistically edited: a maintainer
  // opens the file they read, not the copy inside platform/.
  //
  // Guarded to role "source": in a portal the deployed copy is never authoritative — promoting it
  // would launder a local fork into the framework's own canonical content.
  if (adopt && targetContent !== null) {
    if (role !== "source") {
      problems.push(
        `${target}: --adopt promotes the deployed file over the canonical copy, which is only ` +
          `valid in the framework's own repo. package.json's framework.role is "${role}" — the ` +
          "deployed copy here is not authoritative. Use `npm run framework:apply` (no --adopt) to " +
          "take the framework's version, or upstream the change.",
      );
      continue;
    }
    if (checkOnly) {
      wouldChange.push(`${source}   (adopting from ${target})`);
      continue;
    }
    write(source, targetContent);
    adopted.push(`${target}  ->  ${source}`);
    continue;
  }

  if (checkOnly) {
    wouldChange.push(target);
    continue;
  }
  write(target, sourceContent);
  deployed.push(target);
}

for (const line of adopted) console.log(`  adopted   ${line}`);
for (const line of deployed) console.log(`  deployed  ${line}`);
for (const line of wouldChange) console.log(`  would deploy  ${line}`);

if (problems.length) {
  console.error(`\nframework:apply — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

if (checkOnly) {
  if (wouldChange.length) {
    console.error(
      `\nframework:apply --check — ${wouldChange.length} materialized file(s) are out of date. ` +
        "Run: npm run framework:apply",
    );
    process.exit(1);
  }
  console.log(
    "framework:apply --check — every materialized file matches its canonical copy.",
  );
  process.exit(0);
}

const changed = deployed.length + adopted.length;
console.log(
  changed === 0
    ? `framework:apply — all ${targets.length} materialized file(s) already up to date.`
    : `framework:apply — ${changed} file(s) written (${targets.length} declared).`,
);
if (adopted.length) {
  console.log(
    "framework:apply — canonical copies were seeded from the deployed files. Review the diff, " +
      "then run `npm run framework:lock` so they're pinned.",
  );
}
