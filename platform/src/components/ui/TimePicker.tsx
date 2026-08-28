/**
 * TimePicker
 *
 * Peer of DatePicker, and built to the same shape: a text field you can type into, plus a popover
 * holding the picker. Composed by DateTimePicker exactly as DatePicker is.
 *
 * It exists because the native `<input type="time">` cannot be styled. Its dropdown is browser
 * chrome rather than page DOM, so no CSS reaches it — the selected time could not be given
 * `--color-primary`, and whether it rendered 12h or 24h followed the viewer's OS locale with no
 * attribute to override it (`lang` has no effect). Owning the popover fixes both at once: it is
 * tokenised like the rest of the app, and it is 24-hour for everyone.
 *
 * Every option is a `<button>` on purpose, and not only for semantics. `InputGroupAddon` focuses its
 * text input on any click that is not on a button, and React propagates through the React tree, so a
 * non-button control inside this popover would have its focus stolen the instant it was clicked —
 * which is exactly what the native input did when it lived here. Keeping options as buttons keeps
 * that primitive untouched.
 *
 * Parsing goes through DateTimeUtils.parseUserTime, never inline (`.claude/rules/utils-rules.md`).
 */

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@framework/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@framework/components/ui/input-group";
import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { DateTimeUtils } from "@framework/lib";
import { PiClock } from "react-icons/pi";

const pad = (n: number) => String(n).padStart(2, "0");
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Display form: the stored value always carries seconds, the shown one may not. */
const toDisplay = (value: string, withSeconds: boolean) => {
  if (!value) return "";
  const [h = "", m = "", s = ""] = value.split(":");
  return withSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
};

const Column = ({
  label,
  values,
  selected,
  onSelect,
  open,
}: {
  label: string;
  values: number[];
  selected: number | undefined;
  onSelect: (v: number) => void;
  open: boolean;
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Bring the selected option into view when the popover opens. A 60-row minute column
  // otherwise opens at 00 with the current value somewhere far below.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector("[data-selected=true]");
    el?.scrollIntoView({ block: "center" });
  }, [open, selected]);

  return (
    // w-20 rather than letting the column hug its digits: two characters in a
    // px-3 button collapses to a ~65px column, which reads cramped and gives the
    // selected/hover bar almost no body. One class to retune if it wants to be
    // wider or narrower still.
    <div className="flex w-20 min-w-0 flex-col">
      <div className="pb-1 text-center text-label-sm text-muted-foreground">
        {label}
      </div>
      <div
        ref={listRef}
        className="flex max-h-56 flex-col gap-0.5 overflow-y-auto px-1"
      >
        {values.map((v) => {
          const isSelected = v === selected;
          return (
            <button
              key={v}
              type="button"
              data-selected={isSelected}
              onClick={() => onSelect(v)}
              className={cn(
                "cursor-pointer rounded-sm px-2 py-1 text-center text-sm tabular-nums transition-colors",
                "hover:bg-primary-hover hover:text-primary-foreground",
                isSelected
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-foreground",
              )}
            >
              {pad(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TimePicker = ({
  id,
  value,
  onChange,
  withSeconds = false,
  error,
  className,
}: {
  /** Lands on the text input, so a FieldLabel's htmlFor can reach it. */
  id?: string;
  /** 24-hour `HH:mm:ss`. */
  value: string;
  /** Called with 24-hour `HH:mm:ss`. */
  onChange: (v: string) => void;
  /** Show a seconds column and keep seconds in the display. */
  withSeconds?: boolean;
  error?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(toDisplay(value, withSeconds));
  const [isFocused, setIsFocused] = useState(false);

  // Only sync from the external value while unfocused, or typing fights the parent's state.
  useEffect(() => {
    if (!isFocused) {
      setInputValue(toDisplay(value, withSeconds));
    }
  }, [value, isFocused, withSeconds]);

  const [h, m, s] = value ? value.split(":").map(Number) : [];

  const commit = (hours: number, minutes: number, seconds: number) => {
    const next = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    onChange(next);
    setInputValue(toDisplay(next, withSeconds));
  };

  // Picking one column must not reset the others, so each falls back to what is already held.
  const handlePart = (part: "h" | "m" | "s") => (v: number) =>
    commit(
      part === "h" ? v : (h ?? 0),
      part === "m" ? v : (m ?? 0),
      part === "s" ? v : (s ?? 0),
    );

  const handleBlur = () => {
    setIsFocused(false);

    // Parse on blur, not per keystroke, so a half-typed time isn't rejected mid-entry.
    const parsed = DateTimeUtils.parseUserTime(inputValue);
    if (parsed) {
      onChange(parsed);
      setInputValue(toDisplay(parsed, withSeconds)); // normalise display
      return;
    }

    // Nothing parsed — revert to the last known good value rather than clearing.
    setInputValue(toDisplay(value, withSeconds));
  };

  return (
    <div className={className}>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInputValue(e.target.value)
          }
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          placeholder={withSeconds ? "HH:MM:SS" : "HH:MM"}
          aria-invalid={!!error}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Select time"
                >
                  <PiClock />
                </InputGroupButton>
              }
            />
            <PopoverContent
              className="w-auto overflow-hidden p-3"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <div className="flex gap-1">
                <Column
                  label="Hr"
                  values={range(24)}
                  selected={h}
                  onSelect={handlePart("h")}
                  open={open}
                />
                <Column
                  label="Min"
                  values={range(60)}
                  selected={m}
                  onSelect={handlePart("m")}
                  open={open}
                />
                {withSeconds && (
                  <Column
                    label="Sec"
                    values={range(60)}
                    selected={s}
                    onSelect={handlePart("s")}
                    open={open}
                  />
                )}
              </div>
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};
