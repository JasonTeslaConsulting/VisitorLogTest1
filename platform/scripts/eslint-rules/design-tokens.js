/**
 * Local ESLint rules that make DESIGN.md's visual vocabulary mechanically
 * enforceable instead of prose an agent has to remember.
 *
 * Why these exist: when Claude builds something the framework didn't anticipate,
 * it falls back on its training prior — and in that prior `bg-blue-500`,
 * `text-gray-700` and `p-[13px]` are far more probable than `bg-primary`,
 * `text-muted-foreground` and the 4px scale. This repo's tokens are the
 * *low-probability* choice, so novel work is exactly where drift concentrates.
 * These rules shrink the legal output space so randomness inside it stops
 * producing visible inconsistency.
 *
 * Three separate rule names, not one rule with per-scope options: ESLint flat
 * config *replaces* rather than merges a rule's options when two config objects
 * match the same file (see the comment in eslint.config.js). Each of these needs
 * a different `ignores` glob, so they must not share a name.
 *
 * Deliberately dependency-free. `eslint-plugin-tailwindcss` is built around
 * statically reading a `tailwind.config.js` to learn the project's theme; this
 * repo is Tailwind v4 with CSS-only `@theme inline` and no config file at all.
 *
 * Every message enumerates the legal alternatives — the rule is a teaching
 * mechanism, not just a gate. An agent that hits one should be able to fix it
 * without opening another file.
 */

// ---------------------------------------------------------------------------
// Shared: extracting class-name text from every shape it hides in
// ---------------------------------------------------------------------------

/**
 * Collects [node, text] pairs for every string that can end up as a class name.
 *
 * The non-obvious case is `cva()`: most class strings in platform/src/components/ui/*.tsx
 * live inside `cva(base, { variants: { variant: { default: "..." } } })` — a
 * plain object literal, neither a `className` attribute nor a `cn()` argument. A
 * visitor that only handles those two misses that entire surface, which is
 * precisely where CLAUDE.md warns drift reappears (`npx shadcn add --overwrite`
 * resets a primitive and customizations get reapplied by hand).
 */
function collectStrings(node, out) {
  if (!node) return;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") out.push([node, node.value]);
      break;
    case "TemplateLiteral":
      for (const quasi of node.quasis) out.push([quasi, quasi.value.raw]);
      break;
    case "JSXExpressionContainer":
      collectStrings(node.expression, out);
      break;
    case "ConditionalExpression":
      collectStrings(node.consequent, out);
      collectStrings(node.alternate, out);
      break;
    case "LogicalExpression":
      collectStrings(node.left, out);
      collectStrings(node.right, out);
      break;
    case "ArrayExpression":
      for (const el of node.elements) collectStrings(el, out);
      break;
    case "ObjectExpression":
      for (const prop of node.properties) {
        if (prop.type === "Property") collectStrings(prop.value, out);
      }
      break;
    case "CallExpression":
      for (const arg of node.arguments) collectStrings(arg, out);
      break;
    default:
      break;
  }
}

const CLASS_FNS = new Set(["cn", "cva", "clsx", "twMerge"]);

const isClassFnCall = (node) =>
  node.callee.type === "Identifier" && CLASS_FNS.has(node.callee.name);

/** Visits every class-name string in a file, from both JSX and cn()/cva() calls. */
function classStringVisitor(check) {
  return {
    JSXAttribute(node) {
      if (node.name.name !== "className") return;
      const found = [];
      collectStrings(node.value, found);
      for (const [n, text] of found) check(n, text);
    },
    CallExpression(node) {
      if (!isClassFnCall(node)) return;
      const found = [];
      for (const arg of node.arguments) collectStrings(arg, found);
      for (const [n, text] of found) check(n, text);
    },
  };
}

// ---------------------------------------------------------------------------
// Rule: no-raw-colors
// ---------------------------------------------------------------------------

