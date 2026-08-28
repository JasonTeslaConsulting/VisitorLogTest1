#!/usr/bin/env node
// Bootstraps a NEW PORTAL from this template. Run once, immediately after cloning.
//
// Replaces the old ritual — copy the folder, rename it, remember to re-init git, remember to
// change the config — with something that can't be half-done. The step that used to be forgotten
// most often is flipping the repo to a consumer of the framework: until `framework.role` is
// "consumer", nothing about the framework boundary is enforced (see platform/framework.json), so a
// portal would happily edit framework files and only discover the problem at its first
// `framework:update`.
//
// Run: npm run app:init -- --name "Acme Portal" --company "Acme Corp" --origin <your-repo-url>
//
//      --origin <url>           this portal's own git remote (see "origin" below)
//      --supabase-url <url>     this portal's Supabase project URL. For a hosted project
//                               (https://<ref>.supabase.co) the project ref is also substituted
//                               into package.json's gen-supabase-types --project-id, so the two
//                               cannot disagree and there is no second flag to remember.
//      --supabase-key <key>     its publishable (anon) key
//      --schemas <a,b>          this portal's OWN Postgres schemas, beyond the framework's
//                               (public, _arch, _secure — platform/framework.json's
//                               requiredSchemas). Comma- or space-separated. Omit it and the list
//                               is seeded empty, with a step printed telling you how to add them
//                               later; nothing here has to be decided up front.
//      --reset-history          discard .git and start a fresh history (see the warning below)
//      --dry-run                print what would change, write nothing
//
// If the Supabase values are omitted they are BLANKED rather than left as the template's. That is
// deliberate: public/config/app.json is tracked — it has to be, since appConfig fetches it at
// startup — so without this a new portal would silently read and write the SKELETON's database.
//
// ORIGIN. A clone inherits `origin` pointing at the TEMPLATE, so the dangerous default is that a
// reflexive `git push -u origin main` sends a client's portal into the template repo. This script
// therefore always deals with origin: repointed when --origin is given, REMOVED otherwise. A portal
// with no origin is a nuisance you notice immediately; a portal quietly pushing to the template is
// an incident you notice much later.
//
// --RESET-HISTORY — WHO SHOULD USE IT, AND WHEN.
//   Who:  the framework maintainer, or a developer who has confirmed the framework repo exists and
//         platform/framework.json's subtree.remote is set. Not a default step.
//   When: only when the portal genuinely must not carry the template's history — e.g. the portal
//         repo is shared with a client who shouldn't see framework development.
//   What happens: it is irreversible, and it destroys the git-subtree merge base for EVERY
//         framework prefix. That base lives in git history and is the only thing that lets
//         `subtree pull` know what "last synced" means, so afterwards `framework:update` cannot
//         pull until `framework:link` has re-established it. And `framework:link` refuses while
//         subtree.remote is null — so passing this flag before the framework repo exists strands
//         the portal with no way to receive updates. Keeping the history costs you nothing except
//         a longer `git log`, and preserves the base for free.
//
// What it deliberately does NOT do:
//   - set platform/framework.json's subtree.remote — that file is framework-owned and read-only
//     once role is "consumer", and the value isn't per-portal anyway: every portal pulls from the
//     same framework repo, so it belongs upstream, set once by the maintainer before publishing.
//   - rewrite git history unless --reset-history is passed explicitly.
//   - push. Choosing when a portal first leaves the machine is the developer's call, not a
//     bootstrap side effect.

import {
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { resolveSubtree, unlinkedPrefixes } from "./framework-remote.mjs";

const root = process.cwd();
const args = process.argv.slice(2);

// Joins every token up to the next --flag, rather than taking only the next one. Portal and
// company names contain spaces, and whether the quotes around them survive `npm run ... --` down
// to process.argv depends on the shell — so "Acme Health Portal" can arrive as one argv entry or
// as three. Joining handles both instead of silently truncating to "Acme".
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  const parts = [];
  for (let j = i + 1; j < args.length && !args[j].startsWith("--"); j++)
    parts.push(args[j]);
  return parts.length ? parts.join(" ") : null;
};
const has = (name) => args.includes(`--${name}`);

const portalName = flag("name");
const companyName = flag("company");
const supabaseUrl = flag("supabase-url");
const supabaseKey = flag("supabase-key");
const originUrl = flag("origin");
// This portal's own Postgres schemas, beyond the framework's (platform/framework.json's
// requiredSchemas). Split on both commas and whitespace because flag() joins every token up to the
// next --flag, so `--schemas a,b` and `--schemas a b` both arrive as one string.
const schemasRaw = flag("schemas");
const appSchemas = schemasRaw
  ? [...new Set(schemasRaw.split(/[\s,]+/).filter(Boolean))]
  : null;
