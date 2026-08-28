// local/no-inline-edit-in-column
//
// A DataTable cell renders data; it is not a form. `accessor` and `renderExpanded` run for every
// row of every page, so an editor mounted inside one multiplies uncontrolled inputs by the page
// size: the value has nowhere to live, nothing validates it, nothing saves it, and Escape/blur
// inside a cell fights the table's own keyboard handling. Editing an existing record belongs in a
// side sheet (DESIGN.md § Container types → Side sheet), which is what
// `.claude/skills/build-datatable/SKILL.md` § Columns already prescribes in prose — this is that
// rule enforced rather than merely written down.
//
// `Switch` and `Badge` are deliberately ALLOWED (absent from the banned set below). A row-level
// Switch is an immediate, single-value toggle with no Save button — DESIGN.md § Selection controls
// defines a Switch as exactly that ("takes effect immediately... no Save step"), which is why it,
// and only it, is exempt from this rule. Its handler is closed over from a hook called in the PAGE,
// so the accessor itself stays a pure function of the row — see
// platform/src/samples/samples/ScopedListPage.tsx. A Badge is display, not entry.
//
// Why a lint rule and not more prose: the ban binds only an agent that happened to read the skill.
// This blocks CI, applies to human-written code, and — because platform/config/eslint.base.js is
// framework-owned — reaches every portal without them opting in. Same technique as
// local/no-direct-toast and the local/* token rules.
//
// A DISTINCT RULE NAME with its own config block. Never fold this into an existing `local/*` rule
// or a `no-restricted-*` block: flat config REPLACES rather than merges a rule's options across
// matching entries, and this rule's glob overlaps several — see the warnings in eslint.base.js.

/** Data-entry primitives that must not appear in a cell. */
const BANNED = new Set([
  "Select",
  "SelectTrigger",
  "Combobox",
  "MultiSelect",
  "Input",
  "Textarea",
  "Checkbox",
  "RadioGroup",
  "DatePicker",
  "DateTimePicker",
  "TimePicker",
]);

/** Bindings whose value renders one table cell or one expansion panel. */
const CELL_PROPS = new Set(["accessor", "renderExpanded"]);

/** Property / JSXAttribute key as written, or null for a computed or non-identifier key. */
const bindingName = (node) => {
  if (node.type === "Property") {
    if (node.computed) return null;
    if (node.key.type === "Identifier") return node.key.name;
    if (node.key.type === "Literal") return String(node.key.value);
    return null;
  }
  if (node.type === "JSXAttribute") {
    return node.name.type === "JSXIdentifier" ? node.name.name : null;
  }
  return null;
};

/**
 * Name of the nearest enclosing `accessor:` / `renderExpanded=` binding, or null.
 *
 * Walks ancestors rather than matching a fixed shape (Property -> ArrowFunctionExpression -> JSX),
 * so every wrapper in between is covered: a useMemo/useCallback around the function, a `.map()`
 * inside it, a conditional, a fragment. It also covers `renderExpanded`, which is a JSX prop on
 * `<DataTable>` and therefore a JSXAttribute (arrow -> JSXExpressionContainer -> JSXAttribute), not
 * an object Property — a Property-only visitor would miss that half of the rule entirely.
 *
 * Returning on the FIRST match walking outward attributes a nested DataTable's own `accessor`
 * inside a `renderExpanded` to the inner binding, which is the one the author is looking at.
 *
 * Known blind spot, deliberately not patched: a cell renderer hoisted to its own variable
 * (`const statusCell = (row) => <Select/>`) has no `accessor`/`renderExpanded` in its own ancestor
 * chain and is missed. A name heuristic (`*Cell`) would fire on unrelated code, which is worse than
 * the gap — this is covered by prose in build-datatable/SKILL.md instead.
 */
const enclosingCellBinding = (ancestors, node) => {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const parent = ancestors[i];
    const child = i + 1 < ancestors.length ? ancestors[i + 1] : node;
    if (
      (parent.type === "Property" || parent.type === "JSXAttribute") &&
      parent.value === child
    ) {
      const name = bindingName(parent);
      if (name && CELL_PROPS.has(name)) return name;
    }
  }
  return null;
};

export const noInlineEditInColumn = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A DataTable cell renders data — form controls belong in a side sheet, not in `accessor` or `renderExpanded`.",
    },
    schema: [],
    messages: {
      inlineEdit:
        "`<{{name}}>` inside `{{binding}}` — a DataTable cell renders data, it is not a form.\n" +
        "  This mounts one control per row per page: the value has nowhere to live, nothing " +
        "validates it, and nothing saves it.\n" +
        "  Edit an existing record in a side sheet instead (DESIGN.md § Container types), opened " +
        "from a row action:\n" +
        '    actions={(row) => [{ label: "Edit", icon: PiPencilSimple, onClick: () => openEdit(row) }]}\n' +
        "  Need a declarative cell? Use the column's own `numeric` or `badge` format rather than " +
        "rendering a control.\n" +
        "  `Switch` and `Badge` ARE allowed here — an immediate single-value toggle (DESIGN.md " +
        "§ Tables) and a display chip.\n" +
        "  A toggle that calls a mutation is fine: call the hook in the PAGE and close the handler " +
        "over it, keeping the accessor a pure function of the row — see " +
        "platform/src/samples/samples/ScopedListPage.tsx.\n" +
        "  See `.claude/skills/build-datatable/SKILL.md` § Columns.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    return {
      JSXOpeningElement(node) {
        // JSXIdentifier only. `<Form.Input/>` is a JSXMemberExpression and is deliberately not
        // matched — a namespaced field component is rare enough here that a false negative beats
        // the complexity of resolving it.
        if (node.name.type !== "JSXIdentifier") return;
        const name = node.name.name;
        if (!BANNED.has(name)) return;
        const ancestors = sourceCode.getAncestors
          ? sourceCode.getAncestors(node)
          : context.getAncestors();
        const binding = enclosingCellBinding(ancestors, node);
        if (!binding) return;
        context.report({
          node,
          messageId: "inlineEdit",
          data: { name, binding },
        });
      },
    };
  },
};

export const noInlineEditInColumnRules = {
  "no-inline-edit-in-column": noInlineEditInColumn,
};
