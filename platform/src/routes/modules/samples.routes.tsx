import type { AppRoute } from "@framework/types/routing";
import { AdvancedComponents } from "@framework/samples/AdvancedComponents";
import { Primitives } from "@framework/samples/Primitives";
import { SampleHome } from "@framework/samples/SampleHome";
import { SampleGallery } from "@framework/samples/SampleGallery";
import { TemplateGallery } from "@framework/samples/TemplateGallery";
import { CardGrid } from "@framework/samples/templates/CardGrid";
import { SingleCard } from "@framework/samples/templates/SingleCard";
import { SplitCard } from "@framework/samples/templates/SplitCard";
import { StackedCard } from "@framework/samples/templates/StackedCard";
import { ApprovalPage } from "@framework/samples/samples/ApprovalPage";
import { CardListPage } from "@framework/samples/samples/CardListPage";
import { DashboardPage } from "@framework/samples/samples/DashboardPage";
import { DetailPage } from "@framework/samples/samples/DetailPage";
import { FormPageInternal } from "@framework/samples/samples/FormPageInternal";
import { FormPagePublic } from "@framework/samples/samples/FormPagePublic";
import { ConfirmationPageSimple } from "@framework/samples/samples/ConfirmationPageSimple";
import { ConfirmationPageDetailed } from "@framework/samples/samples/ConfirmationPageDetailed";
import { ScopedListPage } from "@framework/samples/samples/ScopedListPage";
import { StandardManagementPage } from "@framework/samples/samples/StandardManagementPage";

// Template preview paths must match `previewRoute` in src/templates/registry.ts —
// `npm run docs:check` warns if an entry points at a route that isn't registered here.
//
// /sample and /sample/overview both render SampleHome deliberately — Navbar's
// "Overview" nav item points at /sample/overview (not /sample) because
// LayoutUtils.isActive is prefix-based and would otherwise highlight on every
// /sample/* route.
//
// Every route here is `layout: "default"` (never "none") so PageLayout's Navbar
// renders on every sample page — that's what lets Navbar swap in the sample menu
// (src/lib/constants/sampleNav.ts) instead of showing no nav at all.
export const routes = [
  {
    path: "/sample",
    element: <SampleHome />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/overview",
    element: <SampleHome />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/component-library",
    element: <Primitives />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/advanced",
    element: <AdvancedComponents />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/templates",
    element: <TemplateGallery />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/templates/single-card",
    element: <SingleCard />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/templates/split-card",
    element: <SplitCard />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/templates/stacked-card",
    element: <StackedCard />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/templates/card-grid",
    element: <CardGrid />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/pages",
    element: <SampleGallery />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/form-page-public",
    element: <FormPagePublic />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/form-page-internal",
    element: <FormPageInternal />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/confirmation-page-simple",
    element: <ConfirmationPageSimple />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/confirmation-page-detailed",
    element: <ConfirmationPageDetailed />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/standard-management-page",
    element: <StandardManagementPage />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/approval-page",
    element: <ApprovalPage />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/scoped-list-page",
    element: <ScopedListPage />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/dashboard-page",
    element: <DashboardPage />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/detail-page",
    element: <DetailPage />,
    access: "public",
    layout: "default",
  },
  {
    path: "/sample/card-list-page",
    element: <CardListPage />,
    access: "public",
    layout: "default",
  },
] satisfies AppRoute[];
