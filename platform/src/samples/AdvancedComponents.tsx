/**
 * Advanced / Composite — the components built on top of primitives so far:
 * PageContentHeader, ConfirmDialog, DataTable (which is itself how
 * TableSkeleton, SortableHeader and RowActionsCell get exercised — per
 * build-datatable's rule, a page never mounts those three directly, DataTable
 * renders them internally), FilterSheet — shown both inside DataTable's
 * toolbar and standalone, since it isn't table-specific
 * (src/components/ui/FilterSheet.tsx) — and Stepper.
 *
 * The DataTable section carries every configuration switch. That is deliberate: the switches
 * belong to the COMPONENT, not to any page, and a sample page has to show one committed
 * configuration so someone can point at it and say "build it like that". So the switches live here
 * and the sample pages under /sample/pages each show a single fixed setup.
 *
 * The Stepper section is also this repo's first `useForm` call site — every other form sample is
 * static markup. `onBeforeNext: () => form.trigger([...])` is the reference for gating a step on
 * react-hook-form validation; Stepper itself never imports the form library (components-rules.md:
 * no data or form library inside ui/).
 *
 * Deliberately not the whole advanced library yet — this demos only what has
 * actually been built. See docs/architecture/templates.md's "Later" table for
 * what's still pending its own designer screenshot.
 *
 * `Section` is small and re-declared here rather than imported from
 * Primitives.tsx — pages don't share presentation helpers across files
 * (pages-rules.md: composition only, no cross-page coupling).
 */

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@framework/components/ui/toast";
import { PiPencilSimple, PiPlus, PiTrash } from "react-icons/pi";
import { Card, CardContent } from "@framework/components/ui/card";
import { Button } from "@framework/components/ui/button";
import { ConfirmDialog } from "@framework/components/ui/ConfirmDialog";
import { Field, FieldError, FieldLabel } from "@framework/components/ui/field";
import { Input } from "@framework/components/ui/input";
import { PageContentHeader } from "@framework/components/ui/PageContentHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";
import { Stepper } from "@framework/components/ui/Stepper";
import { Switch } from "@framework/components/ui/switch";
import { SampleControls } from "@framework/components/SamplePreview/SampleControls";
import { DataTable } from "@framework/components/ui/datatable/DataTable";
import { FilterSheet } from "@framework/components/ui/FilterSheet";
import { useFilterDraft } from "@framework/hooks/useFilterDraft";
import { useTableState } from "@framework/hooks/useTableState";
import type { DataTableColumn, RowAction } from "@framework/types/table";

const SECTIONS = [
  { id: "page-content-header", label: "PageContentHeader" },
  { id: "confirm-dialog", label: "ConfirmDialog" },
  { id: "data-table", label: "DataTable" },
  { id: "filter-sheet", label: "FilterSheet" },
  { id: "stepper", label: "Stepper" },
];

const stepperFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

type StepperFormValues = z.infer<typeof stepperFormSchema>;

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    // scroll-mt clears the floating navbar (py-4 + h-14 = 88px) plus a little air.
    <section id={id} className="space-y-4 scroll-mt-24">
      <div>
        <h2 className="font-heading text-title-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

type Item = {
  id: string;
  name: string;
  status: "Active" | "Suspended";
  /** Expanded-panel content. Corvid's is empty, so `canExpand` is visible. */
  sites: { name: string; address: string }[];
};

const ITEMS: Item[] = [
  {
    id: "1",
    name: "Acme Industrial",
    status: "Active",
    sites: [
      { name: "Head office", address: "12 Kallang Ave, Singapore" },
      { name: "Warehouse A", address: "40 Jurong Port Rd, Singapore" },
    ],
  },
  {
    id: "2",
    name: "Belmont Logistics",
    status: "Active",
    sites: [{ name: "Depot", address: "8 Changi South Ln, Singapore" }],
  },
  { id: "3", name: "Corvid Fabrication", status: "Suspended", sites: [] },
  {
    id: "4",
    name: "Dunmore Castings",
    status: "Active",
    sites: [{ name: "Foundry", address: "3 Tuas Link 2, Singapore" }],
  },
];