const HEX_RE = /#[0-9a-f]{3,8}\b/i;
const RAW_COLOR_FN_RE = /-\[\s*(?:rgb|rgba|hsl|hsla)\(/i;

const TAILWIND_PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|" +
  "teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_UTILITIES = "bg|text|border|ring|fill|stroke|from|via|to";
const PALETTE_RE = new RegExp(
  `\\b(?:${COLOR_UTILITIES})-(?:${TAILWIND_PALETTE})-(?:50|100|200|300|400|500|600|700|800|900|950)\\b`,
);

// `bg-black/<alpha>` is deliberately allowed: five files (MobileSidebar, dialog,
// alert-dialog, sheet, drawer) use it for overlay scrims and index.css's
// `@theme inline` defines NO overlay token to point them at. That is a real gap
// in DESIGN.md, not a lint-config detail — closing it means adding a token via
// the plan-design skill. The `(?!\/)` lookahead exempts the alpha form only;
// bare bg-white/bg-black/text-white/text-black stay banned since they all have
// token equivalents.
const BARE_BLACK_WHITE_RE = /\b(?:bg|text|border)-(?:white|black)\b(?!\/)/;

const TOKEN_CHEATSHEET = [
  "  Surfaces: bg-background bg-card bg-popover bg-muted bg-highlight",
  "  Brand:    bg-primary bg-primary-hover bg-secondary bg-secondary-hover bg-accent",
  "  Status:   bg-success bg-warning bg-info bg-destructive",
  "  Text:     text-foreground text-muted-foreground text-primary text-destructive",
  "  Lines:    border-border border-border-dark border-input ring-ring",
  "  Full list: docs/architecture/inventory.md § Design tokens · DESIGN.md §2.3",
].join("\n");

const noRawColors = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Colors must come from this repo's semantic tokens, never raw hex, Tailwind's default palette, or bare white/black.",
    },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      const hex = text.match(HEX_RE);
      if (hex) {
        context.report({
          node,
          message:
            `Raw hex color "${hex[0]}" in a class name. Use a semantic token instead.\n` +
            TOKEN_CHEATSHEET,
        });
      }
      if (RAW_COLOR_FN_RE.test(text)) {
        context.report({
          node,
          message:
            "rgb()/rgba()/hsl()/hsla() used as a Tailwind arbitrary value. Use a semantic token instead.\n" +
            TOKEN_CHEATSHEET,
        });
      }
      const palette = text.match(PALETTE_RE);
      if (palette) {
        context.report({
          node,
          message:
            `"${palette[0]}" is a Tailwind default-palette class, not a design token.\n` +
            TOKEN_CHEATSHEET,
        });
      }
      const bw = text.match(BARE_BLACK_WHITE_RE);
      if (bw) {
        context.report({
          node,
          message:
            `"${bw[0]}" hardcodes a color that won't follow the theme (DESIGN.md §2.6).\n` +
            "  bg-white  -> bg-background or bg-card\n" +
            "  text-white -> text-primary-foreground (on a filled button) or text-background\n" +
            "  text-black -> text-foreground\n" +
            "  An overlay scrim is the one exception and needs the alpha form: bg-black/10.\n" +
            TOKEN_CHEATSHEET,
        });
      }
    };
    return classStringVisitor(check);
  },
};

// ---------------------------------------------------------------------------
// Rule: no-off-scale-spacing
// ---------------------------------------------------------------------------

// Only utilities whose value IS a length. `grid-cols-[...]`, `ring-[3px]` and
// `text-[22px]` are deliberately absent: grid tracks legitimately need arbitrary
// values (see CardGridTemplate/SplitCardTemplate), and typography/ring widths are
// governed by DESIGN.md §3/§6 rather than the spacing scale.
const SPACING_UTILITIES = [
  "min-w",
  "min-h",
  "max-w",
  "max-h",
  "space-x",
  "space-y",
  "inset-x",
  "inset-y",
  "gap-x",
  "gap-y",
  "pt",
  "pr",
  "pb",
  "pl",
  "px",
  "py",
  "mt",
  "mr",
  "mb",
  "ml",
  "mx",
  "my",
  "gap",
  "inset",
  "top",
  "right",
  "bottom",
  "left",
  "size",
  "p",
  "m",
  "w",
  "h",
];

// The leading boundary includes `-` so Tailwind's negative shorthand
// (`-mt-[7px]`) is still caught. Bracket-only by design: Tailwind v4's CSS-var
// shorthand `max-w-(--container-max)` uses parentheses and is already in use
// (min-w-(--cell-size), max-w-(--available-width)), so it's structurally exempt.
const SPACING_ARBITRARY_RE = new RegExp(
  `(?:^|[\\s"'\`:-])(${SPACING_UTILITIES.join("|")})-\\[(-?[\\d.]+)(px|rem|em)\\]`,
  "g",
);

