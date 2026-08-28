/**
 * Sample: Standard Management Page — find a record, then act on it.
 *
 * The default shape for a list page, and deliberately ONE fixed configuration rather than a panel
 * of switches: no selection, no expansion, no toolbar action buttons. Search and filter, refresh at
 * the right, and two row actions collapsed into the ⋮ menu. Every DataTable prop combination lives
 * on /sample/advanced instead — those switches belong to the component, not to a page.
 *
 * `mode="client"` with inline mock data so it renders on a fresh clone with no .env. Server mode is
 * the default in real pages, and swapping changes only the service and hook — not columns, actions
 * or this page's shape.
 */

import { useMemo, useState } from "react";
import { PiPencilSimple, PiTrash } from "react-icons/pi";
import { toast } from "@framework/components/ui/toast";
import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { Badge } from "@framework/components/ui/badge";
import { Button } from "@framework/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@framework/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";
import { Input } from "@framework/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@framework/components/ui/sheet";
import { UnsavedChangesDialog } from "@framework/components/ui/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "@framework/hooks/useUnsavedChangesGuard";
import { DataTable } from "@framework/components/ui/datatable/DataTable";
import { FilterSheet } from "@framework/components/ui/FilterSheet";
import { useTableState } from "@framework/hooks/useTableState";
import { STATUS_VARIANTS } from "@framework/lib/constants";
import type { DataTableColumn, RowAction } from "@framework/types/table";

type Vendor = {
  id: string;
  name: string;
  contact: string;
  status: "Active" | "Suspended";
  /** Unit on the left: "$1,234.00". */
  spend: number;
  /** Unit on the right: "12 days". */
  leadTimeDays: number;
  /** A suffix that isn't a physical unit: "94.2%". */
  onTimeRate: number;
  /** No unit at all — just decimals genuinely worth keeping to 4dp. */
  fxRate: number;
  roles: string[];
};

const VENDORS: Vendor[] = [
  {
    id: "1",
    name: "Acme Industrial",
    contact: "Jane Doe",
    status: "Active",
    spend: 128500.0,
    leadTimeDays: 12,
    onTimeRate: 94.2,
    fxRate: 1.0,
    roles: ["Supplier"],
  },
  {
    id: "2",
    name: "Belmont Logistics",
    contact: "Ravi Patel",
    status: "Active",
    spend: 76200.5,
    leadTimeDays: 5,
    onTimeRate: 98.7,
    fxRate: 1.3542,
    roles: ["Supplier", "Carrier"],
  },
  {
    id: "3",
    name: "Corvid Fabrication",
    contact: "Sam Okafor",
    status: "Suspended",
    spend: 42300.0,
    leadTimeDays: 21,
    onTimeRate: 81.3,
    fxRate: 0.9123,
    roles: ["Supplier"],
  },
  {
    id: "4",
    name: "Dunmore Castings",
    contact: "Mei Lin",
    status: "Active",
    spend: 215000.75,
    leadTimeDays: 18,
    onTimeRate: 92.5,
    fxRate: 1.0,
    roles: ["Supplier", "Carrier", "Contractor"],
  },
  {
    id: "5",
    name: "Everett Tooling",
    contact: "Tom Becker",
    status: "Active",
    spend: 58900.0,
    leadTimeDays: 9,
    onTimeRate: 96.8,
    fxRate: 0.7834,
    roles: ["Contractor"],
  },
  {
    id: "6",
    name: "Foxglove Chemicals",
    contact: "Priya Nair",
    status: "Suspended",
    spend: 33750.25,
    leadTimeDays: 30,
    onTimeRate: 68.4,
    fxRate: 1.1256,
    roles: ["Supplier"],
  },
  {
    id: "7",
    name: "Granite Haulage",
    contact: "Alex Stone",
    status: "Active",
    spend: 91400.0,
    leadTimeDays: 4,
    onTimeRate: 99.1,
    fxRate: 1.0,
    roles: ["Carrier"],
  },
  {
    id: "8",
    name: "Harrow Plastics",
    contact: "Nia Baptiste",
    status: "Active",
    spend: 47600.6,
    leadTimeDays: 14,
    onTimeRate: 90.0,
    fxRate: 0.8567,
    roles: ["Supplier"],
  },
  {
    id: "9",
    name: "Ivy Precision",
    contact: "Ken Ito",
    status: "Active",
    spend: 63200.0,
    leadTimeDays: 7,
    onTimeRate: 97.6,
    fxRate: 1.0,
    roles: ["Contractor"],
  },
  {
    id: "10",
    name: "Juniper Metals",
    contact: "Sara Vance",
    status: "Suspended",
    spend: 24800.0,
    leadTimeDays: 25,
    onTimeRate: 74.9,
    fxRate: 6.7821,
    roles: ["Supplier", "Carrier"],
  },
  {
    id: "11",
    name: "Kestrel Bearings",
    contact: "Owen Reid",
    status: "Active",
    spend: 108900.4,
    leadTimeDays: 10,
    onTimeRate: 95.3,
    fxRate: 1.0,
    roles: ["Supplier"],
  },
  {
    id: "12",
    name: "Larkfield Seals",
    contact: "Dana Cruz",
    status: "Active",
    spend: 39600.0,
    leadTimeDays: 16,
    onTimeRate: 88.7,
    fxRate: 0.9245,
    roles: ["Supplier"],
  },
];