const resetHistory = has("reset-history");
const dryRun = has("dry-run");

// Read-only, and needed before the dry-run summary so it can report what origin would become.
const readOrigin = () => {
  try {
    return execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null; // no origin configured — a fresh `git init`, or a clone that never had one
  }
};

if (!portalName || !companyName) {
  console.error(
    'app:init — --name and --company are required.\n\n    npm run app:init -- --name "Acme Portal" --company "Acme Corp"\n',
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
const planned = [];
const write = (p, content, note) => {
  planned.push(note ?? p);
  if (!dryRun) writeFileSync(path.join(root, p), content);
};

// Refuse on a dirty tree: this rewrites several tracked files, and mixing that with in-flight
// edits makes "what did app:init change?" unanswerable from the diff.
if (!dryRun) {
  // NOT .trim()'d: porcelain lines are `XY <path>`, and for an unstaged edit X is a space, so
  // trimming the whole blob eats the first line's leading column and shifts every subsequent
  // slice(3) into the filename. Trim per line instead.
  const status = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  }).replace(/\n+$/, "");
  // package-lock.json is tolerated, and only it. `npm install` rewrites the lockfile — npm
  // versions differ in the metadata they record — so anyone who installs before running this
  // (which the docs used to tell them to do) arrives with exactly that one file dirty and gets
  // refused on the documented happy path. It is also `seeded`, so it is the portal's own file and
  // nothing this script writes depends on it. Every other dirty path still refuses, because the
  // guard's real job is keeping "what did app:init change?" answerable from the diff.
  const blocking = status
    .split("\n")
    .filter(Boolean)
    .filter((line) => line.slice(3).trim() !== "package-lock.json");
  if (blocking.length) {
    console.error("app:init — commit or stash your changes first:\n");
    console.error(blocking.join("\n"));
    console.error(
      "\n(package-lock.json alone would have been fine — it is yours, and `npm install` rewrites it.)",
    );
    process.exit(1);
  }
}

const slug = portalName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

// --- package.json: name + the role flip that arms the whole boundary -------------------------
const pkgRaw = read("package.json");
if (!pkgRaw) {
  console.error("app:init — package.json not found; is this the portal root?");
  process.exit(1);
}
const pkg = JSON.parse(pkgRaw);
pkg.name = slug;
pkg.framework = { ...(pkg.framework ?? {}), role: "consumer" };

// gen-supabase-types hardcodes `--project-id`, so it is the second place a portal would otherwise
// inherit the SKELETON's database — same hole the blanked credentials below close, and easier to
// miss because it is buried in a scripts entry rather than a config file.
//
// No extra flag: a hosted project's URL is https://<ref>.supabase.co, so the ref IS the first
// hostname label and --supabase-url already carries it. Deriving it also guarantees the two can't
// disagree, which hand-editing both would not.
// The app-owned half of the gen-supabase-types schema list (the framework's half is
// platform/framework.json's requiredSchemas). Seeded empty so the place to add this portal's own
// schemas is visible from day one rather than something you discover only when types come back
// missing a table. See .claude/skills/gen-supabase-types/SKILL.md.
if (appSchemas) {
  pkg.supabase = { ...(pkg.supabase ?? {}), schemas: appSchemas };
} else if (!pkg.supabase || !Array.isArray(pkg.supabase.schemas)) {
  pkg.supabase = { ...(pkg.supabase ?? {}), schemas: [] };
}

const PROJECT_ID_PLACEHOLDER = "[SUPABASE-PROJECT-ID]";
const projectId = supabaseUrl?.match(
  /^https:\/\/([a-z0-9-]+)\.supabase\.(?:co|in)$/i,
)?.[1];
let genTypesNote = "";
const genTypes = pkg.scripts?.["gen-supabase-types"];
if (genTypes) {
  if (projectId) {
    pkg.scripts["gen-supabase-types"] = genTypes.replaceAll(
      PROJECT_ID_PLACEHOLDER,
      projectId,
    );
    genTypesNote = `, gen-supabase-types --project-id ${projectId}`;
  } else {
    // Either no URL was given, or it isn't a hosted supabase.co URL (self-hosted, custom domain —
    // where `gen types` needs --db-url instead of --project-id anyway). Reset to the placeholder
    // rather than leaving whatever this template happened to ship with.
    const reset = genTypes.replace(
      /--project-id\s+\S+/,
      `--project-id ${PROJECT_ID_PLACEHOLDER}`,
    );
    if (reset !== genTypes) {
      pkg.scripts["gen-supabase-types"] = reset;
      genTypesNote = ", gen-supabase-types --project-id RESET to placeholder";
    }
  }
}

