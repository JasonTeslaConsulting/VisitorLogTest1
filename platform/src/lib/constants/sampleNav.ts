import type { NavModule } from "@framework/types/navigation";

/**
 * The navbar menu shown on any `/sample/*` route, instead of the Supabase-driven
 * `_arch.menu` data `useNavMenu` fetches.
 *
 * Sample pages are reached only by typing the URL — nothing in the real app
 * links here, and `useNavMenu` is gated on `organizationUserId`, so an
 * unauthenticated visitor gets no nav at all. Navbar swaps in this constant for
 * any `/sample` path (see `src/app/layout/Navbar.tsx`).
 *
 * Expressed as `NavModule[]` — the same shape the real menu returns — so
 * `ModuleDropdown`, `MobileSidebar` and `LayoutUtils.isActive` all work
 * unchanged. A module with exactly one screen renders as a direct link, not a
 * dropdown (Navbar's existing rule) — that's what makes "Overview" and
 * "Templates" navigate straight with no extra code.
 *
 * `moduleid`/`screenid` are `sample-*` sentinel strings. Real `_arch.module`/`_arch.screen` ids
 * are uuids, so these can never collide with one (they were negative numbers before those
 * columns became uuid).
 *
 * `SampleHome` (`/sample` and `/sample/overview`) renders from this same
 * constant, so the nav and the home page can't drift apart.
 */
export const SAMPLE_NAV_MODULES: NavModule[] = [
  {
    moduleid: "sample-module-1",
    modulename: "Overview",
    sortorder: 1,
    screens: [
      {
        screenid: "sample-screen-1",
        screenname: "Overview",
        screentitle: "Overview",
        urladdress: "/sample/overview",
        menuicon: "Search",
        menuorder: 1,
      },
    ],
  },
  {
    moduleid: "sample-module-2",
    modulename: "Component Library",
    sortorder: 2,
    screens: [
      {
        screenid: "sample-screen-2",
        screenname: "Primitives",
        screentitle: "Primitives",
        urladdress: "/sample/component-library",
        menuicon: "Package",
        menuorder: 1,
      },
      {
        screenid: "sample-screen-3",
        screenname: "Advanced / Composite",
        screentitle: "Advanced / Composite",
        urladdress: "/sample/advanced",
        menuicon: "Layers",
        menuorder: 2,
      },
    ],
  },
  {
    moduleid: "sample-module-3",
    modulename: "Templates",
    sortorder: 3,
    screens: [
      {
        screenid: "sample-screen-4",
        screenname: "Templates",
        screentitle: "Templates",
        urladdress: "/sample/templates",
        menuicon: "LayoutDashboard",
        menuorder: 1,
      },
    ],
  },
  {
    moduleid: "sample-module-4",
    modulename: "Samples",
    sortorder: 4,
    // One screen, so Navbar renders this as a direct link rather than a dropdown —
    // the same rule that makes Templates a link. The individual sample pages are
    // reached from the gallery, not from the navbar: a menu of page names is a worse
    // way to choose than a grid that says what each one is for.
    screens: [
      {
        screenid: "sample-screen-5",
        screenname: "Samples",
        screentitle: "Samples",
        urladdress: "/sample/pages",
        menuicon: "ClipboardCheck",
        menuorder: 1,
      },
    ],
  },
];
