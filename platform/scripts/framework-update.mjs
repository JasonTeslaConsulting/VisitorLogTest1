#!/usr/bin/env node
// Pulls the framework repository back into platform/ and redeploys the materialized files.
//
// THE ORDER HERE IS THE WHOLE POINT. `git subtree pull` MERGES — it does not overwrite. Local
// edits under platform/ are therefore not discarded; they three-way-merge, and everywhere upstream
// didn't touch the same lines BOTH sides survive. The fork then persists silently through every
// future update. Quiet divergence is worse than a loud overwrite, so this command verifies FIRST
// and refuses to pull into a diverged tree at all.
//
//   1. clean tree            — subtree refuses a dirty tree anyway, and it would be ambiguous
//                              which changes were the app's
//   2. framework:verify      — abort if platform/ has diverged from platform/framework.lock
//   3. git subtree pull      — brings in upstream platform/, including the new lock
//   4. framework:apply       — deploys the new canonical materialized copies to their real paths;
//                              without this, verify would (correctly) flag them as stale
//   5. framework:verify      — confirms the result actually matches the new lock
//
// Run: npm run framework:update                    take the branch tip, whatever it currently is
//      npm run framework:update -- --tag v1.2.0    take that published release
//      npm run framework:update -- --dry-run       show what would run, touch nothing
//      npm run framework:update -- --no-commit     leave step 4's changes uncommitted
//
// PINNING WORKS IN BOTH DIRECTIONS, which is not what you would predict from `subtree pull`
// being a merge rather than a checkout. With --squash each pull records the upstream ref as one
// squashed commit, so the merge base is the previously-squashed version and the diff against an
// older tag is a clean revert. Verified end to end: a portal went 0.1.0 -> 0.2.0 -> 0.3.0 ->
// 0.2.0, and at each step framework.json's version, ordinary framework code, and the deployed
// materialized copies all matched the target release with framework.lock verifying.
//
// What makes that safe is the boundary itself: a portal has no local edits under platform/ for a
// backwards merge to conflict with. A forked framework file would be exactly the case that breaks
// it — which is why this command refuses to run at all against a diverged tree (step 2 below).
// Portal-owned files inside the mixed .claude/ prefix are unaffected in either direction: pull
// merges, so a portal's own skill is in neither upstream side and survives (verified).
//
// If step 2 aborts, the two sanctioned ways forward are `npm run framework:reset` (discard the
// local framework edits) or moving the change upstream into the framework repo. Neither lets a
// fork survive an upgrade — see docs/DECISIONS.md.

import { spawnSync } from "node:child_process";
import { loadManifest, resolveRole } from "./framework-lib.mjs";
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
const noCommit = args.includes("--no-commit");
const tagIndex = args.indexOf("--tag");
const tag = tagIndex !== -1 ? args[tagIndex + 1] : null;

if (tagIndex !== -1 && (!tag || tag.startsWith("--"))) {
  console.error(
    "framework:update — --tag was passed with no value, e.g. --tag v1.2.0",
  );
  process.exit(1);
}

const manifest = loadManifest(root);
if (!manifest) {
  console.error(
    "framework:update — platform/framework.json not found or not valid JSON.",
  );
  process.exit(1);
}

