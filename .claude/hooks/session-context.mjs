#!/usr/bin/env node
// SessionStart hook. Stdout is injected into the session's context.
//
// Purpose: this repo's docs (ARCHITECTURE.md / docs/architecture/*) are hand-maintained
// and can lag `main` — especially with 2-4 developers on separate branches. This hook
// gives every session a ground-truth starting point (recent history, active branches,
// open work claims) instead of relying solely on docs that might already be stale.
// See CLAUDE.md's "Before Every Task" section.

import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const sh = (cmd) => {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
};

// Fetch first so everything below reflects what other developers have pushed, not what this
// clone happened to have last time. sh() already fails soft (empty string) with no remote
// configured (true of a fresh skeleton clone) or offline — this line never blocks the session.
sh("git fetch --prune --quiet origin");
const mainRef = sh("git rev-parse --verify origin/main")
  ? "origin/main"
  : "main";

const out = [];
out.push("## Repo state at session start (auto-generated, ground truth)\n");

const branch = sh("git rev-parse --abbrev-ref HEAD");
out.push(`Current branch: **${branch || "unknown"}**`);

out.push(
  `\n### Last 15 commits on ${mainRef} (squash-merged: 1 commit = 1 shipped unit)`,
);
out.push(
  "```\n" +
    (sh(`git log --oneline -15 ${mainRef}`) || "(no history)") +
    "\n```",
);

if (branch && branch !== "main") {
  const ahead = sh(`git log --oneline ${mainRef}..HEAD`);
  const stat = sh(`git diff --stat ${mainRef}...HEAD`);
  out.push(`\n### This branch's own changes vs ${mainRef}`);
  out.push("```\n" + (ahead || "(no commits yet)") + "\n" + stat + "\n```");
}

const remotes = sh(
  "git branch -r --sort=-committerdate --format=%(refname:short)_%(committerdate:relative)",
);
if (remotes) {
  const lines = remotes
    .split("\n")
    .slice(0, 8)
    .map((l) => l.replace("_", "  "));
  out.push("\n### Active remote branches (other developers may be here)");
  out.push("```\n" + lines.join("\n") + "\n```");
}

// Local WIP claims (this clone's own unmerged branches, plus main if a claim was left there).
let claims = [];
try {
  claims = readdirSync("docs/wip").filter(
    (f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md",
  );
} catch {
  // docs/wip doesn't exist yet — nothing to report
}

out.push(
  "\n### Open WIP claims (docs/wip/) — do not build what another branch claims",
);
if (!claims.length) {
  out.push("_(none locally)_");
} else {
  for (const f of claims) {
    let body = "";
    try {
      body = readFileSync(`docs/wip/${f}`, "utf8");
    } catch {
      continue;
    }
    const creating =
      body
        .split(/^## Creating.*$/m)[1]
        ?.split(/^## /m)[0]
        ?.trim() ?? "";
    out.push(
      `\n**${f.replace(/\.md$/, "")}**\n${creating || "(see the file)"}`,
    );
  }
}

// Remote WIP claims — the fix for the flaw the local-only scan above has: a claim committed on
// another developer's unmerged branch was invisible until that branch merged. Read docs/wip/*
// straight out of every unmerged remote branch instead of relying on this clone's working tree.
const unmergedRemotes = sh(
  `git for-each-ref --format=%(refname:short) refs/remotes/origin --no-merged ${mainRef}`,
)
  .split("\n")
  .filter((b) => b && !b.endsWith("/HEAD"));
if (unmergedRemotes.length) {
  out.push(
    "\n### Open WIP claims on other developers' unmerged remote branches",
  );
  let anyRemoteClaim = false;
  for (const b of unmergedRemotes) {
    const files = sh(`git ls-tree --name-only ${b} docs/wip/`)
      .split("\n")
      .filter((f) => {
        const base = f.split("/").pop() ?? "";
        return (
          f.endsWith(".md") && !base.startsWith("_") && base !== "README.md"
        );
      });
    for (const f of files) {
      anyRemoteClaim = true;
      const body = sh(`git show ${b}:${f}`);
      const creating =
        body
          .split(/^## Creating.*$/m)[1]
          ?.split(/^## /m)[0]
          ?.trim() ?? "";
      out.push(`\n**${f} (${b})**\n${creating || "(see the file)"}`);
    }
  }
  if (!anyRemoteClaim) out.push("_(none)_");
}

// Units another developer's build loop currently owns — see docs/plan/README.md and
// .claude/skills/build-app/SKILL.md. The unit/<NNN>-<slug> ref itself IS the claim; no working
// tree needed to read it.
const unitRefs = sh("git ls-remote --heads origin refs/heads/unit/*")
  .split("\n")
  .filter(Boolean)
  .map((l) => l.split("refs/heads/")[1])
  .filter(Boolean);
if (unitRefs.length) {
  out.push(
    "\n### Build units currently claimed by other developers (unit/<NNN>-<slug> refs on origin)",
  );
  out.push("```\n" + unitRefs.join("\n") + "\n```");
}

// Current app build state, if this repo has a plan — cheap file read, not a script invocation.
let roadmap = null;
try {
  roadmap = readFileSync("docs/plan/ROADMAP.md", "utf8");
} catch {
  // no plan yet
}
if (roadmap) {
  const readySection =
    roadmap
      .split(/^## Ready to build now.*$/m)[1]
      ?.split(/^## /m)[0]
      ?.trim() ?? "";
  out.push(
    "\n### App build in progress (docs/plan/) — see docs/plan/ROADMAP.md, run `npm run plan:next`",
  );
  out.push(readySection || "_(see docs/plan/ROADMAP.md)_");
}

const archAge = sh(
  "git log -1 --format=%cr -- ARCHITECTURE.md docs/architecture",
);
const mainAge = sh(`git log -1 --format=%cr ${mainRef}`);
out.push(
  `\n### Doc freshness\nArchitecture docs last touched: ${archAge || "unknown"} · main last commit: ${mainAge || "unknown"}`,
);
out.push(
  "If main has moved in areas the architecture docs describe, believe the code and tell the user the doc is stale — see CLAUDE.md step 3.",
);

console.log(out.join("\n"));
