#!/usr/bin/env node
// Warning-only doc-drift check. Never blocks a merge — its job is to be visible
// in the PR log. Every assertion here caught a real, already-happened drift in
// this repo (icon library, dangling Layout.md refs, README's React version,
// the silent-no-op `tsc --noEmit` invocation) — see docs/DECISIONS.md.
//
// Run: npm run docs:check

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const warnings = [];
const warn = (msg) => warnings.push(msg);

const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

// The `@theme inline` block used to live in src/index.css. The framework/app split moved it into
// framework-owned CSS (values stayed app-owned in src/theme.css), and phase 2 moves that file again
// into platform/. Resolving by first-existing candidate means neither move silently empties this
// check — an empty theme block makes every DESIGN.md role look unresolved, which is 40 lines of
// noise that reads exactly like real drift.
const THEME_CSS_CANDIDATES = [
  "platform/src/styles/framework.css",
  "src/styles/framework.css",
  "src/index.css",
];

function readThemeInlineBlock() {
  for (const candidate of THEME_CSS_CANDIDATES) {
    const css = read(path.join(root, candidate));
    if (!css) continue;
    const start = css.indexOf("@theme inline {");
    if (start === -1) continue;
    return css.slice(start, css.indexOf("\n}", start));
  }
  warn(
    `no @theme inline block found in any of: ${THEME_CSS_CANDIDATES.join(", ")} — ` +
      `Check 6 cannot resolve DESIGN.md's color roles`,
  );
  return "";
}

function walk(dir, exts, skip = []) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).split(path.sep).join("/");
    if (skip.some((s) => rel === s || rel.startsWith(s + "/"))) continue;
    if (entry.isDirectory()) out.push(...walk(full, exts, skip));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

// Vendored, symlinked upstream skill content — hash-tracked via skills-lock.json.
// Its internal cross-references are upstream's concern, not ours.
const VENDORED_SKILLS = [
  ".claude/skills/shadcn",
  ".claude/skills/migrate-radix-to-base",
];

// Conditional/generated app-build artifacts under docs/plan/ — they don't exist
// on a fresh clone of the skeleton by design (see docs/plan/README.md), only
// once `.claude/skills/plan-app/SKILL.md` runs. Referencing them isn't a
// stale link the way a missing rules/skill file would be.
const CONDITIONAL_PLAN_PATHS = [
  "docs/plan/app.md",
  "docs/plan/ROADMAP.md",
  "app.md",
];
const isConditionalPlanPath = (ref) =>
  CONDITIONAL_PLAN_PATHS.includes(ref) || ref.startsWith("docs/plan/units/");

// Paths the docs name that legitimately do not exist in a fresh skeleton, because something
// creates them later. Naming them is correct; their absence is not drift. Check 7 skips these.
const CREATED_ON_DEMAND = [
  // The app's own service layer — first written by .claude/skills/call-api/SKILL.md, along with
  // fixtures/ when a unit is data_mode: mock.
  "src/services",
  // Only ever populated if `npx shadcn add` emits a hook (components.json's aliases.hooks). No
  // shadcn component this repo uses ships one, so the directory has never existed.
  "platform/src/hooks/shadcn",
];
const isCreatedOnDemand = (ref) => {
  const trimmed = ref.replace(/\/+$/, "");
  return CREATED_ON_DEMAND.some(
    (p) => trimmed === p || trimmed.startsWith(p + "/"),
  );
};

// --- Check 1: every *.md path referenced from .claude/** and CLAUDE.md resolves ---
{
  const sources = [
    ...walk(path.join(root, ".claude"), [".md"], VENDORED_SKILLS),
    path.join(root, "CLAUDE.md"),
  ];
  const mdRefPattern = /`([A-Za-z0-9_][A-Za-z0-9_./-]*\.md)`/g;
  for (const file of sources) {
    const content = read(file);
    if (!content) continue;
    const dir = path.dirname(file);
    for (const match of content.matchAll(mdRefPattern)) {
      const ref = match[1];
      if (isConditionalPlanPath(ref)) continue;
      // Some docs cite a rules file by bare name assuming reader context
      // (e.g. "the promotion procedure in `index-css-rules.md`") rather than
      // the full path — try .claude/rules/ as a fallback before flagging it.
      const resolved =
        statInfo(path.join(dir, ref)) ??
        statInfo(path.join(root, ref)) ??
        statInfo(path.join(root, ".claude/rules", ref));
      if (!resolved) {
        warn(
          `${path.relative(root, file)}: references \`${ref}\`, which doesn't exist`,
        );
      }
    }
  }
}

