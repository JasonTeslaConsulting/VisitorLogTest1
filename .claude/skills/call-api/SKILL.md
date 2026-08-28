#!/usr/bin/env node
// Generates src/integrations/supabase/types.ts from this portal's Supabase project.
//
// WHY THIS IS A SCRIPT AND NOT A ONE-LINE npm COMMAND. The schema list used to be hardcoded in
// package.json, which conflated three different things:
//
//   1. schemas the FRAMEWORK needs (public, _arch, _secure) — dropping one strips its tables from
//      the shared `Database` type and silently untypes all six framework services;
//   2. schemas the skeleton's own database happened to have (_common, _content, _training) — no
//      source file referenced them, and a portal whose database lacks them had the command fail
//      outright, which is docs/GUIDE.md's documented failure cause #3;
//   3. schemas THIS portal adds — which the hardcoded string could not express at all.
//
// So the list is now assembled from two declared sources instead:
//
//   platform/framework.json  requiredSchemas.schemas   framework-owned, always included
//   package.json             supabase.schemas          app-owned, this portal's own
//
// Adding a schema is a one-line edit to package.json by someone who need not know the CLI
// incantation. Removing a framework schema is impossible. See .claude/skills/gen-supabase-types/.
//
// Run: npm run gen-supabase-types
//      npm run gen-supabase-types -- --add-schema _billing   declare a schema, then generate
//      npm run gen-supabase-types -- --dry-run    print the command, generate nothing

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadManifest } from "./framework-lib.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const OUT = "src/integrations/supabase/types.ts";
const PLACEHOLDER = "[SUPABASE-PROJECT-ID]";

const projectIdIndex = args.indexOf("--project-id");
const projectId =
  projectIdIndex !== -1 ? (args[projectIdIndex + 1] ?? null) : null;

const fail = (msg) => {
  console.error(`gen-supabase-types — ${msg}`);
  process.exit(1);
};

// --- the project ref -----------------------------------------------------------------------------
// Passed from package.json's script so `app:init` can keep substituting it there, in the one place
// a developer already looks for it.
if (!projectId) {
  fail(
    "no --project-id was passed. package.json's gen-supabase-types script should read:\n\n" +
      `    node platform/scripts/gen-supabase-types.mjs --project-id <ref>\n`,
  );
}
// The placeholder is checked further down, not here: --dry-run has to stay useful in the template
// and in any portal that hasn't set its ref yet, which is exactly when someone wants to see what
// the command would be.
const placeholderMsg =
  `the project ref is still ${PLACEHOLDER}.\n\n` +
  "  Set it in package.json's gen-supabase-types script. It is the first label of your\n" +
  "  Supabase URL: https://<ref>.supabase.co — the same value in public/config/app.json.\n" +
  "  (`npm run app:init -- --supabase-url ...` fills both in for a new portal.)";

// --- the schema list -----------------------------------------------------------------------------
const manifest = loadManifest(root);
if (!manifest) fail("platform/framework.json not found or not valid JSON.");

const required = manifest.requiredSchemas?.schemas ?? [];
if (required.length === 0) {
  fail(
    "platform/framework.json declares no requiredSchemas.schemas — refusing to generate a\n" +
      "  types file that would be missing the framework's own schemas.",
  );
}

// The framework declares what it needs twice: here as schema names, and in appContracts as
// grep markers checked after the fact by framework:verify. Assert they agree, so a future edit to
// one cannot quietly disagree with the other.
const markers = manifest.appContracts?.[OUT]?.mustContain ?? [];
const unmet = markers
  .map((m) => m.replace(/:$/, ""))
  .filter((s) => !required.includes(s));
if (unmet.length) {
  fail(
    `platform/framework.json disagrees with itself: appContracts requires ${unmet.join(", ")}\n` +
      "  in the generated file, but requiredSchemas.schemas does not include them. Fix the\n" +
      "  manifest — as written, a successful generation would still fail framework:verify.",
  );
}

const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
let appSchemas = pkg.supabase?.schemas ?? [];
if (!Array.isArray(appSchemas)) {
  fail("package.json's supabase.schemas must be an array of schema names.");
}

