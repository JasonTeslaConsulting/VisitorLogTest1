#!/usr/bin/env node
// Generates docs/plan/ROADMAP.md from the unit files in docs/plan/units/ plus
// git facts. Same model as scripts/gen-arch-docs.mjs: a pure function of
// committed state (never live remote refs, so `--check` can't flake in CI),
// regenerate-don't-hand-edit, same conflict recipe.
//
// "Merged" is never stored in a unit file — it's derived from the squash-merge
// commit subject (`[U003] ...`) landing on origin/main. See docs/plan/README.md
// for why. That's also why this is its own script instead of folded into
// gen-arch-docs.mjs: this file's inputs change (git log) even when nothing in
// src/ does, and inventory.md — the most-read generated doc in the repo —
// would otherwise churn on every unit status change.
//
// Run: npm run docs:plan             (writes ROADMAP.md)
//      npm run docs:plan -- --check  (exits non-zero if stale or invalid)
//      npm run plan:next             (prints the next buildable unit, one line)

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const UNITS_DIR = path.join(root, "docs/plan/units");
const APP_MD = path.join(root, "docs/plan/app.md");
const INVENTORY_MD = path.join(root, "docs/architecture/inventory.md");
const OUT = path.join(root, "docs/plan/ROADMAP.md");
const CHECK = process.argv.includes("--check");
const NEXT = process.argv.includes("--next");

const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

function walk(dir, exts) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

const rel = (p) => path.relative(root, p).split(path.sep).join("/");

