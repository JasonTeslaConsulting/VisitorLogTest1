/**
 * SearchBar
 *
 * Controlled search input for data table pages.
 *
 * The input keeps its own display state so typing stays instant, while
 * `onChange` fires debounced — that combination is what makes it safe to wire
 * straight to a TanStack Query key without a request per keystroke.
 *
 * Props:
 * - value: the committed search term (from useTableState)
 * - onChange: called with the debounced search string
 * - placeholder: input placeholder text (optional)
 * - debounceMs: debounce delay in ms, defaults to 300
 * - className: additional classes for the wrapper (optional)
 */

import { useEffect, useRef, useState } from "react";
import { PiMagnifyingGlass, PiX } from "react-icons/pi";
import { Input } from "@framework/components/ui/input";
import { cn } from "@framework/lib/shadcn/shadcn-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms. Defaults to 300. */
  debounceMs?: number;
  className?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
}: SearchBarProps) => {
  const [draft, setDraft] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Accept resets driven from outside (a "clear all filters" button, a route
  // change) without fighting the user mid-keystroke.
  useEffect(() => {
    setDraft((current) => (current === value ? current : value));
  }, [value]);

  // Debounce the commit, not the keystroke.
  useEffect(() => {
    if (draft === value) return;

    timerRef.current = setTimeout(() => {
      onChangeRef.current(draft);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, value, debounceMs]);

  const handleClear = () => {
    setDraft("");
    // Fire immediately on clear — no reason to make the user wait for the debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    onChangeRef.current("");
  };

  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <PiMagnifyingGlass
        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <Input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8 h-9 text-sm"
        aria-label={placeholder}
      />
      {/* Clear button — only visible when there's input */}
      {draft && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
          type="button"
        >
          <PiX className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