const SCALE_HINT =
  "  Scale: 1 2 3 4 6 8 12 16  =  4 8 12 16 24 32 48 64px  (add-ui-component/SKILL.md)\n" +
  "  On-scale arbitrary values are fine — max-h-[300px] passes. Only off-scale numbers are flagged.\n" +
  "  For a container width driven by a token, use the CSS-var form: max-w-(--container-max)";

const noOffScaleSpacing = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Spacing and sizing values must sit on the 4px base-unit scale (DESIGN.md §5).",
    },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      SPACING_ARBITRARY_RE.lastIndex = 0;
      let match;
      while ((match = SPACING_ARBITRARY_RE.exec(text)) !== null) {
        const [, utility, rawValue, unit] = match;
        // rem/em resolved against Tailwind's default 16px root.
        const px = unit === "px" ? Number(rawValue) : Number(rawValue) * 16;
        const remainder = ((px % 4) + 4) % 4;
        // Float tolerance so 0.25rem (4px) isn't flagged by binary rounding.
        if (remainder > 0.01 && remainder < 3.99) {
          context.report({
            node,
            message:
              `"${utility}-[${rawValue}${unit}]" is ${px}px — off the 4px spacing scale.\n` +
              SCALE_HINT,
          });
        }
      }
    };
    return classStringVisitor(check);
  },
};

// ---------------------------------------------------------------------------
// Rule: no-inline-style
// ---------------------------------------------------------------------------

const noInlineStyle = {
  meta: {
    type: "problem",
    docs: {
      description:
        "No inline style props — styling comes from token utility classes (CLAUDE.md Design System).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== "style") return;
        context.report({
          node,
          message:
            "Inline style={{}} is banned — use token utility classes instead.\n" +
            "  Four files are exempt, each for a named reason (see eslint.config.js):\n" +
            "    pages/sample/Primitives.tsx — live designer-reference ramp swatches\n" +
            "    app/layout/Navbar.tsx        — dynamic skeleton widths\n" +
            "    components/ui/toggle-group.tsx — sets a --gap custom property\n" +
            "    components/ui/datatable/DataTable.tsx — per-column pixel width\n" +
            "  If you need a genuinely dynamic value, set a CSS custom property and\n" +
            "  consume it with Tailwind's var shorthand, e.g. w-(--my-width).",
        });
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Rule: no-raw-anchor
// ---------------------------------------------------------------------------

/**
 * True for an `href` that's a same-page hash scroll (`#section-id`, including
 * `` `#${x}` ``) — a plain <a> is the correct, idiomatic tag there, since
 * there's no route to navigate and react-router's `Link` would add nothing.
 * Only the leading literal text matters: `#${x}` and `#static` both start
 * with a string quasi of "#", regardless of what the expression resolves to.
 */
function isHashOnlyHref(hrefValue) {
  if (!hrefValue) return false;
  if (hrefValue.type === "Literal") return String(hrefValue.value)[0] === "#";
  if (hrefValue.type === "JSXExpressionContainer") {
    const expr = hrefValue.expression;
    if (expr.type === "TemplateLiteral")
      return expr.quasis[0]?.value.raw[0] === "#";
    if (expr.type === "Literal") return String(expr.value)[0] === "#";
  }
  return false;
}

const noRawAnchor = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A link is a Button rendered as a router Link, not a bare <a> tag (components-rules.md).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "a")
          return;
        const hrefAttr = node.attributes.find(
          (a) => a.type === "JSXAttribute" && a.name.name === "href",
        );
        if (isHashOnlyHref(hrefAttr?.value)) return;
        context.report({
          node,
          message:
            "Bare <a> tag — use Button rendered as a router Link instead:\n" +
            '  <Button render={<Link to={…} />} nativeButton={false} variant="link">Label</Button>\n' +
            "  Pass a different variant when the link is a CTA or nav affordance, not prose.\n" +
            '  Same-page hash scroll (href="#section")? A bare <a> is correct — no Link needed.\n' +
            "  See components-rules.md's Button usage section.",
        });
      },
    };
  },
};

export const designTokenRules = {
  "no-raw-colors": noRawColors,
  "no-off-scale-spacing": noOffScaleSpacing,
  "no-inline-style": noInlineStyle,
  "no-raw-anchor": noRawAnchor,
};
