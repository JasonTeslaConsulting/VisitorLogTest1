/**
 * Sample: Approval Page — work through a queue and act on several rows at once.
 *
 * The bulk-action shape. Selection is the point, so there are no per-row actions at all: you tick
 * rows and act on the set. Differs from the Standard Management Page in exactly three ways, which
 * is what makes it worth its own sample rather than a note on that one:
 *
 * - **No `actions`** — no ⋮ column. A row-level Edit next to a bulk Approve invites acting on one
 *   record while several are ticked, which reads as ambiguous about what the button applies to.
 * - **`refreshPosition="start"`** — refresh sits immediately right of the search box, leaving the
 *   right side of the toolbar for the two decisions.
 * - **Approve / Reject are always rendered**, carrying the live count and disabled at zero.
 *
 * That last one is deliberately page-level rather than a DataTable prop. The page already has the
 * selected rows from `onSelectionChange`, and the verbs, counts and handlers are all domain
 * specific — Approve/Reject here, Archive/Restore somewhere else. DataTable owning them would mean
 * a third way to fill a toolbar slot that `rightSlot` already covers.
 *
 * Always visible rather than appearing on first selection: the affordance is what tells a user bulk
 * action is possible at all, and a control that materialises only once you have guessed correctly is
 * a worse teacher. `disabled` at zero keeps it honest — the button is never clickable with nothing
 * to apply it to. The Standard Management Page shows the other convention, where bulk actions appear
 * only once rows are selected; both are legitimate and the page chooses.
 *
 * `mode="client"` with inline mock data so it renders on a fresh clone with no .env.
 */

import { useState } from "react";
import { PiCheck, PiX } from "react-icons/pi";
import { toast } from "@framework/components/ui/toast";
import { SingleCardTemplate } from "@framework/templates/SingleCardTemplate";
import { Button } from "@framework/components/ui/button";
import { ConfirmDialog } from "@framework/components/ui/ConfirmDialog";
import { DataTable } from "@framework/components/ui/datatable/DataTable";
import { useTableState } from "@framework/hooks/useTableState";
import type { DataTableColumn } from "@framework/types/table";

type Claim = {
  id: string;
  reference: string;
  claimant: string;
  category: string;
  amount: number;
  submitted: string;
};

const CLAIMS: Claim[] = [
  {
    id: "1",
    reference: "EXP-2026-0141",
    claimant: "Jasmine Koh",
    category: "Travel",
    amount: 412,
    submitted: "24 Aug 2026",
  },
  {
    id: "2",
    reference: "EXP-2026-0142",
    claimant: "Andy Kartika",
    category: "Equipment",
    amount: 1280.5,
    submitted: "24 Aug 2026",
  },
  {
    id: "3",
    reference: "EXP-2026-0143",
    claimant: "Ravi Patel",
    category: "Client entertainment",
    amount: 96.4,
    submitted: "25 Aug 2026",
  },
  {
    id: "4",
    reference: "EXP-2026-0144",
    claimant: "Mei Lin",
    category: "Travel",
    amount: 780,
    submitted: "25 Aug 2026",
  },
  {
    id: "5",
    reference: "EXP-2026-0145",
    claimant: "Tom Becker",
    category: "Training",
    amount: 2150,
    submitted: "26 Aug 2026",
  },
  {
    id: "6",
    reference: "EXP-2026-0146",
    claimant: "Priya Nair",
    category: "Equipment",
    amount: 335.9,
    submitted: "26 Aug 2026",
  },
];

const columns: DataTableColumn<Claim>[] = [
  {
    id: "reference",
    header: "Reference",
    accessor: (row) => row.reference,
    sortable: true,
  },
  {
    id: "claimant",
    header: "Claimant",
    accessor: (row) => row.claimant,
    sortable: true,
  },
  {
    id: "category",
    header: "Category",
    // All four map to the same variant, matching the flat styling this page always used —
    // becoming a `badge` column fixes search (a Badge-returning accessor was silently excluded
    // from it before) without changing how a category actually looks.
    accessor: (row) => row.category,
    badge: {
      variants: {
        travel: "secondary",
        equipment: "secondary",
        training: "secondary",
        "client-entertainment": "secondary",
      },
    },
  },
  {
    id: "amount",
    header: "Amount",
    // Raw number, not the pre-formatted "SGD 412.00" this used to be — that string sorted
    // lexicographically ("SGD 1,280.50" below "SGD 412.00"), which numeric fixes as a side
    // effect of formatting being declared rather than baked into the value. `numeric` right-aligns
    // by default, so no `align` is needed here either.
    accessor: (row) => row.amount,
    numeric: { decimals: 2, prefix: "SGD " },
    sortable: true,
  },
  {
    id: "submitted",
    header: "Submitted",
    accessor: (row) => row.submitted,
    sortable: true,
  },
];

export const ApprovalPage = () => {
  const state = useTableState({ initialPerPage: 10 });
  const [selected, setSelected] = useState<Claim[]>([]);
  const [rejecting, setRejecting] = useState(false);

  const count = selected.length;

  return (
    <SingleCardTemplate
      title="Approve expense claims"
      subtitle="Select the claims to decide on, then approve or reject them together."
      width="wide"
    >
      <DataTable
        mode="client"
        columns={columns}
        data={CLAIMS}
        state={state}
        queryKey={["sample-claims"]}
        enableRowSelection
        onSelectionChange={setSelected}
        searchPlaceholder="Search claims"
        refreshPosition="start"
        rightSlot={
          <>
            <Button
              variant="outline"
              startIcon={<PiCheck className="size-4" />}
              disabled={count === 0}
              onClick={() => {
                toast.success(`Approved ${count} claim(s)`);
                setSelected([]);
              }}
            >
              Approve ({count})
            </Button>
            {/* Destructive, so it routes through ConfirmDialog rather than firing
                directly — components-rules.md, and doubly so for a bulk action. */}
            <Button
              variant="outline"
              startIcon={<PiX className="size-4" />}
              disabled={count === 0}
              onClick={() => setRejecting(true)}
            >
              Reject ({count})
            </Button>
          </>
        }
      />

      <ConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title="Reject selected claims"
        description={`This rejects ${count} claim(s). Each claimant will be notified and can resubmit.`}
        confirmLabel="Reject"
        variant="secondary"
        onConfirm={() => {
          toast.success(`Rejected ${count} claim(s)`);
          setRejecting(false);
        }}
      />
    </SingleCardTemplate>
  );
};