function statInfo(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

// --- Check 2: the icon library CLAUDE.md names is the one actually imported ---
{
  const claudeMd = read(path.join(root, "CLAUDE.md")) ?? "";
  const stated = claudeMd.match(/Icons:\s*`([^`/]+)/)?.[1]?.trim();
  const KNOWN_ICON_LIBS = [
    "lucide-react",
    "react-icons",
    "@heroicons/react",
    "@tabler/icons-react",
    "@radix-ui/react-icons",
  ];
  if (stated) {
    const used = new Set();
    const srcFiles = [
      ...walk(path.join(root, "src"), [".ts", ".tsx"]),
      ...walk(path.join(root, "platform/src"), [".ts", ".tsx"]),
    ];
    const importPattern = /from\s+["']([^"']+)["']/g;
    for (const file of srcFiles) {
      const content = read(file) ?? "";
      for (const match of content.matchAll(importPattern)) {
        const spec = match[1];
        const lib = KNOWN_ICON_LIBS.find(
          (l) => spec === l || spec.startsWith(l + "/"),
        );
        if (lib) used.add(lib);
      }
    }
    const others = [...used].filter((l) => l !== stated);
    if (others.length > 0) {
      warn(
        `CLAUDE.md says icons are \`${stated}\`, but src/ or platform/src/ also imports from: ${others.join(", ")}`,
      );
    }
  }
}

// --- Check 3: README's stated React major matches package.json ---
{
  const pkg = JSON.parse(read(path.join(root, "package.json")) ?? "{}");
  const reactDep = pkg.dependencies?.react ?? "";
  const actualMajor = reactDep.match(/(\d+)/)?.[1];
  const readme = read(path.join(root, "README.md")) ?? "";
  const statedMajor = readme.match(/React (\d+)/)?.[1];
  if (actualMajor && statedMajor && actualMajor !== statedMajor) {
    warn(
      `README.md says React ${statedMajor}, but package.json has react@${reactDep}`,
    );
  }
}

// --- Check 4: no doc contains a bare `tsc --noEmit` (silent no-op on this repo) ---
{
  const mdFiles = [
    ...walk(
      root,
      [".md"],
      ["node_modules", "dist", ".git", ".agents", ...VENDORED_SKILLS],
    ),
  ];
  for (const file of mdFiles) {
    const content = read(file) ?? "";
    // Windowed proximity, not same-line: legitimate explanatory prose sometimes
    // wraps "a bare `tsc --noEmit`..." and "...needs --project" across two
    // lines of the same sentence (see CLAUDE.md's own Commands section).
    for (const match of content.matchAll(/tsc --noEmit/g)) {
      const windowStart = Math.max(0, match.index - 100);
      const windowEnd = Math.min(content.length, match.index + 150);
      const window = content.slice(windowStart, windowEnd);
      if (!window.includes("--project")) {
        const line = content.slice(0, match.index).split("\n").length;
        warn(
          `${path.relative(root, file)}:${line}: bare \`tsc --noEmit\` is a silent no-op on this repo — needs \`--project tsconfig.app.json\``,
        );
      }
    }
  }
}

// --- Check 5: services still on mock fixtures (docs/plan/README.md's data_mode: mock) ---
{
  const serviceFiles = [
    ...walk(
      path.join(root, "src/services"),
      [".ts"],
      ["src/services/fixtures"],
    ),
    ...walk(path.join(root, "platform/src/services"), [".ts"]),
  ];
  for (const file of serviceFiles) {
    const content = read(file) ?? "";
    for (const match of content.matchAll(/\/\/\s*MOCK\((U\d+)\):\s*(.*)/g)) {
      warn(
        `${path.relative(root, file)}: still on mock fixtures for ${match[1]} — ${match[2].trim()}`,
      );
    }
  }
}