write(
  "package.json",
  JSON.stringify(pkg, null, 2) + "\n",
  `package.json (name: ${slug}, framework.role: consumer${genTypesNote}` +
    (appSchemas ? `, supabase.schemas: ${appSchemas.join(", ")}` : "") +
    ")",
);

// --- public/config/app.json: portal identity, and NOT the skeleton's database ------------------
const cfgPath = "public/config/app.json";
const cfgRaw = read(cfgPath);
if (cfgRaw) {
  const cfg = JSON.parse(cfgRaw);
  cfg.app = { ...(cfg.app ?? {}), companyName, portalName };
  cfg.supabase = {
    ...(cfg.supabase ?? {}),
    supabaseUrl: supabaseUrl ?? "",
    supabasePublishableKey: supabaseKey ?? "",
  };
  write(
    cfgPath,
    JSON.stringify(cfg, null, 2) + "\n",
    `${cfgPath} (portalName, companyName${supabaseUrl ? ", supabase" : ", supabase BLANKED"})`,
  );
} else {
  planned.push(
    `${cfgPath} — MISSING, skipped (the app cannot boot without it)`,
  );
}

// --- docs/DECISIONS.md: a portal's log is its own ----------------------------------------------
// It is `seeded`, so it ships with the framework's ~45 entries about framework internals. Those are
// noise in a portal and would bury the portal's first real decision.
write(
  "docs/DECISIONS.md",
  [
    "# Policy decisions",
    "",
    `Append-only. One line per change to \`CLAUDE.md\`, \`.claude/rules/*\`, or \`.claude/skills/*\`.`,
    "Newest at the bottom. Cite the PR — a squashed diff of a markdown file doesn't say *why*.",
    "",
    `- ${new Date().toISOString().slice(0, 10)} — ${portalName} initialised from the portal template`,
    "  via `npm run app:init`. The framework's own decision history lives in the framework repo, not",
    "  here; this log is for decisions made *by this portal*. See `platform/framework.json` for what",
    "  this portal owns versus what the framework owns, and `CLAUDE.md`'s “extend, never edit”",
    "  section before changing anything under `platform/`.",
    "",
  ].join("\n"),
  "docs/DECISIONS.md (reset to a fresh portal log)",
);

// --- docs/wip/: the template's in-flight claims are not this portal's --------------------------
const wipDir = path.join(root, "docs/wip");
if (existsSync(wipDir)) {
  const stale = readdirSync(wipDir).filter(
    (f) => f.endsWith(".md") && !["README.md", "_TEMPLATE.md"].includes(f),
  );
  for (const f of stale) {
    planned.push(
      `docs/wip/${f} (removed — template's claim, not this portal's)`,
    );
    if (!dryRun) rmSync(path.join(wipDir, f));
  }
}

// --- origin, PREDICTED here for --dry-run; actually changed further down ----------------------
// Only on a dry run: a real run reports what it actually did, at the point it does it, and printing
// a prediction as well would state the same fact twice.
if (dryRun) {
  const existing = readOrigin();
  if (originUrl) {
    planned.push(
      `git remote origin -> ${originUrl}` +
        (existing ? `   (was ${existing})` : "   (added)"),
    );
  } else if (existing) {
    planned.push(
      `git remote origin REMOVED (was ${existing}) — pass --origin <url> to set this portal's own`,
    );
  }
}

// ---------------------------------------------------------------------------------------------
if (dryRun) {
  console.log("app:init — dry run. Would change:\n");
  for (const p of planned) console.log(`    ${p}`);
  console.log(
    "\n(and run framework:apply, then print the remaining manual steps)",
  );
  process.exit(0);
}

for (const p of planned) console.log(`  ${p}`);

