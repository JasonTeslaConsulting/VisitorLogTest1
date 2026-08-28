/**
 * RowActionsCell
 *
 * The last column of a DataTable row.
 *
 * One action renders as a bare icon button; two or more collapse into a ⋮ menu —
 * the same rule `ActionButtonGroup` uses for page headers, so a single action
 * never costs the user an extra click to discover.
 *
 * Destructive actions never fire directly; they route through `ConfirmDialog`
 * (components-rules.md).
 */

import { useState } from "react";
import { PiDotsThreeVertical, PiWarning } from "react-icons/pi";
import { Button } from "@framework/components/ui/button";
import { ConfirmDialog } from "@framework/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@framework/components/ui/dropdown-menu";
import type { RowAction } from "@framework/types/table";

type RowActionsCellProps = {
  actions: RowAction[];
};

export const RowActionsCell = ({ actions }: RowActionsCellProps) => {
  const [pending, setPending] = useState<RowAction | null>(null);

  const run = (action: RowAction) => {
    if (action.destructive) {
      setPending(action);
      return;
    }
    action.onClick();
  };

  if (actions.length === 0) return null;

  const confirmDialog = pending && (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && setPending(null)}
      title={pending.label}
      description={`This will ${pending.label.toLowerCase()} the selected record. This cannot be undone.`}
      confirmLabel={pending.label}
      variant="secondary"
      onConfirm={() => {
        pending.onClick();
        setPending(null);
      }}
    />
  );

  // Single action — render it directly rather than hiding it behind a menu.
  if (actions.length === 1) {
    const action = actions[0];
    const Icon = action.icon ?? PiWarning;
    return (
      <>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={action.disabled}
          onClick={() => run(action)}
          aria-label={action.label}
        >
          <Icon className="size-4" />
        </Button>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Row actions" />
          }
        >
          <PiDotsThreeVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              variant={action.destructive ? "destructive" : "default"}
              onClick={() => run(action)}
            >
              {action.icon && <action.icon className="size-4" />}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {confirmDialog}
    </>
  );
};