const { role } = resolveRole(root);
const { remote, prefixes } = requireRemote(manifest, "update");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const runNpm = (script, extra = []) =>
  spawnSync(npm, ["run", script, ...(extra.length ? ["--", ...extra] : [])], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

// What each prefix is pulled from: its per-prefix release tag, or the branch tip when no --tag
// was given. One place, so the dry run and the real run can never describe different things.
const refFor = ({ branch }) => (tag ? tagFor(tag, branch) : branch);

if (dryRun) {
  console.log(
    [
      `framework:update — dry run. Would pull ${tag ? tag : "the branch tips"} from ${remote}:`,
      "",
      "    npm run framework:verify -- --check        (abort if diverged)",
      ...prefixes.map(
        (p) =>
          `    git subtree pull --prefix=${p.prefix} ${remote} ${refFor(p)} --squash`,
      ),
      "    npm run framework:apply",
      ...(noCommit
        ? []
        : [
            "    git commit                                (if apply changed anything)",
          ]),
      "    npm run framework:verify -- --check",
    ].join("\n"),
  );
  process.exit(0);
}

// --- 0: refuse early if ANY prefix has no subtree base to pull against ------------------------
// git's own message here is famously unhelpful ("can't squash-merge: 'platform' was never added"),
// so catch it first and name the actual fix.
//
// Checked for every prefix, not just the first: a portal linked before the framework gained the
// .claude/ and .agents/ prefixes has a base for platform/ only, and pulling just that one would
// leave the framework half-updated — runtime code new, agent policy old.
const unlinked = unlinkedPrefixes(prefixes);
if (unlinked.length) {
  console.error(
    [
      `framework:update — ${unlinked.length} of ${prefixes.length} framework prefix(es) have no`,
      "git-subtree base, so there is nothing for a pull to merge against:",
      "",
      ...unlinked.map(({ prefix }) => `    ${prefix}/`),
      "",
      "That is the normal state of a portal cloned from the template (those directories arrived as",
      "ordinary committed files, not via `git subtree add`), and also of a portal that was linked",
      "before the framework gained a new prefix.",
      "",
      "Run the one-time link step first, then update:",
      "",
      "    npm run framework:link",
      "    npm run framework:update",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

// --- 0b: with --tag, refuse unless the WHOLE release is published ------------------------------
// Same reasoning as the unlinked check above, one layer out: pulling the two prefixes that were
// tagged and skipping the one that wasn't would leave runtime code and agent policy at different
// versions. Checked before the first pull so a partial release cannot half-land.
if (tag) {
  const missing = missingRemoteTags(remote, prefixes, tag);
  if (missing.length) {
    console.error(
      [
        `framework:update — ${tag} is not fully published on ${remote}. ` +
          `${missing.length} of ${prefixes.length} tag(s) missing:`,
        "",
        ...missing.map(
          ({ tag: name, prefix }) => `    ${name}   (for ${prefix}/)`,
        ),
        "",
        "A release is one tag per prefix, so pulling the tags that do exist would leave this",
        "portal with its runtime code and its agent policy on different versions.",
        "",
        "Either the version is wrong, or the release was never published — `git ls-remote --tags`",
        `${remote} lists what is actually there. Nothing has been pulled.`,
        "",
      ].join("\n"),
    );
    process.exit(1);
  }
}

// --- 1 + 2: refuse to pull into a dirty or diverged tree -------------------------------------
assertCleanTree("update");

console.log("framework:update — checking the current tree before pulling…\n");
const preCheck = runNpm("framework:verify", ["--check"]);
if (preCheck.status !== 0) {
  console.error(
    "\nframework:update — ABORTED before touching anything.\n\n" +
      "The framework boundary is already violated above, and `git subtree pull` MERGES rather\n" +
      "than overwrites — pulling now would silently preserve the local fork inside the merge\n" +
      "result, where it would survive every future update.\n\n" +
      "Two sanctioned ways forward:\n" +
      "  npm run framework:reset    discard the local framework edits, then update\n" +
      "  (or) move the change upstream into the framework repo and release it, then update\n",
  );
  process.exit(1);
}

// --- 3: pull ---------------------------------------------------------------------------------
// --squash: a portal wants the framework's *content*, not its per-commit history interleaved
// into the app's log. Without it `git log` in a portal becomes mostly framework commits.
for (const p of prefixes) {
  const ref = refFor(p);
  console.log(`\nframework:update — pulling ${ref} into ${p.prefix}/\n`);
  git(["subtree", "pull", `--prefix=${p.prefix}`, remote, ref, "--squash"]);
}

// --- 4: redeploy materialized ----------------------------------------------------------------
console.log("\nframework:update — deploying materialized files\n");
const applied = runNpm("framework:apply");
if (applied.status !== 0) {
  console.error(
    "\nframework:update — the pull succeeded but framework:apply failed. The tree is mid-update: " +
      "platform/ is on the new version while some materialized file is not. Fix the problem above " +
      "and re-run `npm run framework:apply`.",
  );
  process.exit(1);
}

const dirty = spawnSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
}).stdout.trim();
if (dirty && !noCommit) {
  console.log(
    "\nframework:update — committing the redeployed materialized files\n",
  );
  git(["add", "-A"]);
  git(["commit", "-m", "framework:update — redeploy materialized files"]);
} else if (dirty) {
  console.log(
    "\nframework:update — materialized files were redeployed and left uncommitted (--no-commit).",
  );
}

// --- 5: confirm the result ---------------------------------------------------------------------
console.log("\nframework:update — verifying the result\n");
const postCheck = runNpm("framework:verify", ["--check"]);
if (postCheck.status !== 0) {
  console.error(
    "\nframework:update — the pull landed but the result does not match the new " +
      "platform/framework.lock. This is not a normal outcome: it means upstream published a lock " +
      "that disagrees with its own content, or the merge produced something neither side " +
      "intended. Inspect the diff before committing anything further.",
  );
  process.exit(1);
}

// Version read back from the manifest the pull just delivered, not from the --tag that was asked
// for. If those two ever disagree, the release was published with a mismatched tag and this is
// where it becomes visible, rather than months later via framework:verify in a portal.
const landed = loadManifest(root)?.version ?? "?";
console.log(
  `\nframework:update — done. ${prefixes.length} prefix(es) updated from ${remote} ` +
    `to framework v${landed}` +
    (role === "consumer"
      ? ", and the tree matches platform/framework.lock."
      : "."),
);
if (tag && `v${landed}` !== tag) {
  console.log(
    `framework:update — WARNING: asked for ${tag} but the manifest that arrived says v${landed}. ` +
      "That release was published with a tag disagreeing with its own platform/framework.json.",
  );
}