/**
 * Editing a row opens a SIDE SHEET, not a modal — the standing default for anything opened from a
 * datatable (DESIGN.md §7, `.claude/skills/build-datatable/SKILL.md`). The table stays visible
 * behind it, so the user keeps their place in the list instead of losing it to an overlay.
 *
 * Guarded with `useUnsavedChangesGuard`: closing a sheet throws away whatever was typed exactly as
 * a dialog does, so both containers are wired the same way. A real page passes react-hook-form's
 * `formState.isDirty`; this sample compares against the row it opened with, which is the same idea
 * without the dependency.
 *
 * Mounted with `key={vendor.id}` by the caller so the field state resets per row rather than
 * leaking the previous vendor's edits into the next one.
 *
 * Deliberately still three fields — the table's four numeric columns (spend, lead time, on-time
 * rate, FX rate) are display-only here. They exist to showcase the column format, not to be
 * editable; wiring them up would mean extending the hand-rolled `dirty` check below for no reason
 * this page needs.
 */
function VendorEditSheet({
  vendor,
  onClose,
}: {
  vendor: Vendor;
  onClose: () => void;
}) {
  const [name, setName] = useState(vendor.name);
  const [contact, setContact] = useState(vendor.contact);
  const [status, setStatus] = useState<Vendor["status"]>(vendor.status);

  const dirty =
    name !== vendor.name ||
    contact !== vendor.contact ||
    status !== vendor.status;

  const guard = useUnsavedChangesGuard({ when: dirty });

  return (
    <Sheet open onOpenChange={guard.guardOpenChange(() => onClose())}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit vendor</SheetTitle>
          <SheetDescription>
            Changes apply to {vendor.name} only.
          </SheetDescription>
        </SheetHeader>

        <FieldGroup className="px-4">
          <Field>
            <FieldLabel htmlFor="vendor-name">Vendor name</FieldLabel>
            <Input
              id="vendor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="vendor-contact">Primary contact</FieldLabel>
            <Input
              id="vendor-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="vendor-status">Status</FieldLabel>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Vendor["status"])}
            >
              <SelectTrigger id="vendor-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <SheetFooter>
          <Button variant="outline" onClick={() => guard.requestClose(onClose)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success(`Saved ${name}`);
              onClose();
            }}
          >
            Save changes
          </Button>
        </SheetFooter>

        <UnsavedChangesDialog guard={guard} />
      </SheetContent>
    </Sheet>
  );
}