/** The expanded panel — read-only detail the row already carries. */
const renderSites = (item: Item) => (
  <div className="space-y-2">
    <p className="text-label-sm tracking-wide text-muted-foreground uppercase">
      Sites ({item.sites.length})
    </p>
    <ul className="space-y-1">
      {item.sites.map((site) => (
        <li key={site.name} className="flex flex-wrap gap-x-3 text-sm">
          <span className="font-medium text-foreground">{site.name}</span>
          <span className="text-muted-foreground">{site.address}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const AdvancedComponents = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [striped, setStriped] = useState(true);
  const [singleAction, setSingleAction] = useState(false);
  const [showRefreshLabel, setShowRefreshLabel] = useState(true);
  const [showFilterLabel, setShowFilterLabel] = useState(true);
  const [enableSelection, setEnableSelection] = useState(false);
  const [refreshAtStart, setRefreshAtStart] = useState(false);
  const [expandable, setExpandable] = useState(false);
  const [singleExpand, setSingleExpand] = useState(false);
  const [selected, setSelected] = useState<Item[]>([]);
  const state = useTableState({ initialPerPage: 10 });
  // Standalone FilterSheet section — no table, no useTableState, so the same
  // hook that backs DataTable's filter panel is proven to work on its own.
  const standaloneFilters = useFilterDraft();

  // Stepper section — a 3-step flow whose middle step is a real form, so
  // "Continue is blocked by unfilled required fields" is demonstrated, not
  // just described.
  const [stepperStep, setStepperStep] = useState(0);
  const [stepperSubmitting, setStepperSubmitting] = useState(false);
  const [stepperShowCounter, setStepperShowCounter] = useState(true);
  const [stepperShowDescriptions, setStepperShowDescriptions] = useState(true);
  const [preference, setPreference] = useState("email");
  const stepperForm = useForm<StepperFormValues>({
    resolver: zodResolver(stepperFormSchema),
    defaultValues: { fullName: "", email: "" },
  });

  const filtered = useMemo(() => {
    const status = state.filters.status;
    return status ? ITEMS.filter((i) => i.status === status) : ITEMS;
  }, [state.filters.status]);

  const appliedFilterEntries = Object.entries(standaloneFilters.filters).filter(
    ([, value]) => value,
  );

  const columns: DataTableColumn<Item>[] = [
    { id: "name", header: "Name", accessor: (row) => row.name, sortable: true },
    { id: "status", header: "Status", accessor: (row) => row.status },
  ];

  const actions = (row: Item): RowAction[] =>
    singleAction
      ? [
          {
            label: "Delete",
            icon: PiTrash,
            destructive: true,
            onClick: () => toast.success(`Deleted ${row.name}`),
          },
        ]
      : [
          {
            label: "Edit",
            icon: PiPencilSimple,
            onClick: () => toast.info(`Edit ${row.name}`),
          },
          {
            label: "Delete",
            icon: PiTrash,
            destructive: true,
            onClick: () => toast.success(`Deleted ${row.name}`),
          },
        ];

  return (
    <div className="min-h-screen bg-background">
      {/* No bespoke header bar here — this page renders inside PageLayout
          (layout: "default"), so the Navbar above already supplies chrome and
          its own dark-mode toggle. */}
      <PageContentHeader
        title="Advanced / Composite"
        subtitle="Components built from primitives — a fragment of a page, not a control."
      />

      <div className="mt-6 flex gap-10">
        {/* In-page section nav */}
        <nav className="hidden md:block w-48 shrink-0">
          <ul className="sticky top-24 space-y-1 text-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block px-3 py-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <main className="flex-1 space-y-12 min-w-0">
          <Section
            id="page-content-header"
            title="PageContentHeader"
            description="Title, optional subtitle, and a right-aligned action cluster. Every page template renders this and sets align — pages never choose placement."
          >
            <div className="space-y-6">
              <PageContentHeader
                title="Manage vendors"
                align="start"
                subtitle="Left-aligned — what a wide, table-style page uses."
              >
                <Button size="sm" startIcon={<PiPlus className="size-4" />}>
                  Add vendor
                </Button>
              </PageContentHeader>
              <PageContentHeader
                title="Add vendor"
                align="center"
                subtitle="Centred — what a narrow form page uses."
              />
            </div>
          </Section>

          <Section
            id="confirm-dialog"
            title="ConfirmDialog"
            description="The one way a destructive action gets confirmed. Buttons render centred — the deliberate exception to the right-aligned action default."
          >
            <Button variant="outline" onClick={() => setConfirmOpen(true)}>
              Delete item
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Delete item"
              description="This removes the item permanently. This cannot be undone."
              variant="secondary"
              onConfirm={() => {
                toast.success("Deleted");
                setConfirmOpen(false);
              }}
            />
          </Section>

          <Section
            id="data-table"
            title="DataTable"
            description="Toolbar + table + pagination as one unit. FilterSheet, TableSkeleton, SortableHeader and RowActionsCell all render inside it — a page never mounts those directly. Every configuration is switchable here; the sample pages under /sample/pages each show one fixed setup instead."
          >
            <SampleControls
              className="mb-4"
              message="Component controls — every DataTable prop, in one place. A sample page shows one fixed configuration instead; see /sample/pages."
            >
              <Field orientation="horizontal">
                <Switch
                  id="adv-loading"
                  checked={loading}
                  onCheckedChange={setLoading}
                />
                <FieldLabel htmlFor="adv-loading">Loading state</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-striped"
                  checked={striped}
                  onCheckedChange={setStriped}
                />
                <FieldLabel htmlFor="adv-striped">Striped rows</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-selection"
                  checked={enableSelection}
                  onCheckedChange={setEnableSelection}
                />
                <FieldLabel htmlFor="adv-selection">
                  Selection checkboxes
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-single-action"
                  checked={singleAction}
                  onCheckedChange={setSingleAction}
                />
                <FieldLabel htmlFor="adv-single-action">
                  Single row action (icon, not ⋮)
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-refresh-label"
                  checked={showRefreshLabel}
                  onCheckedChange={setShowRefreshLabel}
                />
                <FieldLabel htmlFor="adv-refresh-label">
                  Refresh label
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-refresh-start"
                  checked={refreshAtStart}
                  onCheckedChange={setRefreshAtStart}
                />
                <FieldLabel htmlFor="adv-refresh-start">
                  Refresh beside search
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-filter-label"
                  checked={showFilterLabel}
                  onCheckedChange={setShowFilterLabel}
                />
                <FieldLabel htmlFor="adv-filter-label">Filter label</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-expandable"
                  checked={expandable}
                  onCheckedChange={setExpandable}
                />
                <FieldLabel htmlFor="adv-expandable">
                  Expandable rows
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-single-expand"
                  checked={singleExpand}
                  onCheckedChange={setSingleExpand}
                  disabled={!expandable}
                />
                <FieldLabel htmlFor="adv-single-expand">
                  One row open at a time
                </FieldLabel>
              </Field>
            </SampleControls>
            <DataTable
              mode="client"
              columns={columns}
              data={filtered}
              state={state}
              queryKey={["advanced-demo"]}
              isLoading={loading}
              striped={striped}
              enableRowSelection={enableSelection}
              onSelectionChange={setSelected}
              actions={actions}
              renderExpanded={expandable ? renderSites : undefined}
              canExpand={(row) => row.sites.length > 0}
              expandMode={singleExpand ? "single" : "multiple"}
              searchPlaceholder="Search items"
              showRefreshLabel={showRefreshLabel}
              refreshPosition={refreshAtStart ? "start" : "end"}
              rightSlot={
                selected.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selected.length} selected
                  </span>
                )
              }
              filterSheet={
                <FilterSheet
                  activeCount={state.activeFilterCount}
                  onClear={state.clearFilters}
                  onApply={state.applyFilters}
                  onDiscard={state.discardDraft}
                  canApply={state.isFilterDirty}
                  showLabel={showFilterLabel}
                >
                  <Field>
                    <FieldLabel htmlFor="adv-filter-status">Status</FieldLabel>
                    <Select
                      value={state.draftFilters.status ?? ""}
                      onValueChange={(value) =>
                        state.setDraftFilter("status", value || null)
                      }
                    >
                      <SelectTrigger id="adv-filter-status">
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FilterSheet>
              }
            />
          </Section>

          <Section
            id="filter-sheet"
            title="FilterSheet"
            description="The chrome around any filter panel — trigger, side sheet, Clear all / Apply footer. Not table-specific: this instance has no table and no useTableState behind it, only useFilterDraft directly."
          >
            <div className="flex flex-wrap items-center gap-4">
              <FilterSheet
                activeCount={standaloneFilters.activeFilterCount}
                onClear={standaloneFilters.clearFilters}
                onApply={standaloneFilters.applyFilters}
                onDiscard={standaloneFilters.discardDraft}
                canApply={standaloneFilters.isFilterDirty}
              >
                <Field>
                  <FieldLabel htmlFor="standalone-filter-status">
                    Status
                  </FieldLabel>
                  <Select
                    value={standaloneFilters.draftFilters.status ?? ""}
                    onValueChange={(value) =>
                      standaloneFilters.setDraftFilter("status", value || null)
                    }
                  >
                    <SelectTrigger id="standalone-filter-status">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="standalone-filter-priority">
                    Priority
                  </FieldLabel>
                  <Select
                    value={standaloneFilters.draftFilters.priority ?? ""}
                    onValueChange={(value) =>
                      standaloneFilters.setDraftFilter(
                        "priority",
                        value || null,
                      )
                    }
                  >
                    <SelectTrigger id="standalone-filter-priority">
                      <SelectValue placeholder="Any priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FilterSheet>
              <p className="text-sm text-muted-foreground">
                Applied:{" "}
                {appliedFilterEntries.length > 0
                  ? appliedFilterEntries
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")
                  : "no filters applied"}
              </p>
            </div>
          </Section>

          <Section
            id="stepper"
            title="Stepper"
            description="The frame for a multi-step form: progress rail, step heading and description, content, Back/Continue footer. The middle step here is a real react-hook-form + zod form — try Continue with empty fields."
          >
            <SampleControls
              className="mb-4"
              message="Component controls — every Stepper prop, in one place. A real page commits to one setup."
            >
              <Field orientation="horizontal">
                <Switch
                  id="adv-stepper-submitting"
                  checked={stepperSubmitting}
                  onCheckedChange={setStepperSubmitting}
                />
                <FieldLabel htmlFor="adv-stepper-submitting">
                  Submitting (loading state)
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-stepper-counter"
                  checked={stepperShowCounter}
                  onCheckedChange={setStepperShowCounter}
                />
                <FieldLabel htmlFor="adv-stepper-counter">
                  Show step counter
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="adv-stepper-descriptions"
                  checked={stepperShowDescriptions}
                  onCheckedChange={setStepperShowDescriptions}
                />
                <FieldLabel htmlFor="adv-stepper-descriptions">
                  Show step descriptions
                </FieldLabel>
              </Field>
            </SampleControls>

            <Stepper
              showStepCounter={stepperShowCounter}
              isSubmitting={stepperSubmitting}
              currentStep={stepperStep}
              onStepChange={setStepperStep}
              onComplete={stepperForm.handleSubmit(() => {
                toast.success("Registration submitted");
                stepperForm.reset();
                setPreference("email");
                setStepperStep(0);
              })}
              steps={[
                {
                  id: "contact",
                  title: "Your information",
                  name: "Contact",
                  description: stepperShowDescriptions
                    ? "Please enter your details."
                    : undefined,
                  onBeforeNext: () =>
                    stepperForm.trigger(["fullName", "email"]),
                  content: (
                    <div className="space-y-4">
                      <Controller
                        control={stepperForm.control}
                        name="fullName"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="adv-stepper-fullname">
                              Full name
                            </FieldLabel>
                            <Input
                              id="adv-stepper-fullname"
                              placeholder="e.g. Jane Smith"
                              aria-invalid={fieldState.invalid || undefined}
                              {...field}
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </Field>
                        )}
                      />
                      <Controller
                        control={stepperForm.control}
                        name="email"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="adv-stepper-email">
                              Email
                            </FieldLabel>
                            <Input
                              id="adv-stepper-email"
                              placeholder="jane@company.com"
                              aria-invalid={fieldState.invalid || undefined}
                              {...field}
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </Field>
                        )}
                      />
                    </div>
                  ),
                },
                {
                  id: "preferences",
                  title: "Preferences",
                  description: stepperShowDescriptions
                    ? "How should we reach you?"
                    : undefined,
                  content: (
                    <Field>
                      <FieldLabel htmlFor="adv-stepper-preference">
                        Preferred contact method
                      </FieldLabel>
                      <Select value={preference} onValueChange={setPreference}>
                        <SelectTrigger id="adv-stepper-preference">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  ),
                },
                {
                  id: "review",
                  title: "Review",
                  description: stepperShowDescriptions
                    ? "Confirm your details before submitting."
                    : undefined,
                  content: (
                    <p className="text-sm text-muted-foreground">
                      {stepperForm.watch("fullName") || "—"} ·{" "}
                      {stepperForm.watch("email") || "—"} · Contact by{" "}
                      {preference}
                    </p>
                  ),
                },
              ]}
            />
          </Section>
        </main>
      </div>
    </div>
  );
};
