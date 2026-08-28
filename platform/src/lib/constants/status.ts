import type { BadgeVariant } from "@framework/types/table";

/**
 * Conventional status-word → Badge variant mapping, for a DataTable `badge` column's `variants`
 * map to spread or borrow from. Not applied automatically — a column still states its own
 * `variants` explicitly (`platform/src/types/table.ts`'s `BadgeFormat`), so a status this map
 * doesn't cover is a deliberate choice by whoever wrote the column, not a guess made for them.
 *
 * Keys are lower-kebab; a column's runtime lookup normalises the raw value the same way before
 * matching (`"On Hold"` -> `"on-hold"`).
 */
export const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  approved: "success",
  active: "success",
  completed: "success",
  paid: "success",

  pending: "outline",
  draft: "outline",
  submitted: "outline",

  suspended: "warning",
  "on-hold": "warning",
  overdue: "warning",

  rejected: "destructive",
  failed: "destructive",
  cancelled: "destructive",
};
