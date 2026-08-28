// Framework-owned ESLint base. The root eslint.config.js is a thin app-owned file that spreads
// this array — so a portal can add its own rules without ever editing (or conflicting with) the
// framework's layering and design-token enforcement. See platform/framework.json.
//
// Read-only in a portal repo: `npm run framework:verify` rejects edits here. A rule that should
// apply to every portal belongs upstream, in this file.
//
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { designTokenRules } from "../scripts/eslint-rules/design-tokens.js";
import { unsavedGuardRules } from "../scripts/eslint-rules/unsaved-guard.js";
import { noDirectToastRules } from "../scripts/eslint-rules/no-direct-toast.js";
import { noInlineEditInColumnRules } from "../scripts/eslint-rules/no-inline-edit-in-column.js";

export const frameworkConfig = tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Legacy date-format library predating this repo's typed conventions —
    // format-options values are genuinely dynamic. Not part of today's scope.
    files: ["platform/src/lib/dateTimeUtils.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // Two roots: an app's own hooks under src/hooks/<domain>/, and the framework's own hooks
    // now under platform/src/hooks/**. Both are bound by the same rule.
    files: ["src/hooks/**/*.{ts,tsx}", "platform/src/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@framework/integrations/supabase/client",
              message:
                "Hooks never call Supabase directly — add a function to src/services/<domain>.ts instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // Two roots — see the hooks block above for why.
    files: [
      "src/services/**/*.{ts,tsx}",
      "platform/src/services/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "Services never import React or use hooks.",
            },
            {
              name: "@tanstack/react-query",
              message:
                "Services never import TanStack Query — that belongs in src/hooks/<domain>/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Layering rules (.claude/rules/architecture-rules.md): Pages -> Hooks -> Services -> Supabase,
    // and Base UI only through the UI library. Machine-checked instead of relying on every
    // agent session remembering the rule. Pages AND page-scoped components share both
    // restrictions (components-rules.md: page-scoped components don't fetch data either) — kept
    // in one config object because ESLint flat config REPLACES, not merges, a rule's options when
    // two config objects target the same file.
    //
    // THE INVARIANT THAT KEEPS ALL OF THESE ALIVE: one rule name per concern. This block and the
    // two above it set `no-restricted-imports`, and they survive together only because their globs
    // are mutually disjoint (hooks / services / pages+components+templates+samples). Never add a
    // fourth config object setting `no-restricted-imports` whose glob overlaps any of them — the
    // later object wins outright and the earlier bans vanish with no warning, which is exactly what
    // happened when the DataTable block below used this same rule name against `src/**`. It silently
    // killed all three for months. If a new restriction needs a glob that overlaps, either fold it
    // into the block it overlaps or give it its own rule name, the way that block now does.
    files: [
      "src/pages/**/*.{ts,tsx}",
      "platform/src/pages/**/*.{ts,tsx}",
      "platform/src/samples/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "platform/src/components/**/*.{ts,tsx}",
      // Templates own a page's frame and nothing else — no data, no Base UI. Framework-owned,
      // no app-side equivalent path exists. Without this glob they'd be the one hole in the
      // layering rule.
      "platform/src/templates/**/*.{ts,tsx}",
    ],
    ignores: ["src/components/ui/**", "platform/src/components/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@tanstack/react-query",
              message:
                "Pages, page-scoped components and templates never import TanStack Query directly — call a hook in src/hooks/<domain>/ instead.",
            },
          ],
          patterns: [
            {
              group: ["@base-ui/react", "@base-ui/react/*"],
              message:
                "Import Base UI only through the UI library (`@framework/components/ui/*`) — never directly from page/feature code.",
            },
          ],
        },
      ],
    },
  },
  {
    // The DataTable seam (docs/architecture/datatable.md). Pages speak
    // DataTableColumn/TableSort/T[]; only DataTable.tsx knows the table library
    // exists. Without this the guarantee that a TanStack major upgrade is a
    // single-file change erodes on the first page that wants one more column
    // feature.
    //
    // Deliberately on `@typescript-eslint/no-restricted-imports`, NOT the core rule. This is the
    // one restriction that applies to *every* file rather than to one layer, so its glob overlaps
    // all three per-layer blocks above — and on the core rule name that made it replace their
    // options wholesale, silently disabling the Base UI ban, the react-query bans and the
    // hooks->Supabase ban (verified with `eslint --print-config`: pages, hooks, services and
    // components were all left with this pattern as their only restriction). Two distinct rule
    // names cannot clobber each other, which is the same technique the three `local/*` token rules
    // below use.
    //
    // The core rule is deliberately NOT set to "off" here, despite that being the usual convention
    // when adopting a typescript-eslint extension rule — both must stay live. They are independent
    // rules over disjoint import sets, so nothing double-reports.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    ignores: [
      "src/components/ui/datatable/**",
      "platform/src/components/ui/datatable/**",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@tanstack/react-table", "@tanstack/table-core"],
              message:
                "Only platform/src/components/ui/datatable/ may import the table library — use DataTable and the types in `@framework/types` (table.ts) instead.",
            },
          ],
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Design-token discipline (scripts/eslint-rules/design-tokens.js).
  //
  // DESIGN.md's visual vocabulary was prose-only until now: 18 machine-checkable
  // rules across DESIGN.md, CLAUDE.md and .claude/rules/*, none enforced. These
  // three rules move the checkable ones from "the agent must remember" to "it
  // errors" — which is what makes the output predictable without pretending the
  // model is deterministic.
  //
  // Three distinct rule names rather than one rule with per-scope options,
  // because each needs a different `ignores` glob and flat config REPLACES
  // rather than merges a rule's options across matching entries (same trap
  // documented above for no-restricted-imports).
  //
  // The plugin is registered in its own entry because a plugin key may only be
  // defined ONCE across entries that match the same file — repeating
  // `plugins: { local }` on each of the three below is a hard
  // "Cannot redefine plugin" config error.
  // -------------------------------------------------------------------------
  {
    plugins: {
      local: {
        rules: {
          ...designTokenRules,
          ...unsavedGuardRules,
          ...noDirectToastRules,
          ...noInlineEditInColumnRules,
        },
      },
    },
  },
  {
    // Colors: no exemptions. No file has a legitimate reason to hardcode one.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    rules: { "local/no-raw-colors": "error" },
  },
  {
    // Spacing: components/ui/** is exempt (both roots — see below for why an app-side one is
    // listed at all). Those primitives *implement* the design system and are pixel-tuned to Base
    // UI internals (an 18.4px switch track, a -10px hover bridge); everything above them only
    // *consumes* the scale. Same layering logic as the Base UI import ban above, which uses this
    // identical ignore.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**", "platform/src/components/ui/**"],
    rules: { "local/no-off-scale-spacing": "error" },
  },
  {
    // Inline style: banned outright per CLAUDE.md, with four named exceptions, all
    // framework-owned code post-move. Each is a real, non-color dynamic value that cannot be a
    // static class: designer-reference ramp swatches (the one sanctioned inline-style use in
    // .claude/rules/index-css-rules.md), per-item skeleton widths, a --gap custom property set
    // from a prop, and DataTable's per-column pixel width (ColumnBase.width) — the same "genuinely
    // dynamic, not a color" category as Navbar's skeleton widths.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    ignores: [
      "platform/src/samples/Primitives.tsx",
      "platform/src/app/layout/Navbar.tsx",
      "platform/src/components/ui/toggle-group.tsx",
      "platform/src/components/ui/datatable/DataTable.tsx",
    ],
    rules: { "local/no-inline-style": "error" },
  },
  {
    // Bare anchors: components/ui/** is exempt (both roots) — those primitives *implement*
    // the design system's Button/Link pattern (pagination.tsx renders an <a> as
    // the thing Button's `render` prop points at); everything above them only
    // *consumes* it, and should go through Button + router Link instead.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**", "platform/src/components/ui/**"],
    rules: { "local/no-raw-anchor": "error" },
  },
  {
    // Unsaved-changes guard: a form inside a Dialog/Sheet must call useUnsavedChangesGuard, since
    // every dismissal route those containers offer discards the input without asking. DESIGN.md §6
    // started allowing forms in modals on 2026-08-24; this is what keeps that safe.
    //
    // components/ui/** is exempt (both roots), same carve-out as the two rules above and for the
    // same layering reason — and concretely because FilterSheet.tsx is a Sheet full of fields that
    // must never prompt: it is draft-then-apply, so discarding IS what closing it means.
    // samples/ is exempt too — Primitives.tsx demonstrates both the guarded and unguarded shapes
    // on purpose.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    ignores: [
      "src/components/ui/**",
      "platform/src/components/ui/**",
      "platform/src/samples/**",
    ],
    rules: { "local/require-unsaved-guard": "error" },
  },
  {
    // Toasts go through @framework/components/ui/toast, never `sonner` directly — the wrapper
    // renders a custom toast styled from this repo's tokens (DESIGN.md §6). The two exempt files
    // are handled inside the rule rather than by an `ignores` glob, so the exemption list lives
    // next to the reason for it.
    //
    // A DISTINCT RULE NAME, not a fourth `no-restricted-imports` block. This ban's glob overlaps
    // all three per-layer import blocks above, and flat config REPLACES a rule's options rather
    // than merging them — a fourth block on that name would silently delete their bans, which has
    // already happened once in this file. See the comment above the DataTable seam.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    rules: { "local/no-direct-toast": "error" },
  },
  {
    // Inline editors in table cells: `Select`/`Input`/`Checkbox`/etc. must not appear inside a
    // column's `accessor` or `renderExpanded` — editing an existing record belongs in a side
    // sheet. `Switch` and `Badge` are allowed by omission from the rule's own banned set, which is
    // why platform/src/samples/samples/ScopedListPage.tsx's row-level Switch needs no exemption
    // here.
    //
    // components/ui/** is exempt (both roots), same carve-out as several rules above — belt and
    // braces rather than load-bearing, since DataTable.tsx's own selection Checkbox is rendered
    // directly in its JSX, not inside an `accessor`/`renderExpanded` binding, so it would not trip
    // this rule regardless.
    files: ["src/**/*.{ts,tsx}", "platform/src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**", "platform/src/components/ui/**"],
    rules: { "local/no-inline-edit-in-column": "error" },
  },
);
