#!/usr/bin/env node
// One-time: converts an existing plain-files platform/ into a real git-subtree link, so
// `npm run framework:update` can pull.
//
// WHY THIS STEP EXISTS AT ALL. `git subtree pull` needs a merge base recording what "last synced"
// means, and git only creates that base when the directory arrived via `git subtree add`. A portal
// cloned from the template has platform/ as ordinary committed files, so it has no base, and BOTH
// pull variants refuse outright:
//     --squash  ->  fatal: can't squash-merge: 'platform' was never added
//     plain     ->  fatal: refusing to merge unrelated histories
// (Both verified, not assumed.) So does the template repo itself, whose platform/ predates the
// framework repo existing.
//
// What it does: removes the current platform/ in one commit, then `git subtree add`s it back from
// the framework repo. The content is identical — it comes from the same upstream — but the history
// now carries the base that makes pulls work. `framework:apply` then redeploys the materialized
// files, since removing platform/ removed their canonical copies.
//
// Run once per repo: npm run framework:link                  link to the branch tip
//      npm run framework:link -- --tag v1.2.0    link to that published release
//      npm run framework:link -- --dry-run       show the plan, change nothing
//
// `--tag` matters here and not only on update, because linking is where a history-less portal
// (the "Use this template" button, or `app:init --reset-history`) gets its FIRST framework
// content. Without it, such a portal always starts at whatever the branch tip happens to be, and
// the only route to the release it actually wants is to land on the tip and then move — one more
// commit, and a period where the portal is on a version nobody chose. Naming the version at this
// step is a step shorter and never lands on the wrong one.
//
// After this, `npm run framework:update` is the only command anyone needs.

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { loadManifest } from "./framework-lib.mjs";
import {
  requireRemote,
  git,
  assertCleanTree,
  unlinkedPrefixes,
  tagFor,
  missingRemoteTags,
} from "./framework-remote.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tagIndex = args.indexOf("--tag");
const tag = tagIndex !== -1 ? args[tagIndex + 1] : null;

if (tagIndex !== -1 && (!tag || tag.startsWith("--"))) {
  console.error(
    "framework:link — --tag was passed with no value, e.g. --tag v1.2.0",
  );
  process.exit(1);
}

const manifest = loadManifest(root);
if (!manifest) {
  console.error(
    "framework:link — platform/framework.json not found or not valid JSON.",
  );
  process.exit(1);
}

const { remote, prefixes } = requireRemote(manifest, "link");

// Only the prefixes that still need it. A portal linked before the framework gained .claude/ and
// .agents/ has a base for platform/ already, so this is also the upgrade path for those portals —
// it links what's missing and leaves the rest alone.
const todo = unlinkedPrefixes(prefixes);

if (todo.length === 0) {
  console.log(
    `framework:link — all ${prefixes.length} framework prefix(es) are already git-subtree links; ` +
      "nothing to do. Use `npm run framework:update` to pull.",
  );
  process.exit(0);
}

// What each prefix is added from: its per-prefix release tag, or the branch tip when no --tag
// was given. Shared by the dry run and the real run so they cannot describe different things.
const refFor = ({ branch }) => (tag ? tagFor(tag, branch) : branch);

// With --tag, refuse unless the WHOLE release is published — same reasoning as framework:update's
// equivalent check. Linking two prefixes from a tag and the third from nowhere would leave the
// portal with runtime code and agent policy on different versions, at the very first step.
if (tag) {
  const missing = missingRemoteTags(remote, prefixes, tag);
  if (missing.length) {
    console.error(
      [
        `framework:link — ${tag} is not fully published on ${remote}. ` +
          `${missing.length} of ${prefixes.length} tag(s) missing:`,
        "",
        ...missing.map(
          ({ tag: name, prefix }) => `    ${name}   (for ${prefix}/)`,
        ),
        "",
        "A release is one tag per prefix. Check `git ls-remote --tags` for what exists, or link to",
        "the branch tip by dropping --tag. Nothing has been changed.",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const runNpm = (script) =>
  spawnSync(npm, ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

if (dryRun) {
  console.log(
    [
      `framework:link — dry run. ${todo.length} of ${prefixes.length} prefix(es) need linking` +
        (tag ? ` at ${tag}:` : " at the branch tips:"),
      "",
      ...todo.flatMap((p) => [
        ...(existsSync(path.join(root, p.prefix))
          ? [`    git rm -r --quiet ${p.prefix}`, '    git commit -m "…"']
          : []),
        `    git subtree add --prefix=${p.prefix} ${remote} ${refFor(p)} --squash`,
      ]),
      "    npm run framework:apply",
      "    npm run framework:verify",
    ].join("\n"),
  );
  process.exit(0);
}

assertCleanTree("link");

console.log(
  `framework:link — ${todo.length} of ${prefixes.length} prefix(es) have no git-subtree base, so\n` +
    "`framework:update` cannot pull them. Relinking from " +
    `${remote}. Content is unchanged — it\n` +
    "comes from the same upstream; only the history gains the base that makes pulls work.\n",
);

for (const p of todo) {
  const { prefix } = p;
  const ref = refFor(p);
  console.log(`\nframework:link — ${prefix}/  (${ref})`);

  // `git subtree add` requires the prefix not to exist in the index. Removing the tracked files
  // leaves any *untracked* ones on disk — notably .claude/settings.local.json, which is gitignored
  // and per-developer. That is desirable: it survives the relink untouched.
  if (existsSync(path.join(root, prefix))) {
    console.log(`  git rm -r ${prefix}`);
    git(["rm", "-r", "--quiet", prefix]);
    git([
      "commit",
      "-m",
      `framework:link — remove plain-files ${prefix}/ before subtree add\n\n` +
        "git subtree add requires the prefix not to exist. Re-added from the framework repo in " +
        "the next commit, with identical content.",
    ]);
  }

  console.log(`  git subtree add --prefix=${prefix} ${remote} ${ref} --squash`);
  git(["subtree", "add", `--prefix=${prefix}`, remote, ref, "--squash"]);
}

// Removing platform/ also removed platform/materialized/**, so the deployed materialized files
// have no canonical copy for a moment. subtree add restores the copies; this redeploys from them.
console.log("\nframework:link — deploying materialized files\n");
if (runNpm("framework:apply").status !== 0) {
  console.error(
    "\nframework:link — subtree add succeeded but framework:apply failed. Fix the problem above " +
      "and re-run `npm run framework:apply`.",
  );
  process.exit(1);
}

const dirty = spawnSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
}).stdout.trim();
if (dirty) {
  git(["add", "-A"]);
  git(["commit", "-m", "framework:link — redeploy materialized files"]);
}

console.log("\nframework:link — verifying\n");
if (runNpm("framework:verify").status !== 0) {
  console.error(
    "\nframework:link — verify reported problems above; review before continuing.",
  );
  process.exit(1);
}

console.log(
  `\nframework:link — done. ${todo.map(({ prefix }) => `${prefix}/`).join(", ")} ` +
    `${todo.length === 1 ? "is" : "are"} now subtree(s) of ${remote}` +
    (tag ? `, at ${tag}. ` : ". ") +
    "From here on use `npm run framework:update`.",
);
