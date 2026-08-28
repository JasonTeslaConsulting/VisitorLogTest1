/**
 * TableSkeleton
 *
 * Loading placeholder rows. Renders `<TableRow>`s meant to sit *inside* a real
 * `<TableBody>` — that is what keeps the real header visible and the real column
 * widths intact while loading (components-rules.md). A standalone block skeleton
 * can do neither.
 */

import { Skeleton } from "@framework/components/ui/skeleton";
import { TableCell, TableRow } from "@framework/components/ui/table";

type TableSkeletonProps = {
  columns: number;
  rows?: number;
};

export const TableSkeleton = ({ columns, rows = 5 }: TableSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