// --- Check 6: every DESIGN.md semantic color role resolves to a real token ---
// A role counts as "resolved" if either (a) the framework CSS's @theme inline
// block defines a same-named --color-X token directly, or (b) tailwind.md's §1
// mapping table points the role at a destination token that @theme inline
// defines. Only roles named in an actual DESIGN.md table row are checked —
// this naturally excludes prose mentions (e.g. the Toasts bullet) and the
// §2.2 tonal ramp steps, which are reference-only by design (see
// .claude/rules/index-css-rules.md) and must never be auto-promoted.
{
  const designMd = read(path.join(root, "DESIGN.md")) ?? "";
  const tailwindMd = read(path.join(root, "tailwind.md")) ?? "";

  const themeBlock = readThemeInlineBlock();
  const definedThemeNames = new Set(
    [...themeBlock.matchAll(/--color-([a-z-]+)\s*:/g)].map((m) => m[1]),
  );

  const mapStart = tailwindMd.indexOf("## 1. Color role");
  const mapEnd = tailwindMd.indexOf("## 2.");
  const mappingSection =
    mapStart === -1
      ? ""
      : tailwindMd.slice(mapStart, mapEnd === -1 ? undefined : mapEnd);
  const roleToDestinations = new Map();
  for (const line of mappingSection.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|");
    // [a-z0-9-], not [a-z-]: without the digits this truncates any role name ending in one
    // (`--color-elevation-2` came back as `--color-elevation-`) and then reports it as having
    // no token, which is a false positive that looks exactly like a real drift finding.
    const roleMatch = cells[1]?.match(/--color-[a-z0-9-]+/);
    if (!roleMatch) continue;
    const role = roleMatch[0].replace(/^--color-/, "");
    const destinations = [...(cells[2] ?? "").matchAll(/`(--[a-z-]+)`/g)].map(
      (m) => m[1].replace(/^--/, ""),
    );
    roleToDestinations.set(role, destinations);
  }

  const roles = new Set();
  for (const line of designMd.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    for (const m of line.matchAll(/--color-([a-z-]+)/g)) roles.add(m[1]);
  }

  for (const role of roles) {
    const resolvedDirectly = definedThemeNames.has(role);
    const destinations = roleToDestinations.get(role) ?? [];
    const resolvedViaMapping = destinations.some((d) =>
      definedThemeNames.has(d),
    );
    if (!resolvedDirectly && !resolvedViaMapping) {
      warn(
        `DESIGN.md defines role --color-${role}, but it has no token in the framework CSS's ` +
          `@theme inline block and no resolving row in tailwind.md §1 — add one or the other`,
      );
    }
  }

  // Second pass: every resolvable role should also have a swatch in the
  // Component Library's visual QA gallery — a token that resolves but is
  // never shown is the same failure one layer deeper. "on-*" roles (shown as
  // an existing swatch's fg, not their own entry) and the functional colors
  // (shown in FUNCTIONAL_COLORS instead) are deliberately excluded.
  // Renamed to Primitives.tsx when the samples area split into Primitives +
  // Advanced/Composite (see docs/architecture/ui.md), then moved to
  // platform/src/samples/ by the framework/app split — a stale path here reads
  // as an empty string, which empties swatchTokens and makes this pass warn
  // about every single role. The drift-checker had exactly this drift twice
  // already (ComponentLibrary.tsx -> sample/ComponentLibrary.tsx, then
  // src/pages/sample/ -> platform/src/samples/); don't let it happen a third
  // time on the next rename or move.
  const componentLibraryPath = path.join(
    root,
    "platform/src/samples/Primitives.tsx",
  );
  const componentLibrary = read(componentLibraryPath) ?? "";
  const swatchesStart = componentLibrary.indexOf(
    "const SEMANTIC_ROLE_SWATCHES = [",
  );
  const swatchesEnd = componentLibrary.indexOf("];", swatchesStart);
  const swatchesBlock =
    swatchesStart === -1
      ? ""
      : componentLibrary.slice(swatchesStart, swatchesEnd);
  const swatchTokens = new Set([
    ...[...swatchesBlock.matchAll(/bg:\s*"bg-([a-z-]+)"/g)].map((m) => m[1]),
    ...[...swatchesBlock.matchAll(/varName:\s*"--([a-z-]+)"/g)].map(
      (m) => m[1],
    ),
  ]);
  const FUNCTIONAL_ROLES = new Set(["success", "warning", "error", "info"]);

  for (const role of roles) {
    if (role.startsWith("on-") || FUNCTIONAL_ROLES.has(role)) continue;
    const resolvedDirectly = definedThemeNames.has(role);
    const destinations = roleToDestinations.get(role) ?? [];
    const resolvedViaMapping = destinations.some((d) =>
      definedThemeNames.has(d),
    );
    if (!resolvedDirectly && !resolvedViaMapping) continue; // already warned above

    const hasSwatch =
      swatchTokens.has(role) || destinations.some((d) => swatchTokens.has(d));
    if (!hasSwatch) {
      warn(
        `DESIGN.md role --color-${role} resolves to a real token but has no swatch in ` +
          `platform/src/samples/Primitives.tsx's SEMANTIC_ROLE_SWATCHES — add one`,
      );
    }
  }
}

