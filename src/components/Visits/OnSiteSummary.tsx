import { useEffect, useRef } from "react";
import { PiUsers } from "react-icons/pi";

import { Badge } from "@framework/components/ui/badge";
import { EmptyState } from "@framework/components/ui/EmptyState";
import { Separator } from "@framework/components/ui/separator";
import { Skeleton } from "@framework/components/ui/skeleton";
import { toast } from "@framework/components/ui/toast";
import { DateTimeUtils } from "@framework/lib";
import { useVisits } from "@/hooks/visitor/useVisits";
import type { ListVisitsParams } from "@/types/visitor";

// Both OnSiteStats and OnSiteList call useVisits with this identical params object — TanStack
// Query dedupes identical query keys into one network request, so this is intentional.
const ON_SITE_PARAMS: ListVisitsParams = {
  status: "active",
  page: 1,
  perPage: 200,
  sort: { field: "entrydate", direction: "asc" },
};

// A row is overdue when it was checked in on a previous calendar day and never checked out.
// Every row here is already active (exitdate is null), so this reduces to comparing dates.
function isOverdue(entryDate: string): boolean {
  return new Date(entryDate).toDateString() !== new Date().toDateString();
}

export function OnSiteStats() {
  const { data, isLoading, isError } = useVisits(ON_SITE_PARAMS);

  const errorToasted = useRef(false);
  useEffect(() => {
    if (errorToasted.current) return;
    if (isError) {
      errorToasted.current = true;
      toast.error("Unable to load who's on site. Please try again.");
    }
  }, [isError]);

  if (isError) {
    return <p className="text-sm text-muted-foreground">Unable to load</p>;
  }

  const rows = data?.rows ?? [];
  const overdueCount = rows.filter((row) => isOverdue(row.entryDate)).length;

  return (
    <div className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <div>
          <p className="text-2xl font-semibold text-foreground">
            {rows.length}
          </p>
          <p className="text-sm text-muted-foreground">
            People currently on site
          </p>
        </div>
      )}
      <Separator />
      {isLoading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <div>
          <p className="text-2xl font-semibold text-foreground">
            {overdueCount}
          </p>
          <p className="text-sm text-muted-foreground">
            Checked in on a previous day
          </p>
        </div>
      )}
    </div>
  );
}

export function OnSiteList() {
  const { data, isLoading, isError } = useVisits(ON_SITE_PARAMS);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Unable to load</p>;
  }

  const rows = data?.rows ?? [];

  if (rows.length === 0) {
    return <EmptyState icon={PiUsers} title="No one is currently on site" />;
  }

  return (
    <ul className="space-y-3 text-sm">
      {rows.map((row) => (
        <li key={row.visitorRegisterId}>
          <p className="text-foreground">
            {row.fullName}
            {isOverdue(row.entryDate) && (
              <Badge variant="warning" className="ml-2">
                Overdue
              </Badge>
            )}
          </p>
          <p className="text-muted-foreground">
            {DateTimeUtils.calcDurationText(row.entryDate, new Date())}
          </p>
        </li>
      ))}
    </ul>
  );
}
