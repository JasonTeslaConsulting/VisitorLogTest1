/**
 * Template registry — one entry per shell in this folder.
 *
 * A template is defined by its **holes and props**, so an entry describes the
 * arrangement and nothing else. There is deliberately no entry named after a job:
 * "Form page" is not a template, it is one thing you can build with `single-card`
 * at `width: "narrow"`. That information lives in `commonlyUsedFor` as an example.
 *
 * `options` lists each arrangement prop's allowed values, first value first — the
 * gallery's live toolbar renders a toggle per key and treats the first value as
 * the default, so adding a value here adds a control with no page edit.
 *
 * A new shell is only justified when a design has a genuinely different set of
 * holes, or when its arrangement props cannot share a vocabulary with an existing
 * shell's. See the hole test in `docs/architecture/templates.md` and the recipe in
 * `.claude/skills/add-page-template/SKILL.md`.
 *
 * Pure data on purpose: `scripts/gen-arch-docs.mjs` scrapes this file to list
 * templates in the architecture inventory, and `scripts/docs-check.mjs` verifies
 * every `shell` and `previewRoute` resolves. Neither runs TypeScript.
 */

import type { TemplateEntry } from "@framework/types/templates";

export const TEMPLATES: TemplateEntry[] = [
  {
    id: "single-card",
    name: "Single card",
    description:
      "One card centred under the page header. `width` sets how far it spans and whether the header centres over it or aligns to its left edge.",
    holes: ["header", "children"],
    options: {
      width: ["narrow", "wide"],
      headerPlacement: ["above", "inside"],
    },
    commonlyUsedFor: [
      "Creating or editing one record (width: narrow)",
      "Finding and managing many records (width: wide)",
    ],
    shell: "@framework/templates/SingleCardTemplate",
    layout: "default",
    previewRoute: "/sample/templates/single-card",
  },
  {
    id: "split-card",
    name: "Split cards",
    description:
      "Two cards side by side, stacking on mobile. `ratio` sets their relative widths and which side the narrower one sits on.",
    holes: ["header", "aside", "children"],
    options: { ratio: ["equal", "aside-left", "aside-right"] },
    commonlyUsedFor: [
      "Two equally important panels (ratio: equal)",
      "One record's detail beside a summary rail (ratio: aside-left)",
    ],
    shell: "@framework/templates/SplitCardTemplate",
    layout: "default",
    previewRoute: "/sample/templates/split-card",
  },
  {
    id: "stacked-card",
    name: "Stacked cards",
    description:
      "Two cards, one above the other, at the same width as a wide single card. `ratio` sets a minimum height for each — `auto` imposes none, so both size purely to their content.",
    holes: ["header", "top", "children"],
    options: { ratio: ["auto", "equal", "top-tall", "bottom-tall"] },
    commonlyUsedFor: [
      "A summary or filter card above a results card",
      "A page whose lower card depends on a choice made in the upper one",
    ],
    shell: "@framework/templates/StackedCardTemplate",
    layout: "default",
    previewRoute: "/sample/templates/stacked-card",
  },
  {
    id: "card-grid",
    name: "Card grid",
    description:
      "A grid of equal cards that auto-fills the row and reflows to fewer columns as it narrows. `cardWidth` sets the minimum card width before it reflows.",
    holes: ["header", "children"],
    options: { cardWidth: ["sm", "md", "lg"] },
    commonlyUsedFor: [
      "Browsing a set of items as cards",
      "A module picker or a gallery of records",
    ],
    shell: "@framework/templates/CardGridTemplate",
    layout: "default",
    previewRoute: "/sample/templates/card-grid",
  },
];
