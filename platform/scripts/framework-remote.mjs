// Shared plumbing for framework:publish and framework:update — the two commands that talk to the
// framework repo over git subtree.
//
// Both refuse to run rather than guess when `subtree.remote` is null in platform/framework.json.
// Guessing a URL here would either fail confusingly or, worse, push framework history somewhere
// unintended.

import { execFileSync, spawnSync } from "node:child_process";

// The framework is delivered as SEVERAL subtree prefixes, not one, because subtree can only ever
// see the single directory it is given: `platform/` for the runtime code, `.claude/` and
// `.agents/` for the agent policy that has to sit at the project root. Anything framework-owned
// outside all of them is `materialized` instead. See platform/framework.json's subtree block.
//
// Still accepts the pre-phase-7 single-prefix shape so an older manifest doesn't break the tooling
// mid-upgrade.
export function resolveSubtree(manifest) {
  const cfg = manifest.subtree ?? {};
  const prefixes = Array.isArray(cfg.prefixes)
    ? cfg.prefixes.map((p) => ({
        prefix: p.prefix,
        branch: p.branch ?? "main",
      }))
    : [{ prefix: cfg.prefix ?? "platform", branch: cfg.branch ?? "main" }];
  return { remote: cfg.remote ?? null, prefixes };
}

export function requireRemote(manifest, command) {
  const { remote, prefixes } = resolveSubtree(manifest);
  if (!remote) {
    console.error(
      `framework:${command} — platform/framework.json's subtree.remote is null, so there is ` +
        "nowhere to " +
        (command === "publish" ? "push to" : "pull from") +
        ".\n\n" +
        "Set it once and framework:publish, :update and :link all work:\n\n" +
        '    "subtree": {\n' +
        '      "remote": "<url-or-path>",\n' +
        '      "prefixes": [\n' +
        '        { "prefix": "platform", "branch": "main" },\n' +
        '        { "prefix": ".claude",  "branch": "claude-policy" },\n' +
        '        { "prefix": ".agents",  "branch": "agents-policy" }\n' +
        "      ]\n" +
        "    }\n\n" +
        "A local bare repo path is a perfectly valid value — that is how the round trip was\n" +
        "proven before any host existed (see docs/DECISIONS.md).",
    );
    process.exit(1);
  }
  return { remote, prefixes };
}

// Which of the configured prefixes still have no git-subtree merge base — i.e. which ones
// `framework:update` cannot pull yet and `framework:link` still has to establish.
export function unlinkedPrefixes(prefixes) {
  return prefixes.filter(({ prefix }) => !hasSubtreeBase(prefix));
}

// The tag naming scheme for a release, shared by publish and update so they cannot disagree.
//
// ONE TAG PER PREFIX, not one per release. A release is three separate `subtree split` histories
// with no commit in common, so there is no single commit a release-wide tag could point at. The
// obvious-looking `git tag v1.2.0` against this repo's HEAD is worse than useless: that commit is
// not reachable from ANY split history (split generates new commit objects), so pushing the tag
// drags the whole template history into the framework repo, and the tag is unpullable anyway —
// its tree has platform/ as a subdirectory, so `subtree pull` of it would merge the entire
// template into platform/.
//
// Discriminated by BRANCH rather than prefix: branch names are already valid ref components,
// whereas `.claude` and `.agents` are awkward inside one. main <-> platform/ is the mapping
// platform/framework.json's subtree block already establishes.
export const tagFor = (version, branch) => `${version}-${branch}`;

// Which of a release's per-prefix tags are missing from the remote.
//
// Checked for every prefix before pulling any of them: a half-published version would leave a
// portal with runtime code at one version and agent policy at another, the same split-brain
// unlinkedPrefixes() exists to prevent.
export function missingRemoteTags(remote, prefixes, version) {
  let published;
  try {
    published = new Set(
      execFileSync("git", ["ls-remote", "--tags", remote], { encoding: "utf8" })
        .split("\n")
        .map((line) => line.split("refs/tags/")[1]?.trim())
        .filter(Boolean)
        // `git ls-remote --tags` lists the peeled `^{}` entry for annotated tags alongside the
        // tag itself; both name the same release, so collapse them.
        .map((tag) => tag.replace(/\^\{\}$/, "")),
    );
  } catch {
    console.error(
      `framework — could not list tags on ${remote}. Is it reachable, and does it exist yet?`,
    );
    process.exit(1);
  }
  return prefixes
    .map(({ prefix, branch }) => ({
      prefix,
      branch,
      tag: tagFor(version, branch),
    }))
    .filter(({ tag }) => !published.has(tag));
}

export function git(args, { capture = false } = {}) {
  if (capture) {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  }
  const result = spawnSync("git", args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\ngit ${args.join(" ")} — exited ${result.status}`);
    process.exit(result.status ?? 1);
  }
  return null;
}

// Whether this repo has a git-subtree merge base for `prefix` — i.e. whether platform/ ever
// arrived via `git subtree add`, as opposed to being ordinary committed files.
//
// This matters because `git subtree pull` needs that base to know what "last synced" means. A
// portal created by cloning the template has platform/ as plain files with no base, and BOTH pull
// variants refuse: `--squash` fails "can't squash-merge: 'platform' was never added", and plain
// pull fails "refusing to merge unrelated histories". Verified both.
//
// git records the base as a `git-subtree-dir:` trailer on the commit that subtree add/pull
// created, which is what this greps for.
export function hasSubtreeBase(prefix) {
  try {
    const out = execFileSync(
      "git",
      ["log", "--grep", `git-subtree-dir: ${prefix}`, "--format=%H", "-1"],
      { encoding: "utf8" },
    ).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

export function assertCleanTree(command) {
  const status = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  }).trim();
  if (status) {
    console.error(
      `framework:${command} — the working tree has uncommitted changes. git subtree refuses to ` +
        "run against a dirty tree, and it would be ambiguous which changes belong to the " +
        "framework anyway. Commit or stash first:\n",
    );
    console.error(status);
    process.exit(1);
  }
}
