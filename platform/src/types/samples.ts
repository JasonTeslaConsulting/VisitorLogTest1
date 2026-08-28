import type { RouteAccess, RouteLayout } from "./routing";

/**
 * One entry per sample page.
 *
 * A sample is a **named, filled composition**: a template at particular options, holding particular
 * components at a particular configuration. Templates are the mechanism; samples are the vocabulary
 * — the person prompting a build says "make it like the Approval Page", not "single-card at
 * width=wide".
 *
 * **Samples may be named by job**, which is the exact opposite of the rule for templates
 * (`docs/architecture/templates.md`: a template is named by its arrangement, never "Form page"). The
 * rules differ because the things differ: a template is defined by its holes, so a job name asserts
 * a structural difference that isn't there; a sample *is* one filled instance, so the job is the
 * most useful thing about it.
 *
 * Pure data on purpose: `scripts/docs-check.mjs` scrapes this registry to verify every `route` is
 * registered and every `template` resolves, and it does that with regex, without running TypeScript.
 * Keep entries flat literals.
 */
export type SampleEntry = {
  /** Stable slug — `"form-page-public"`. */
  id: string;
  /** What a user types in a prompt — `"Form Page Public"`. */
  name: string;
  /** The one line that separates this from its siblings. Shown under the name in the gallery. */
  distinguishedBy: string;
  /** What the page is. */
  description: string;
  /** When to reach for it. Examples, not a definition. */
  useCases: string[];
  /**
   * The page's parts in render order. Named so a request can borrow one region without copying the
   * whole page — "like Form Page Internal but with a table below" is a likelier ask than a
   * wholesale copy.
   */
  regions: string[];
  /**
   * The id of the sample this is a configuration variant of, when it is one. Approval Page would be
   * a variant of Table Page: same template, same regions, same components — only the component
   * configuration differs. Groups the family in the gallery.
   */
  variantOf?: string;
  /**
   * The component settings that define this preset, when it is a variant or when the configuration
   * is the point — `"DataTable: row selection enabled"`. Offering named sets is deliberate: it
   * keeps a prompter from having to assemble a coherent set of DataTable props themselves.
   */
  configuration?: string[];
  /** A `TEMPLATES` id, or null when the sample uses no template. */
  template: string | null;
  /** The arrangement props that produce this sample's frame. */
  templateOptions: Record<string, string>;
  /**
   * The layout a REAL page copied from this sample should register with — not how the sample
   * itself renders. Every sample route is forced to `layout: "default"` so the sample navbar
   * survives, which means Form Page Public renders *with* a navbar while being the sample of a page
   * that has none.
   */
  realLayout: RouteLayout;
  /**
   * The access a REAL page copied from this sample should register with — again not the sample's
   * own, which is always `"public"` so an unauthenticated visitor can browse the samples at all.
   */
  realAccess: RouteAccess;
  /** Where the sample lives. */
  route: string;
};
