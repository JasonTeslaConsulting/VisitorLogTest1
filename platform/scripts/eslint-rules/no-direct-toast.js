// local/no-direct-toast
//
// Toasts render through `@framework/components/ui/toast`, which wraps sonner's `toast.custom` so
// the styling comes from this repo's tokens instead of sonner's `richColors` palette (DESIGN.md §6,
// tailwind.md §7). A direct `sonner` import bypasses that and produces a toast that looks nothing
// like the rest of the app — coloured fill, wrong icons, wrong text colours.
//
// WHY THIS IS A CUSTOM RULE AND NOT A `no-restricted-imports` ENTRY. The ban applies to essentially
// every file, so its glob overlaps all three per-layer import blocks in
// platform/config/eslint.base.js. That file carries an explicit warning about adding a fourth
// overlapping config object on the same rule name: flat config REPLACES a rule's options rather
// than merging them, so the later object wins outright and the earlier bans vanish silently — which
// already happened once here and disabled three layering rules for months. `no-restricted-imports`
// and `@typescript-eslint/no-restricted-imports` are both already spoken for, so this needs a third
// distinct rule name. Same technique the `local/*` token rules use.

const ALLOWED = [
  // The Toaster container itself — it *is* the sonner integration.
  "components/ui/sonner.tsx",
  // The wrapper every other file is required to use.
  "components/ui/toast.tsx",
];

const isAllowed = (filePath) => {
  const normalized = String(filePath ?? "").replace(/\\/g, "/");
  return ALLOWED.some((suffix) => normalized.endsWith(suffix));
};

export const noDirectToast = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Import toast from @framework/components/ui/toast, never from sonner directly",
    },
    schema: [],
    messages: {
      direct:
        "Import `toast` from `@framework/components/ui/toast`, not from `sonner`. The wrapper " +
        "renders a custom toast styled with this repo's tokens (DESIGN.md §6); importing sonner " +
        "directly gets sonner's own coloured-fill palette instead. Same call shape — " +
        "`toast.success(message, { description })`.",
    },
  },
  create(context) {
    if (isAllowed(context.filename ?? context.getFilename())) return {};
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "sonner") return;
        context.report({ node, messageId: "direct" });
      },
    };
  },
};

export const noDirectToastRules = {
  "no-direct-toast": noDirectToast,
};