// --- Check 7: every template registry entry resolves to real code and a real route ---
// A gallery entry pointing at a missing shell or an unregistered preview route is
// the failure that would make the whole registry untrustworthy: the user picks a
// look, and nothing is there.
{
  const registry = read(path.join(root, "platform/src/templates/registry.ts"));
  if (registry) {
    const routeFiles = [
      ...walk(path.join(root, "src/routes/modules"), [".routes.tsx"]),
      ...walk(path.join(root, "platform/src/routes/modules"), [".routes.tsx"]),
    ];
    const registeredPaths = new Set(
      routeFiles.flatMap((f) =>
        [...(read(f) ?? "").matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]),
      ),
    );

    const entryPattern =
      /\{\s*id:\s*"([^"]+)"[\s\S]*?previewRoute:\s*"([^"]+)"/g;
    const entries = [...registry.matchAll(entryPattern)];

    if (entries.length === 0) {
      warn(
        "platform/src/templates/registry.ts exists but no entries could be parsed — the " +
          "TEMPLATES literal shape changed and gen-arch-docs.mjs will be silently empty too",
      );
    }

    for (const match of entries) {
      const [block, id, previewRoute] = match;

      if (!registeredPaths.has(previewRoute)) {
        warn(
          `template "${id}" has previewRoute ${previewRoute}, which is not registered in ` +
            `any src/routes/modules/*.routes.tsx or platform/src/routes/modules/*.routes.tsx — ` +
            `the gallery link would 404`,
        );
      }

      const shell = block.match(/shell:\s*"([^"]+)"/)?.[1];
      if (!shell) {
        warn(`template "${id}" has no shell path`);
        continue;
      }
      // A shell path is either "@/..." (app-owned, resolves under src/) or "@framework/..."
      // (framework-owned, resolves under platform/src/) — templates themselves are always the
      // latter today, but this stays generic rather than assuming.
      const shellRelative = shell.startsWith("@framework/")
        ? shell.replace(/^@framework\//, "platform/src/")
        : shell.replace(/^@\//, "src/");
      const shellFile = path.join(root, shellRelative + ".tsx");
      if (!read(shellFile)) {
        warn(
          `template "${id}" names shell ${shell}, but ${path
            .relative(root, shellFile)
            .split(path.sep)
            .join("/")} does not exist`,
        );
      }
    }
  }
}

// --- Check 7: backticked directory/file paths in the agent-facing docs resolve ---
// Check 1 covers `*.md` references only. That left every *directory* reference unchecked, which is
// how phase 2's codemod put 35 references to `platform/platform/src/...` — a path that has never
// existed — into CLAUDE.md and four of the five .claude/rules/* files, including the frontmatter
// globs declaring which files each rule governs, and nothing noticed for three phases. These are
// precisely the files an agent reads to decide where code goes and which component to reuse, so a
// wrong path is worse than a missing doc.
{
  const sources = [
    ...walk(path.join(root, ".claude"), [".md"], VENDORED_SKILLS),
    path.join(root, "CLAUDE.md"),
  ];
  // Anchored on both backticks, and the character class excludes < > * { } — so placeholder
  // spellings the docs use deliberately (`src/services/<domain>.ts`,
  // `src/components/<PageName>/`, `platform/src/components/ui/**`) fail to match at all rather
  // than needing to be special-cased.
  const pathRefPattern =
    /`((?:src|platform|docs|\.claude)\/[A-Za-z0-9_./-]*)`/g;
  const seen = new Set();
  for (const file of sources) {
    const content = read(file);
    if (!content) continue;
    for (const match of content.matchAll(pathRefPattern)) {
      const ref = match[1];
      // Check 1 owns *.md, and resolves bare names against .claude/rules/ — don't double-report.
      if (ref.endsWith(".md")) continue;
      if (isConditionalPlanPath(ref)) continue;
      if (isCreatedOnDemand(ref)) continue;
      const key = `${file}::${ref}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (statInfo(path.join(root, ref))) continue;
      // A `src/X` that resolves at `platform/src/X` is a stale PRE-SPLIT path, not a broken one:
      // phase 2 moved the file and updated code imports, but ~60 doc references still name the old
      // location. That class is deliberately NOT reported here, because it cannot be judged
      // mechanically — `src/services/` is *correctly* the app's own service directory while
      // `src/services/menu.ts` is the framework's, and the two spellings are indistinguishable to a
      // regex. Fixing them needs a per-reference judgement pass; see docs/DECISIONS.md.
      if (statInfo(path.join(root, "platform", ref))) continue;
      warn(
        `${path.relative(root, file).split(path.sep).join("/")}: references \`${ref}\`, ` +
          `which exists nowhere (not at that path, not under platform/)`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Check: DESIGN.md §3's type scale is actually reachable as a Tailwind utility.
//
// Added because it wasn't, for a long time, while tailwind.md §5 asserted it was ("It is now real
// tokens … so `text-title-lg` is a real Tailwind utility"). Every `--type-*` row in §3 was missing
// both its `theme.css` value and its `@theme inline` passthrough, so `text-headline-lg` and friends
// resolved to nothing and silently inherited their parent's size — seven rows of the Primitives
// type-scale sample and calendar.tsx's day labels all rendered at 14px.
//
// The existing colour-role check (above) would have caught the equivalent for §2.3–§2.5, which is
// exactly why the colour roles have never drifted this way and the type scale did. Same shape,
// applied to §3.
{
  const themeBlock = readThemeInlineBlock();
  const designMd = read(path.join(root, "DESIGN.md")) ?? "";
  for (const line of designMd.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const m = line.match(/--type-([a-z0-9-]+)/);
    if (!m) continue;
    const role = m[1];
    // body-emphasis inherits its size by definition — DESIGN.md says so, and there is no token.
    if (role === "body-emphasis") continue;
    if (!themeBlock.includes(`--text-${role}:`)) {
      warn(
        `DESIGN.md §3 defines type role --type-${role}, but --text-${role} has no passthrough in ` +
          `the framework CSS's @theme inline block — Tailwind emits no utility for a theme key it ` +
          `cannot see, so \`text-${role}\` would silently inherit its parent's size`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Check: app.json's homeIcon resolves to a real icon.
//
// MENU_ICON_MAP's keys are lucide-era names mapped onto Phosphor components, so the navbar's home
// icon is configured as "Home" while the component it renders is PiHouse. A developer reading
// phosphoricons.com writes "PiHouse", MenuIcon falls back to a generic circle, and nothing says
// why. MenuIcon warns in dev; this catches it in CI, where nobody is watching a console.
{
  const appJson = read(path.join(root, "public/config/app.json"));
  const menuIconSrc = read(
    path.join(root, "platform/src/app/layout/MenuIcon.tsx"),
  );
  if (appJson && menuIconSrc) {
    let homeIcon;
    try {
      homeIcon = JSON.parse(appJson)?.app?.homeIcon;
    } catch {
      warn("public/config/app.json is not valid JSON");
    }
    // Keys of the `const MENU_ICON_MAP: Record<string, IconType> = { … }` object literal.
    const mapBody = menuIconSrc.slice(
      menuIconSrc.indexOf("MENU_ICON_MAP"),
      menuIconSrc.indexOf("export function MenuIcon"),
    );
    const keys = [...mapBody.matchAll(/^ {2}([A-Za-z0-9]+):/gm)].map(
      (m) => m[1],
    );
    if (!keys.length) {
      warn(
        "docs:check could not read MENU_ICON_MAP's keys out of MenuIcon.tsx, so the homeIcon " +
          "check is silently passing everything - fix the parse rather than deleting the check",
      );
    } else if (homeIcon === undefined) {
      warn(
        "public/config/app.json has no app.homeIcon, so the navbar's leading home icon falls " +
          "back to appConfig.ts's default rather than being configured per portal",
      );
    } else if (!keys.includes(homeIcon)) {
      warn(
        `public/config/app.json's app.homeIcon is "${homeIcon}", which is not a key of ` +
          `MENU_ICON_MAP (platform/src/app/layout/MenuIcon.tsx) - the navbar renders the generic ` +
          `fallback icon. Legal values are that map's keys, e.g. "Home", not the Phosphor ` +
          `component name "PiHouse"`,
      );
    }
  }
}

// --- Check: every sample registry entry resolves to a real route and a real template ---
// The sample registry is the vocabulary a prompter uses ("build it like Form Page Internal"), so an
// entry pointing at an unregistered route sends someone to a 404 while claiming to be a reference,
// and one naming a template that no longer exists teaches a build to compose from nothing. Same
// shape as the template check above, because the same failure mode applies one layer up.
{
  const registry = read(path.join(root, "platform/src/samples/registry.ts"));
  if (registry) {
    const routeFiles = [
      ...walk(path.join(root, "src/routes/modules"), [".routes.tsx"]),
      ...walk(path.join(root, "platform/src/routes/modules"), [".routes.tsx"]),
    ];
    const registeredPaths = new Set(
      routeFiles.flatMap((f) =>
        [...(read(f) ?? "").matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]),
      ),
    );

    const templateRegistry =
      read(path.join(root, "platform/src/templates/registry.ts")) ?? "";
    const templateIds = new Set(
      [...templateRegistry.matchAll(/\{\s*id:\s*"([^"]+)"/g)].map((m) => m[1]),
    );

    const entries = [
      ...registry.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?route:\s*"([^"]+)"/g),
    ];

    if (entries.length === 0) {
      warn(
        "platform/src/samples/registry.ts exists but no entries could be parsed — the SAMPLES " +
          "literal shape changed, and every check below is silently passing nothing",
      );
    }

    for (const [block, id, route] of entries) {
      if (!registeredPaths.has(route)) {
        warn(
          `sample "${id}" has route ${route}, which is not registered in any ` +
            `src/routes/modules/*.routes.tsx or platform/src/routes/modules/*.routes.tsx — the ` +
            `gallery link would 404`,
        );
      }

      const template = block.match(/template:\s*"([^"]+)"/)?.[1];
      if (template && !templateIds.has(template)) {
        warn(
          `sample "${id}" names template "${template}", which is not an id in ` +
            `platform/src/templates/registry.ts`,
        );
      }

      const variantOf = block.match(/variantOf:\s*"([^"]+)"/)?.[1];
      if (variantOf && !entries.some(([, otherId]) => otherId === variantOf)) {
        warn(
          `sample "${id}" is variantOf "${variantOf}", which is not an id in the sample registry`,
        );
      }
    }
  }
}

if (warnings.length) {
  console.warn(`docs:check — ${warnings.length} issue(s) found:\n`);
  for (const w of warnings) console.warn(`  - ${w}`);
} else {
  console.log("docs:check — no issues found");
}
// Warning-only: always exit 0, never blocks CI.
process.exit(0);
