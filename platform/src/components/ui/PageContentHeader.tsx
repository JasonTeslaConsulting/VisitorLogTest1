/**
 * PageContentHeader
 *
 * The title block every page template renders: title, optional one-line subtitle,
 * and an optional right-aligned action cluster.
 *
 * `align` is passed by the template, never chosen by the page — a narrow form
 * centres its header over the form's width, a wide page left-aligns it with the
 * card's edge (DESIGN.md §7).
 *
 * `subtitle` is optional: DESIGN.md §8 treats it as available but usually omitted,
 * reached for only when the title alone doesn't convey what the screen is for.
 */

import { cn } from "@framework/lib/shadcn/shadcn-utils";

type PageContentHeaderProps = {
  title: string;
  subtitle?: string;
  /** Set by the template. Defaults to "start". */
  align?: "start" | "center";
  /** Right-aligned action cluster (ignored when align is "center"). */
  children?: React.ReactNode;
  className?: string;
};

export const PageContentHeader = ({
  title,
  subtitle,
  align = "start",
  children,
  className,
}: PageContentHeaderProps) => {
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "flex gap-4",
        isCentered
          ? "flex-col items-center text-center"
          : "flex-wrap items-start justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-heading text-title-lg font-semibold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {children && (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      )}
    </div>
  );
};