// --- redeploy materialized files ---------------------------------------------------------------
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const applied = spawnSync(npm, ["run", "framework:apply"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (applied.status !== 0) {
  console.error(
    "\napp:init — framework:apply failed above; fix it before continuing.",
  );
  process.exit(1);
}

// --- optional: fresh history -------------------------------------------------------------------
if (resetHistory) {
  console.log("\napp:init — discarding the template's git history");
  rmSync(path.join(root, ".git"), { recursive: true, force: true });
  // -b main explicitly: a plain `git init` honours the machine's init.defaultBranch, which is
  // still `master` on plenty of setups. That silently contradicts the `git push -u origin main`
  // this script prints, CONTRIBUTING.md, and CI's `--branch main` checks.
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync(
    "git",
    ["commit", "-q", "-m", `Initial commit — ${portalName}`],
    { cwd: root },
  );
  console.log("app:init — fresh history created with one initial commit");
  console.log(
    "app:init — NOTE: that discarded the git-subtree base for every framework prefix, so\n" +
      "           `npm run framework:update` cannot pull until `npm run framework:link` runs.",
  );
}

// --- origin ------------------------------------------------------------------------------------
// Runs AFTER the optional history reset, which recreates .git with no remotes at all.
{
  const existing = readOrigin();
  if (originUrl) {
    execFileSync(
      "git",
      ["remote", existing ? "set-url" : "add", "origin", originUrl],
      { cwd: root },
    );
    console.log(`  git remote origin -> ${originUrl}`);
  } else if (existing) {
    execFileSync("git", ["remote", "remove", "origin"], { cwd: root });
    console.log(
      `  git remote origin removed (was ${existing} — the template, not this portal)`,
    );
  }
}

const manifest = JSON.parse(read("platform/framework.json") ?? "{}");
const remote = manifest?.subtree?.remote ?? null;

// Whether framework:link is actually needed, rather than assuming it always is. A portal cloned
// from a template that has already been linked INHERITS the merge base in its history and never
// needs this step — the same check framework:update and framework:link themselves use, so the
// three can't disagree.
const unlinked = unlinkedPrefixes(resolveSubtree(manifest).prefixes);

console.log(`\napp:init — ${portalName} is initialised. Remaining steps:\n`);
let step = 1;
if (!originUrl) {
  console.log(`  ${step++}. Point it at your own repository:`);
  console.log("       git remote add origin <your-portal-repo>");
}
// Listed explicitly, and before the push. This script writes several tracked files (package.json,
// public/config/app.json, docs/DECISIONS.md, the deleted wip claims, the redeployed materialized
// copies) and deliberately does NOT commit them — only --reset-history commits, because it has to.
// So "push" was previously the first step, with nothing committed to push.
console.log(`  ${step++}. Commit what app:init changed:`);
console.log(`       git add -A && git commit -m "Initialise App"`);
console.log(`  ${step++}. Push it:  git push -u origin main`);
if (unlinked.length) {
  console.log(
    `  ${step++}. Link the framework so updates can be pulled (one time, ` +
      `${unlinked.length} prefix(es)):`,
  );
  console.log(
    remote
      ? "       npm run framework:link"
      : "       npm run framework:link   — will refuse until the framework maintainer sets\n" +
          "                                  subtree.remote in the framework repo and republishes",
  );
}
if (!supabaseUrl) {
  console.log(
    `  ${step++}. Fill in this portal's Supabase project (BLANKED, so the app will not boot yet):`,
  );
  console.log(
    `       public/config/app.json  ->  supabaseUrl, supabasePublishableKey`,
  );
}
// Only ask for a hand-edit when the placeholder actually survived — with a hosted --supabase-url it
// was already substituted, and printing the step anyway would send someone to edit a correct file.
if (genTypesNote.includes("placeholder") || (!projectId && genTypes)) {
  console.log(
    `  ${step++}. Set the Supabase project ref in package.json (still a placeholder):`,
  );
  console.log(
    `       scripts.gen-supabase-types  ->  --project-id ${PROJECT_ID_PLACEHOLDER}` +
      (supabaseUrl
        ? "\n       (couldn't derive it — --supabase-url isn't a hosted https://<ref>.supabase.co URL)"
        : ""),
  );
}
// Only when --schemas wasn't passed. Printing it after the flag already set them would send someone
// to change a list that is already right — and the whole point of the flag is to skip this step.
if (!appSchemas) {
  console.log(
    `  ${step++}. If this portal has Postgres schemas of its own beyond public/_arch/_secure,`,
  );
  console.log(
    `       declare them — otherwise their tables won't appear in the generated types:`,
  );
  console.log("       npm run gen-supabase-types -- --add-schema <name>");
  console.log(
    '       (or just tell Claude "add the <name> schema" — see' +
      " .claude/skills/gen-supabase-types/)",
  );
}
console.log(
  `  ${step++}. Generate types from your database:  npm run gen-supabase-types`,
);
// The CLI needs an access token, and this is the most common reason that step fails —
// docs/PREFLIGHT.md lists it as a prerequisite and docs/GUIDE.md names it as failure cause #2, but
// neither is in front of you at this moment.
console.log(
  "       Needs the Supabase CLI authenticated first: `supabase login`,",
);
console.log("       or SUPABASE_ACCESS_TOKEN set in the environment.");
console.log(`  ${step++}. Update docs/OWNERS.md with this portal's team.`);
console.log(
  "\n  Steps after the push change tracked files too — the generated" +
    " src/integrations/supabase/types.ts\n  especially. Commit those as you go.",
);
console.log(
  "\n  Then: npm run framework:verify   (should pass, role: consumer)",
);
