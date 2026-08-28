import type { RouteLayout } from "./routing";

/**
 * The prop shape every page template shares, so shells stay interchangeable at
 * the call site. Each shell adds its own arrangement prop on top (`width`,
 * `ratio`, `cardWidth`).
 *
 * There is deliberately no `actions` hole — the bottom action bar is a
 * cross-container concern (forms, sheets and modals all place it the same way,
 * DESIGN.md §7) and lives in `ActionBar`/`FormBody` inside `children`. An
 * `actions` hole would also render the submit button outside the `<form>`
 * element, silently breaking `type="submit"`.
 */
export type TemplateProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned cluster in the page header. */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/**
 * One template in the gallery — exactly one per shell in `src/templates/`.
 *
 * A template is defined by its **holes and props**, so every field here describes
 * what the arrangement *is*. Nothing here may name a job: "Form page" is not a
 * template, it is one thing you can build with `single-card` at `width: "narrow"`.
 * That kind of information belongs in `commonlyUsedFor`, as a non-binding example.
 *
 * See `docs/architecture/templates.md`.
 */
export type TemplateEntry = {
  /** Stable id — what a build unit's `template:` frontmatter field stores. */
  id: string;
  /** The arrangement, never the job — "Single card", not "Form page". */
  name: string;
  /** What the arrangement is: how the cards sit and what the props vary. */
  description: string;
  /** The holes content drops into, in render order — `["header", "children"]`. */
  holes: string[];
  /**
   * The shell's arrangement props and their allowed values, **first value first
   * — it is the default**. Drives the gallery's live props toolbar, so adding a
   * value here adds a toggle with no page edit.
   *
   * Deliberately a flat literal of string arrays: `scripts/gen-arch-docs.mjs` and
   * `scripts/docs-check.mjs` regex-scrape this file without running TypeScript.
   */
  options: Record<string, string[]>;
  /**
   * Examples of pages this arrangement commonly serves. Non-binding, and never
   * the template's identity — a page is free to use any template that fits.
   */
  commonlyUsedFor: string[];
  /** Import path of the shell component. */
  shell: string;
  /** Which PageLayout chrome a page using this template should register with. */
  layout: RouteLayout;
  /** Route of the live preview in the gallery. */
  previewRoute: string;
};