// --- --add-schema ---------------------------------------------------------------------------------
// So declaring a schema is one command rather than "open package.json and edit this array", which
// is the same reason the list moved out of the script string in the first place.
const addIndex = args.indexOf("--add-schema");
if (addIndex !== -1) {
  const name = args[addIndex + 1];
  if (!name || name.startsWith("--")) {
    fail("--add-schema needs a schema name, e.g. --add-schema _billing");
  }
  // Postgres identifier, not a path or a flag. Catches a mistyped command before it reaches the CLI.
  if (!/^[A-Za-z_][A-Za-z0-9_$]*$/.test(name)) {
    fail(`"${name}" is not a valid Postgres schema name.`);
  }
  if (required.includes(name)) {
    console.log(
      `gen-supabase-types — "${name}" is a framework schema and is always included; ` +
        "nothing to add.",
    );
  } else if (appSchemas.includes(name)) {
    console.log(
      `gen-supabase-types — "${name}" is already declared in package.json; nothing to add.`,
    );
  } else if (dryRun) {
    console.log(
      `gen-supabase-types — dry run: would add "${name}" to package.json's supabase.schemas.`,
    );
    appSchemas = [...appSchemas, name];
  } else {
    appSchemas = [...appSchemas, name];
    pkg.supabase = { ...(pkg.supabase ?? {}), schemas: appSchemas };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(
      `gen-supabase-types — added "${name}" to package.json's supabase.schemas.`,
    );
  }
}

// Framework schemas first, then the app's, deduped. Order is stable so a regeneration produces the
// same command and the same diff.
const schemas = [...new Set([...required, ...appSchemas])];

const cmdArgs = [
  "supabase",
  "gen",
  "types",
  "typescript",
  "--project-id",
  projectId,
  ...schemas.flatMap((s) => ["--schema", s]),
];

if (dryRun) {
  console.log(
    `gen-supabase-types — dry run. Would run:\n\n    npx ${cmdArgs.join(" ")}\n`,
  );
  console.log(`    framework (always): ${required.join(", ")}`);
  console.log(
    `    this portal's own : ${appSchemas.length ? appSchemas.join(", ") : "(none declared in package.json's supabase.schemas)"}`,
  );
  console.log(`\n    -> ${OUT}`);
  if (projectId === PLACEHOLDER) {
    console.log(
      `\n    NOTE: ${placeholderMsg.split("\n")[0]} A real run would refuse.`,
    );
  }
  process.exit(0);
}

if (projectId === PLACEHOLDER) fail(placeholderMsg);

// --- generate ------------------------------------------------------------------------------------
console.log(
  `gen-supabase-types — ${schemas.length} schema(s): ${schemas.join(", ")}`,
);

// Captured rather than shell-redirected. `npx ... > types.ts` truncates the file BEFORE the command
// runs, so any failure — an unauthenticated CLI, a wrong ref, a schema that does not exist — left
// an empty or half-written types.ts behind, breaking the build on top of the original error.
const run = spawnSync("npx", cmdArgs, {
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 64 * 1024 * 1024,
});

if (run.status !== 0) {
  const stderr = (run.stderr ?? "").trim();
  console.error(`\ngen-supabase-types — the Supabase CLI failed:\n`);
  console.error(stderr || "(no output)");

  // Turn the two failures people actually hit into instructions rather than raw CLI output.
  const missing = stderr.match(
    /schema[s]?\s+"?([A-Za-z0-9_]+)"?\s+(?:does not exist|not found)/i,
  );
  if (missing) {
    const name = missing[1];
    const owner = required.includes(name)
      ? "It is a FRAMEWORK schema, so the database is missing something the framework needs —\n" +
        "  this portal's Supabase project has not been set up from the baseline schema yet."
      : `Remove "${name}" from package.json's supabase.schemas — this database does not have it.`;
    console.error(
      `\n  Schema "${name}" does not exist in this database.\n  ${owner}`,
    );
  } else if (/not logged in|access token|unauthorized|401/i.test(stderr)) {
    console.error(
      "\n  The CLI is not authenticated. Run `supabase login`, or set SUPABASE_ACCESS_TOKEN.",
    );
  }
  console.error(`\n  ${OUT} was left untouched.`);
  process.exit(1);
}

const output = run.stdout ?? "";
if (!output.trim()) {
  fail(`the CLI succeeded but produced no output. ${OUT} was left untouched.`);
}

// Post-check before writing: the generated file must satisfy the same contract framework:verify
// enforces. Failing here means the developer sees it now, with the command that caused it still on
// screen, instead of at the next verify run.
const absent = markers.filter((m) => !output.includes(m));
if (absent.length) {
  fail(
    `the generated types are missing ${absent.join(", ")}, which the framework's services\n` +
      `  require (platform/framework.json appContracts). ${OUT} was left untouched.`,
  );
}

mkdirSync(path.join(root, path.dirname(OUT)), { recursive: true });
writeFileSync(path.join(root, OUT), output);

console.log(
  `gen-supabase-types — wrote ${OUT} (${output.split("\n").length} lines).`,
);
