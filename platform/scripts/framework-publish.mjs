#!/usr/bin/env node
// Publishes this repo's platform/ to the framework repository, whose ROOT is the contents of
// platform/ (that is what `git subtree split --prefix=platform` produces — the framework repo has
// no platform/ directory of its own).
//
// Only meaningful in role: "source" — the template repo, which doubles as the framework's dev
// harness. A consumer portal has nothing to publish; it pulls.
//
// Run: npm run framework:publish -- --tag v1.2.0    publish that release
//      npm run framework:publish -- --tag v1.2.0 --dry-run    show what would run, touch nothing
//
// `--tag` is REQUIRED. An untagged push is a release no portal can pin to — `framework:update
// -- --tag` resolves per-prefix tags and would find none — so it is refused rather than warned
// about. The tag must match platform/framework.json's `version`, because that manifest is what
// travels to the portal and what `framework:verify` reads back as the portal's current version:
// a tag disagreeing with it would make every portal misreport where it stands.
//
// Requires Gate A: push access to the framework repo. That is a host-side setting (branch
// protection / restricted push), not something this script can or should enforce — if you lack
// access, git will say so.

import { loadManifest, resolveRole } from "./framework-lib.mjs";
import {
  requireRemote,
  git,
  assertCleanTree,
  tagFor,
} from "./framework-remote.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tagIndex = args.indexOf("--tag");
const tag = tagIndex !== -1 ? args[tagIndex + 1] : null;

const manifest = loadManifest(root);
if (!manifest) {
  console.error(
    "framework:publish — platform/framework.json not found or not valid JSON.",
  );
  process.exit(1);
}

const { role } = resolveRole(root);
if (role !== "source") {
  console.error(
    `framework:publish — package.json's framework.role is "${role}", not "source". Publishing ` +
      "from a consumer portal would push that portal's local state as if it were the framework. " +
      "Publish from the framework's own repo/template instead.",
  );
  process.exit(1);
}

const { remote, prefixes } = requireRemote(manifest, "publish");

const version = `v${manifest.version ?? "?"}`;

if (tagIndex === -1 || !tag) {
  console.error(
    [
      "framework:publish — --tag is required.",
      "",
      "Every published release has to be pinnable: `npm run framework:update -- --tag vX.Y.Z`",
      "resolves one tag per prefix, so an untagged push produces a release no portal can ask for.",
      "",
      `platform/framework.json declares version ${manifest.version ?? "?"}, so:`,
      "",
      `    npm run framework:publish -- --tag ${version}`,
      "",
      "Releasing something else means bumping that `version` field first.",
    ].join("\n"),
  );
  process.exit(1);
}

if (tag !== version) {
  console.error(
    [
      `framework:publish — --tag ${tag} disagrees with platform/framework.json's version ` +
        `(${manifest.version ?? "?"}).`,
      "",
      "These must match. The manifest is what travels to the portal, and `framework:verify` reads",
      "its `version` back as the portal's current framework version — so publishing a tag that",
      "disagrees makes every portal on this release misreport where it stands.",
      "",
      `Either publish as ${version}, or set platform/framework.json's "version" to ` +
        `${tag.replace(/^v/, "")} and re-run framework:lock.`,
    ].join("\n"),
  );
  process.exit(1);
}

// One `subtree push` per prefix, then ONE TAG PER PREFIX pointing at that prefix's split head.
// See tagFor()'s comment for why a single release-wide tag on this repo's HEAD is not an option.
//
// `subtree push` is left exactly as it was rather than reimplemented as split + `git push
// <sha>:refs/heads/<branch>`. The two are equivalent — that is literally what subtree push does —
// but rewriting the one command that actually ships a release, to save a single cached history
// traversal, is a bad trade.
if (dryRun) {
  console.log(
    `framework:publish — dry run. Would publish ${version} to ${remote}:\n`,
  );
  for (const { prefix, branch } of prefixes) {
    console.log(
      `    ${prefix}/  ->  ${branch}   tag ${tagFor(version, branch)}`,
    );
  }
  console.log("");
  for (const { prefix, branch } of prefixes) {
    console.log(`    git subtree push --prefix=${prefix} ${remote} ${branch}`);
    console.log(
      `    git tag ${tagFor(version, branch)} $(git subtree split --prefix=${prefix})`,
    );
  }
  console.log(
    `    git push ${remote} ${prefixes.map(({ branch }) => tagFor(version, branch)).join(" ")}`,
  );
  process.exit(0);
}

assertCleanTree("publish");

console.log(
  `framework:publish — publishing ${version}: ${prefixes.length} prefix(es) to ${remote}\n`,
);

const tags = [];
for (const { prefix, branch } of prefixes) {
  console.log(`  git subtree push --prefix=${prefix} ${remote} ${branch}`);
  git(["subtree", "push", `--prefix=${prefix}`, remote, branch]);

  // Re-split to learn the commit that push just sent. Cheap: the push above already populated
  // .git/subtree-cache for this prefix, so this is a cache read, not a second history walk.
  const sha = git(["subtree", "split", `--prefix=${prefix}`], {
    capture: true,
  }).split("\n")[0];
  const name = tagFor(version, branch);

  // RE-RUNNABLE. A publish walks three histories and pushes over the network, so it can and does
  // die midway — the first run of this was killed by a timeout after tagging one prefix of three.
  // A bare `git tag` then aborts the retry with "tag already exists", leaving the release
  // permanently half-published unless someone deletes tags by hand. So: same target, skip; other
  // target, refuse. Never -f — silently moving a release tag is how a portal ends up pinned to
  // content that no longer matches the version it thinks it has.
  const existing = git(["tag", "-l", name, "--format=%(objectname)"], {
    capture: true,
  });
  if (existing === sha) {
    console.log(
      `  tag ${name} already points at ${sha.slice(0, 12)} — skipping`,
    );
  } else if (existing) {
    console.error(
      [
        `\nframework:publish — tag ${name} already exists and points at ${existing.slice(0, 12)},`,
        `not the ${prefix}/ split head ${sha.slice(0, 12)} this publish produced.`,
        "",
        "Refusing to move it. A release tag that moves leaves any portal already pinned to it on",
        "content that no longer matches the version it reports.",
        "",
        `Publish a new version, or if ${version} was never consumed, delete the tag deliberately:`,
        `    git tag -d ${name} && git push ${remote} :refs/tags/${name}`,
      ].join("\n"),
    );
    process.exit(1);
  } else {
    console.log(`  git tag ${name} ${sha.slice(0, 12)}`);
    git(["tag", name, sha]);
  }
  tags.push(name);
}

console.log(`\n  git push ${remote} ${tags.join(" ")}`);
git(["push", remote, ...tags]);

console.log(
  [
    `\nframework:publish — published ${version}. ${tags.length} tag(s): ${tags.join(", ")}.`,
    "",
    "Consumers take this release with:",
    `    npm run framework:update -- --tag ${version}`,
    "or the branch tip, whatever that currently is, with a bare `npm run framework:update`.",
  ].join("\n"),
);
