// local/require-unsaved-guard
//
// A form inside a Dialog or Sheet must go through `useUnsavedChangesGuard`, because every dismissal
// route those containers offer — backdrop, Esc, the X, a Cancel in DialogClose — throws the typed
// values away without asking. DESIGN.md §6 allowed forms in modals as of 2026-08-24; this rule is
// what keeps that from being a data-loss footgun.
//
// Why a lint rule rather than only a skill instruction: prose persuades an agent that read it, and
// nothing else. This blocks CI, applies to human-written code too, and — because
// platform/config/eslint.base.js is framework-owned — reaches every portal without them opting in.

import {
  OVERLAY_COMPONENTS,
  FIELD_COMPONENTS,
  isFormComponentName,
  GUARD_HOOK,
} from "./unsaved-guard-shared.js";

/** JSX element name as written, or null for anything non-trivial (member/namespaced). */
const elementName = (node) => {
  const n = node?.openingElement?.name;
  return n?.type === "JSXIdentifier" ? n.name : null;
};

/** Depth-first search of a JSX subtree for the first thing that means "data entry". */
const findDataEntry = (node) => {
  const children = node.children ?? [];
  for (const child of children) {
    if (child.type === "JSXElement") {
      const name = elementName(child);
      if (name && (FIELD_COMPONENTS.has(name) || isFormComponentName(name))) {
        return name;
      }
      const nested = findDataEntry(child);
      if (nested) return nested;
    } else if (child.type === "JSXExpressionContainer") {
      // Covers `{items.map(() => <Input/>)}` and conditional renders, which are common enough in
      // real forms that skipping them would make the rule easy to sidestep by accident.
      const found = findInExpression(child.expression);
      if (found) return found;
    }
  }
  return null;
};

const findInExpression = (node) => {
  if (!node || typeof node !== "object") return null;
  if (node.type === "JSXElement") {
    const name = elementName(node);
    if (name && (FIELD_COMPONENTS.has(name) || isFormComponentName(name))) {
      return name;
    }
    return findDataEntry(node);
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findInExpression(item);
        if (found) return found;
      }
    } else if (value && typeof value === "object" && value.type) {
      const found = findInExpression(value);
      if (found) return found;
    }
  }
  return null;
};

export const requireUnsavedGuard = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require useUnsavedChangesGuard for a form rendered inside a Dialog or Sheet",
    },
    schema: [],
    messages: {
      missing:
        "<{{container}}> contains data entry ({{found}}) but this file never calls {{hook}}, so " +
        "closing it discards the input silently. Wire it up: `const guard = {{hook}}({ when: " +
        "form.formState.isDirty })`, pass `guard.guardOpenChange(setOpen)` as onOpenChange, and " +
        "render <UnsavedChangesDialog guard={guard} />. If losing the input is fine here, add an " +
        "eslint-disable-next-line for this rule so the exception is visible.",
    },
  },
  create(context) {
    // File-level, not scope-level: the hook is almost always called in the page component while
    // the JSX sits further down, and a page may legitimately guard several dialogs with one call.
    const source = context.sourceCode ?? context.getSourceCode();
    const callsGuard = source.getText().includes(GUARD_HOOK);
    if (callsGuard) return {};

    return {
      JSXElement(node) {
        const container = elementName(node);
        if (!container || !OVERLAY_COMPONENTS.has(container)) return;
        const found = findDataEntry(node);
        if (!found) return;
        context.report({
          node: node.openingElement,
          messageId: "missing",
          data: { container, found: `<${found}>`, hook: GUARD_HOOK },
        });
      },
    };
  },
};

export const unsavedGuardRules = {
  "require-unsaved-guard": requireUnsavedGuard,
};