export const StandardManagementPage = () => {
  const state = useTableState({ initialPerPage: 10 });
  const [editing, setEditing] = useState<Vendor | null>(null);

  // Client mode filters in memory; the FilterSheet only has to set the value.
  const filtered = useMemo(() => {
    const status = state.filters.status;
    if (!status) return VENDORS;
    return VENDORS.filter((v) => v.status === status);
  }, [state.filters.status]);

  // The return-type annotation on the callback is load-bearing, not stylistic: with a mix of
  // plain/numeric/badge columns in one array literal, `useMemo<DataTableColumn<Vendor>[]>(...)` or
  // an outer `const columns: DataTableColumn<Vendor>[] = useMemo(...)` both fail to typecheck —
  // TypeScript infers a single "morphed" shape across every element first and only then checks it
  // against the union, which fails on the plain columns. Annotating the callback's own return type
  // gives each element a strong enough contextual type to be checked individually instead.
  const columns = useMemo(
    (): DataTableColumn<Vendor>[] => [
      {
        id: "name",
        header: "Vendor",
        accessor: (row) => row.name,
        sortable: true,
        href: (row) => `/sample/datatable#${row.id}`,
      },
      {
        id: "contact",
        header: "Contact",
        accessor: (row) => row.contact,
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        // Borrows STATUS_VARIANTS directly rather than writing its own map — "active" and
        // "suspended" are both already in the shared convention (success / warning), which is
        // exactly the case that constant exists for.
        accessor: (row) => row.status,
        badge: { variants: STATUS_VARIANTS },
        sortable: true,
      },
      {
        id: "spend",
        header: "Spend",
        // Unit on the left.
        accessor: (row) => row.spend,
        numeric: { decimals: 2, prefix: "$" },
        sortable: true,
      },
      {
        id: "leadTimeDays",
        header: "Lead time",
        // Unit on the right, and a count rather than money — 0 decimals.
        accessor: (row) => row.leadTimeDays,
        numeric: { decimals: 0, suffix: " days" },
        sortable: true,
      },
      {
        id: "onTimeRate",
        header: "On-time rate",
        // A suffix that isn't a physical unit — numeric doesn't care which.
        accessor: (row) => row.onTimeRate,
        numeric: { decimals: 1, suffix: "%" },
        sortable: true,
      },
      {
        id: "fxRate",
        header: "FX rate",
        // No unit at all. 4dp here is a real, deliberate choice, not the 2dp every other numeric
        // column on this page uses — decimals has no safe default for exactly this reason.
        accessor: (row) => row.fxRate,
        numeric: { decimals: 4 },
        sortable: true,
      },
      {
        id: "roles",
        header: "Roles",
        // wrap: several badges are allowed to run onto a second line; every
        // other column keeps whitespace-nowrap.
        wrap: true,
        accessor: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  // Two actions, so RowActionsCell collapses them into the ⋮ menu. Edit opens a side sheet — the
  // standing default for anything opened from a datatable.
  const actions = (row: Vendor): RowAction[] => [
    { label: "Edit", icon: PiPencilSimple, onClick: () => setEditing(row) },
    {
      label: "Delete",
      icon: PiTrash,
      destructive: true,
      onClick: () => toast.success(`Deleted ${row.name}`),
    },
  ];

  return (
    <SingleCardTemplate
      title="Manage vendors"
      subtitle="Find a record, then act on it."
      width="wide"
    >
      <div className="space-y-4">
        <DataTable
          mode="client"
          columns={columns}
          data={filtered}
          state={state}
          queryKey={["sample-vendors"]}
          actions={actions}
          searchPlaceholder="Search vendors"
          filterSheet={
            <FilterSheet
              activeCount={state.activeFilterCount}
              onClear={state.clearFilters}
              onApply={state.applyFilters}
              onDiscard={state.discardDraft}
              canApply={state.isFilterDirty}
            >
              <Field>
                <FieldLabel htmlFor="filter-status">Status</FieldLabel>
                <Select
                  value={state.draftFilters.status ?? ""}
                  onValueChange={(value) =>
                    state.setDraftFilter("status", value || null)
                  }
                >
                  <SelectTrigger id="filter-status">
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

        {/* Keyed per row so each edit starts from that vendor's own values rather than inheriting
            the last one's. Rendering only while `editing` is set keeps the field state disposable. */}
        {editing && (
          <VendorEditSheet
            key={editing.id}
            vendor={editing}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </SingleCardTemplate>
  );
};
