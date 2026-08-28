/**
 * Pagination
 *
 * Wrapper around shadcn Pagination primitives.
 * Handles all logic: page number generation, ellipsis, disabled states.
 * shadcn handles markup and accessibility.
 *
 * Props:
 * - totalItems: total record count (after filtering)
 * - currentPage: 1-based current page
 * - resultsPerPage: rows per page
 * - onPageChange: called when user navigates
 * - onResultsPerPageChange: omit to hide the page size selector
 * - pageSizeOptions: defaults to PAGINATION.PAGE_SIZE_OPTIONS
 */

import { appConfig } from "@framework/app/appConfig";
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@framework/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaginationProps = {
  totalItems: number;
  currentPage: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the results-per-page selector */
  onResultsPerPageChange?: (perPage: number) => void;
  pageSizeOptions?: number[]; // default from appConfig [10, 25, 50, 100, 200]
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [1];

  if (currentPage <= 4) {
    pages.push(2, 3, 4, 5, null);
  } else if (currentPage >= totalPages - 3) {
    pages.push(
      null,
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
    );
  } else {
    pages.push(null, currentPage - 1, currentPage, currentPage + 1, null);
  }

  pages.push(totalPages);
  return pages;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Pagination = ({
  totalItems,
  currentPage,
  resultsPerPage,
  onPageChange,
  onResultsPerPageChange,
  pageSizeOptions = appConfig.config.app.paginationOptions,
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / resultsPerPage));
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const goTo = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (value: string) => {
    onResultsPerPageChange?.(Number(value));
    onPageChange(1);
  };

  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * resultsPerPage + 1;
  const endItem = Math.min(currentPage * resultsPerPage, totalItems);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4 mt-4">
      {/* Left: shadcn pagination controls */}
      <ShadcnPagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => goTo(currentPage - 1)}
              aria-disabled={currentPage === 1}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-40"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {pageNumbers.map((page, index) =>
            page === null ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={`page-${page}`}>
                <PaginationLink
                  onClick={() => goTo(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => goTo(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-40"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </ShadcnPagination>

      {/* Right: item count + optional page size selector */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {totalItems === 0
            ? "No results"
            : `${startItem}–${endItem} of ${totalItems}`}
        </span>

        {onResultsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline whitespace-nowrap">
              Rows per page
            </span>
            <Select
              value={resultsPerPage.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
