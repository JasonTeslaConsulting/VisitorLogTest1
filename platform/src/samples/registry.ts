/**
 * Sample registry — one entry per sample page.
 *
 * This is the vocabulary a prompter uses: "make this page like Form Page Public". Each entry says
 * what the page is, when to reach for it, and — importantly — which template and options it is
 * composed from, so the sample layer reads as *built on* the template layer rather than competing
 * with it. See `docs/architecture/templates.md` § Samples are not templates.
 *
 * `realLayout` / `realAccess` are the layout and access a REAL copy needs, which is deliberately not
 * how the sample renders: every sample route is `layout: "default"`, `access: "public"` so the
 * sample navbar survives and an unauthenticated visitor can browse. Form Page Public therefore shows
 * a navbar while being the sample of a page that has none — the registry records the truth so a
 * copying agent doesn't inherit the sample's own routing.
 *
 * Adding an entry: see the admission test in `.claude/skills/build-from-sample/SKILL.md`. In short —
 * a distinct nameable configuration earns an entry, the same configuration with different fields
 * does not.
 *
 * Pure data on purpose: `scripts/docs-check.mjs` scrapes this file with regex and never runs
 * TypeScript. Keep entries flat literals.
 */

import type { SampleEntry } from "@framework/types/samples";

export const SAMPLES: SampleEntry[] = [
  {
    id: "form-page-public",
    name: "Form Page Public",
    distinguishedBy: "Title and subtitle above the card, centred.",
    description:
      "A create form on a narrow centred card, with the page title sitting above it. The standalone shape — a real one renders with no navbar, so the title block is the page's only chrome.",
    useCases: [
      "A public form reached by link, with no sign-in",
      "A standalone step outside the app's navigation",
    ],
    regions: [
      "page header (title + subtitle)",
      "form fields",
      "action bar (Cancel / Save)",
    ],
    template: "single-card",
    templateOptions: { width: "narrow", headerPlacement: "above" },
    realLayout: "none",
    realAccess: "public",
    route: "/sample/form-page-public",
  },
  {
    id: "form-page-internal",
    name: "Form Page Internal",
    distinguishedBy: "Title and subtitle inside the card, top left.",
    description:
      "The same form, with the title block moved into the card. The in-app shape — the navbar already tells the user where they are, so the card carries its own heading instead of the page repeating one above it.",
    useCases: [
      "A create or edit form reached from the navbar, signed in",
      "Any form on a page that already has app chrome above it",
    ],
    regions: [
      "card header (title + subtitle)",
      "form fields",
      "action bar (Cancel / Save)",
    ],
    variantOf: "form-page-public",
    configuration: [
      "SingleCardTemplate: headerPlacement=inside, so the title is in the card's header row",
    ],
    template: "single-card",
    templateOptions: { width: "narrow", headerPlacement: "inside" },
    realLayout: "default",
    realAccess: "authenticated",
    route: "/sample/form-page-internal",
  },
  {
    id: "confirmation-page-simple",
    name: "Confirmation Page Simple",
    distinguishedBy:
      "Tick, message, actions. No summary of what was submitted.",
    description:
      "What a public form shows after a successful submit: a success badge, what happens next, one line of standing fine print, and the way out. The standalone shape — a real one renders with no navbar, because a guest who followed a link has nowhere to navigate to.",
    useCases: [
      "The page a public form redirects to on success",
      "Any end-of-flow acknowledgement with nothing to report back",
    ],
    regions: [
      "page header (title + subtitle)",
      "success badge + title + description",
      "fine print under a divider",
      "actions",
    ],
    template: "single-card",
    templateOptions: { width: "narrow", headerPlacement: "above" },
    realLayout: "none",
    realAccess: "public",
    route: "/sample/confirmation-page-simple",
  },
  {
    id: "confirmation-page-detailed",
    name: "Confirmation Page Detailed",
    distinguishedBy:
      "Adds a summary of the submission between the message and the actions.",
    description:
      "The same confirmation, echoing back what was recorded — a label/value summary plus any repeated blocks such as declared items. Use it when the reader needs a reference to quote later, or when the submission has parts worth re-reading before they walk away.",
    useCases: [
      "A submission the user may need to quote a reference number from",
      "A confirmation carrying a status, a timestamp, or line items",
    ],
    regions: [
      "page header (title + subtitle)",
      "success badge + title + description",
      "summary info table",
      "repeated blocks (e.g. declared items)",
      "standing instruction",
      "actions",
    ],
    variantOf: "confirmation-page-simple",
    configuration: [
      "ConfirmationPanel: children carry an InfoTable, so a summary sits between the message and the actions",
      "Rows are chosen per page and include server-generated values (reference id, status, timestamp), not only submitted fields",
    ],
    template: "single-card",
    templateOptions: { width: "narrow", headerPlacement: "above" },
    realLayout: "none",
    realAccess: "public",
    route: "/sample/confirmation-page-detailed",
  },
  {
    id: "standard-management-page",
    name: "Standard Management Page",
    distinguishedBy: "Search, filter, refresh, and a ⋮ menu per row.",
    description:
      "The default list page: find a record, then act on it. No selection and no expansion — one row at a time, through its own actions menu. Editing opens a side sheet so the list stays visible behind it.",
    useCases: [
      "Finding and managing many records",
      "Any list a user searches, filters and sorts",
    ],
    regions: [
      "page header",
      "toolbar (search, filters, refresh)",
      "table",
      "pagination",
    ],
    template: "single-card",
    templateOptions: { width: "wide", headerPlacement: "above" },
    realLayout: "default",
    realAccess: "authenticated",
    route: "/sample/standard-management-page",
  },
  {
    id: "approval-page",
    name: "Approval Page",
    distinguishedBy:
      "Checkboxes, and Approve / Reject always visible with a count.",
    description:
      "The bulk-decision queue: tick several rows and act on the set. No per-row actions at all, because a row-level Edit beside a bulk Approve is ambiguous about what the button applies to.",
    useCases: [
      "Approving or rejecting a queue of submissions",
      "Any list where the work is done to several records at once",
    ],
    regions: [
      "page header",
      "toolbar (search, refresh, bulk actions)",
      "table",
      "pagination",
    ],
    variantOf: "standard-management-page",
    configuration: [
      "DataTable: enableRowSelection, no actions — selection replaces the ⋮ menu",
      "DataTable: refreshPosition=start, so refresh sits beside the search box",
      "Page: Approve/Reject always rendered in rightSlot, counted and disabled at zero",
    ],
    template: "single-card",
    templateOptions: { width: "wide", headerPlacement: "above" },
    realLayout: "default",
    realAccess: "authenticated",
    route: "/sample/approval-page",
  },
  {
    id: "scoped-list-page",
    name: "Scoped List Page",
    distinguishedBy:
      "Required scope selectors in the toolbar, not a filter sheet.",
    description:
      "The data is pre-scoped before you see any of it — pick a company and year, then work within that set. A scope is required and applies immediately; a filter is optional and lives in the sheet. Both are shown together.",
    useCases: [
      "A list only ever read one dataset at a time (per company, per year)",
      "Any page where the selectors decide the query rather than narrow it",
    ],
    regions: [
      "page header",
      "toolbar (search, scope selectors, filter, refresh)",
      "table",
      "pagination",
    ],
    variantOf: "standard-management-page",
    configuration: [
      "useTableState: scope/setScope drives the query and resets to page 1",
      "Page: scope Selects in rightSlot, with the filter sheet kept for refinement",
      "DataTable: one row action, so it renders as a bare icon button not a ⋮ menu",
      "Row-level Switch uses color=secondary per DESIGN.md § Tables",
    ],
    template: "single-card",
    templateOptions: { width: "wide", headerPlacement: "above" },
    realLayout: "default",
    realAccess: "authenticated",
    route: "/sample/scoped-list-page",
  },
  {
    id: "dashboard-page",
    name: "Dashboard Page",
    distinguishedBy: "Two equal panels side by side, stacking on mobile.",
    description:
      "Two summaries of comparable weight next to each other — a queue beside recent activity.",
    useCases: [
      "A landing page summarising two things at once",
      "Anything where neither panel is subordinate to the other",
    ],
    regions: ["page header", "left panel", "right panel"],
    template: "split-card",
    templateOptions: { ratio: "equal" },
    realLayout: "default",
    realAccess: "authenticated",
    route: "/sample/dashboard-page",
  },
  {
    id: "detail-page",
    name: "Detail Page",
    distinguishedBy: "One record's detail beside a narrower summary rail.",
    description:
      "A single record opened from a list: its detail fills the page, with key facts and actions pinned to a rail alongside.",
    useCases: [
      "Viewing one record after clicking it in a table",
      "Any page where a summary should stay visible beside the detail",
    ],
    regions: ["page header", "summary rail", "detail body"],
    template: "split-card",
    templateOptions: { ratio: "aside-left" },
    realLayout: "default",
    realAccess: "authenticated",
    route: "/sample/detail-page",
  },
  {
    id: "card-list-page",
    name: "Card List Page",
    distinguishedBy: "A responsive grid of equal cards, each a destination.",
    description:
      "A set of entry points rather than a set of records — each card is a link to somewhere else.",
    useCases: [
      "A module or section index",
      "A landing page whose job is to route the user onward",
    ],
    regions: ["page header", "card grid"],
    template: "card-grid",
    templateOptions: { cardWidth: "md" },
    realLayout: "default",
    realAccess: "authenticated",
    route: "/sample/card-list-page",
  },
];