// --- Minimal YAML-subset frontmatter parser ---
// The unit schema is closed: flat scalars, flat arrays (`[a, b]`), and one
// level of nested keys (`touches:`). That doesn't need a real YAML library,
// same reasoning gen-arch-docs.mjs applies to not using a TS AST.
function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const lines = m[1].split("\n");
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.match(/^(\s*)/)[1].length;
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value === "") {
      const child = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
    } else if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      parent[key] = inner ? inner.split(",").map((s) => s.trim()) : [];
    } else if (value === "null") {
      parent[key] = null;
    } else if (value === "true" || value === "false") {
      parent[key] = value === "true";
    } else if (/^-?\d+$/.test(value)) {
      parent[key] = Number(value);
    } else {
      parent[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return root;
}

function sh(cmd) {
  try {
    return execSync(cmd, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

// Prefer origin/main (what every other developer sees); fall back to local
// main for a solo clone with no remote configured yet (true of this repo
// today — see docs/DECISIONS.md).
const mergeRef = sh("git rev-parse --verify origin/main")
  ? "origin/main"
  : sh("git rev-parse --verify main")
    ? "main"
    : null;

function isMerged(id) {
  if (!mergeRef) return false;
  const out = sh(`git log ${mergeRef} --oneline --grep "^\\[${id}\\]" -1`);
  return Boolean(out);
}

// --- Load units ---
const errors = [];
const unitFiles = walk(UNITS_DIR, [".md"]).filter(
  (f) => !path.basename(f).startsWith("_"),
);

if (unitFiles.length === 0) {
  // No plan exists yet — the un-planned skeleton must clone and CI green,
  // and must not ship a stray "0/0 units" ROADMAP.md.
  if (CHECK) {
    console.log("no docs/plan/units/ — skipping (nothing to check)");
    process.exit(0);
  }
  if (NEXT) {
    console.log("no units — run .claude/skills/plan-app/SKILL.md first");
    process.exit(0);
  }
  console.log("no docs/plan/units/ — nothing to generate");
  process.exit(0);
}

const units = [];
for (const file of unitFiles) {
  const content = read(file) ?? "";
  const fm = parseFrontmatter(content);
  const base = path.basename(file);
  if (!fm) {
    errors.push(`${rel(file)}: no frontmatter found`);
    continue;
  }
  units.push({ file, base, fm });
}

// --- Validate ---
const byId = new Map(units.map((u) => [u.fm.id, u]));

for (const { file, base, fm } of units) {
  const r = rel(file);
  const idNum = String(fm.id ?? "").replace(/^U/i, "");
  const filenameNum = base.match(/^(\d+)-/)?.[1];
  if (
    !fm.id ||
    !filenameNum ||
    idNum.padStart(filenameNum.length, "0") !== filenameNum
  ) {
    errors.push(`${r}: id \`${fm.id}\` doesn't match filename \`${base}\``);
  }
  const dependsOn = Array.isArray(fm.depends_on) ? fm.depends_on : [];
  for (const dep of dependsOn) {
    if (dep && !byId.has(dep)) {
      errors.push(`${r}: depends_on references unknown unit \`${dep}\``);
    }
  }
  if (fm.access === "protected" && !fm.required_role) {
    errors.push(`${r}: access: protected requires required_role`);
  }
  if (typeof fm.estimate_files === "number" && fm.estimate_files > 5) {
    errors.push(
      `${r}: estimate_files (${fm.estimate_files}) exceeds 5 — split this unit (see plan-new-feature's sizing rule)`,
    );
  }
  const touches = fm.touches ?? {};
  const hasSharedUi =
    Array.isArray(touches.shared_ui) && touches.shared_ui.length > 0;
  const hasTokens = touches.tokens === true;
  if (fm.tier !== "foundation" && (hasSharedUi || hasTokens)) {
    errors.push(
      `${r}: tier: ${fm.tier} may not touch shared_ui/tokens — those are foundation-only (owner-gated)`,
    );
  }
}

// Duplicate / already-taken routes
const routeOwners = new Map();
for (const { file, fm } of units) {
  if (!fm.route) continue;
  const existing = routeOwners.get(fm.route);
  if (existing) {
    errors.push(
      `${rel(file)}: route \`${fm.route}\` duplicates ${rel(existing)}`,
    );
  } else {
    routeOwners.set(fm.route, file);
  }
}
{
  const inventory = read(INVENTORY_MD) ?? "";
  for (const { file, fm } of units) {
    if (!fm.route) continue;
    if (inventory.includes(`\`${fm.route}\``)) {
      errors.push(
        `${rel(file)}: route \`${fm.route}\` already exists in docs/architecture/inventory.md`,
      );
    }
  }
}

// Cycle detection over depends_on
{
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map(units.map((u) => [u.fm.id, WHITE]));
  const inCycle = new Set();
  function visit(id, stack) {
    if (color.get(id) === BLACK) return;
    if (color.get(id) === GRAY) {
      inCycle.add(id);
      return;
    }
    color.set(id, GRAY);
    const deps = Array.isArray(byId.get(id)?.fm.depends_on)
      ? byId.get(id).fm.depends_on
      : [];
    for (const dep of deps) {
      if (byId.has(dep)) visit(dep, [...stack, id]);
    }
    color.set(id, BLACK);
  }
  for (const { fm } of units) visit(fm.id, []);
  if (inCycle.size > 0) {
    errors.push(`Cyclic depends_on involving: ${[...inCycle].join(", ")}`);
  }
}

// --- Derive status ---
for (const u of units) {
  u.merged = isMerged(u.fm.id);
  const deps = Array.isArray(u.fm.depends_on) ? u.fm.depends_on : [];
  u.depsMerged = deps.every((d) => byId.get(d)?.merged);
  u.derivedStatus = u.merged
    ? "merged"
    : u.fm.status === "blocked"
      ? "blocked"
      : !u.depsMerged
        ? "waiting-on-deps"
        : u.fm.status;
}

units.sort((a, b) =>
  (a.fm.id ?? "").localeCompare(b.fm.id ?? "", undefined, { numeric: true }),
);

// --- Foundation-first gate (CI-blocking) ---
// Mirrors the loop's own check in .claude/skills/build-app/SKILL.md so a human bypassing the
// loop hits the same rule: a unit/<NNN>-<slug> branch may not open a PR before every id in its
// depends_on is merged to main. Env vars first (a PR's HEAD is detached in CI), local branch name
// as the solo-clone fallback.
if (CHECK) {
  const branch =
    process.env.GITHUB_HEAD_REF ||
    process.env.GITEA_HEAD_REF ||
    sh("git rev-parse --abbrev-ref HEAD") ||
    "";
  const branchUnit = branch.match(/^unit\/(\d+)-/)?.[1];
  if (branchUnit) {
    const unit = units.find(
      (u) => String(u.fm.id ?? "").replace(/^U/i, "") === branchUnit,
    );
    if (unit) {
      const deps = Array.isArray(unit.fm.depends_on) ? unit.fm.depends_on : [];
      const unmergedDeps = deps.filter((d) => !byId.get(d)?.merged);
      if (unmergedDeps.length > 0) {
        errors.push(
          `branch \`${branch}\` is unit ${unit.fm.id}, which depends on ${unmergedDeps.join(", ")} — not yet merged to ${mergeRef ?? "main"}. Foundation units must merge before leaf units that depend on them build on top of them.`,
        );
      }
    }
  }
}

// --- plan:next ---
if (NEXT) {
  if (errors.length > 0) {
    console.error(
      "docs:plan has validation errors — run `npm run docs:plan` for details",
    );
    process.exit(1);
  }
  const next = units.find(
    (u) => !u.merged && u.derivedStatus !== "blocked" && u.depsMerged,
  );
  if (!next) {
    const blocked = units.filter(
      (u) => !u.merged && (u.derivedStatus === "blocked" || !u.depsMerged),
    );
    if (blocked.length > 0) {
      console.log(
        `nothing ready — ${blocked.length} unit(s) blocked or waiting on dependencies`,
      );
    } else {
      console.log("all units merged — nothing left to build");
    }
    process.exit(0);
  }
  console.log(`${next.fm.id} ${rel(next.file)} status=${next.fm.status}`);
  process.exit(0);
}

// --- Render ROADMAP.md ---
const lines = [];
const push = (s = "") => lines.push(s);

push("<!-- GENERATED by `npm run docs:plan` — do not hand-edit. -->");
push(
  "<!-- Two devs regenerating this at once = a one-file conflict.       -->",
);
push(
  "<!-- Resolve with: git checkout --ours docs/plan/ROADMAP.md          -->",
);
push("<!--               && npm run docs:plan                             -->");
push();
push("# Build roadmap (generated)");
push();

const appFm = parseFrontmatter(read(APP_MD) ?? "") ?? {};
if (appFm.app_name) {
  push(`**${appFm.app_name}** — gate policy: \`${appFm.gates ?? "unset"}\``);
  push();
}

const merged = units.filter((u) => u.merged).length;
push("## Progress");
push();
push(
  `${merged} / ${units.length} units merged to ${mergeRef ?? "main (no git history found)"}.`,
);
push();

push("## Build order");
push();
push(
  "| # | Id | Unit | Kind | Route | Status | Merged | Depends on | Branch |",
);
push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
units.forEach((u, i) => {
  const deps =
    Array.isArray(u.fm.depends_on) && u.fm.depends_on.length
      ? u.fm.depends_on.join(", ")
      : "—";
  push(
    `| ${i + 1} | ${u.fm.id} | ${u.fm.title ?? u.fm.slug} | ${u.fm.kind ?? "—"} | ${u.fm.route ? `\`${u.fm.route}\`` : "—"} | ${u.derivedStatus} | ${u.merged ? "✅" : "—"} | ${deps} | ${u.fm.branch ?? "—"} |`,
  );
});
push();

push("## Ready to build now");
push();
const ready = units.filter(
  (u) => !u.merged && u.derivedStatus !== "blocked" && u.depsMerged,
);
if (ready.length === 0) push("(none)");
for (const u of ready)
  push(`- ${u.fm.id} — ${u.fm.title ?? u.fm.slug} (\`${rel(u.file)}\`)`);
push();

push("## Blocked");
push();
const blocked = units.filter(
  (u) => !u.merged && (u.derivedStatus === "blocked" || !u.depsMerged),
);
if (blocked.length === 0) push("(none)");
for (const u of blocked) {
  const reason =
    u.derivedStatus === "blocked"
      ? (u.fm.blocked_reason ?? "blocked")
      : "waiting on dependencies";
  push(`- ${u.fm.id} — ${u.fm.title ?? u.fm.slug} — ${reason}`);
}
push();

push("## Validation");
push();
if (errors.length === 0) {
  push("No errors.");
} else {
  for (const e of errors) push(`- ${e}`);
}
push();

const generated = lines.join("\n") + "\n";

if (CHECK) {
  if (errors.length > 0) {
    console.error(`docs:plan — ${errors.length} schema/dependency error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const existing = read(OUT);
  if (existing !== generated) {
    console.error(
      "docs/plan/ROADMAP.md is stale — run `npm run docs:plan` and commit the result.",
    );
    process.exit(1);
  }
  console.log("docs/plan/ROADMAP.md is up to date");
  process.exit(0);
}

writeFileSync(OUT, generated);
console.log(`Wrote ${rel(OUT)}`);
if (errors.length > 0) {
  console.warn(
    `${errors.length} validation issue(s) — see the Validation section of ${rel(OUT)}`,
  );
}
