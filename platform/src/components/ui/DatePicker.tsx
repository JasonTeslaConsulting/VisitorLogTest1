import type React from "react";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@framework/components/ui/popover";
import { Calendar } from "@framework/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@framework/components/ui/input-group";
import { PiCalendar } from "react-icons/pi";
import { DateTimeUtils } from "@framework/lib";

export const DatePicker = ({
  id,
  value,
  onChange,
  error,
  className,
}: {
  /** Lands on the text input, so a FieldLabel's htmlFor can reach it. */
  id?: string;
  /** ISO date, `yyyy-MM-dd`. */
  value: string;
  /** Called with `yyyy-MM-dd`. */
  onChange: (v: string) => void;
  error?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(DateTimeUtils.formatDate(value));
  const [isFocused, setIsFocused] = useState(false);

  // only sync from external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(DateTimeUtils.formatDate(value));
    }
  }, [value, isFocused]);

  // stringToDate (parseISO), not new Date(value): `new Date("2026-03-12")` is parsed as UTC
  // midnight, which lands on the previous day — and so highlights the wrong calendar cell — for
  // any reader west of UTC.
  const date = value ? DateTimeUtils.stringToDate(value) : undefined;
  const [month, setMonth] = useState<Date | undefined>(date);

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    onChange(DateTimeUtils.formatDateStd(d));
    setInputValue(DateTimeUtils.formatDate(d));
    setMonth(d);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // just update display - don't parse yet
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Parse on blur, not per keystroke, so a half-typed date isn't rejected mid-entry.
    const parsed = DateTimeUtils.parseUserDate(inputValue);
    if (parsed) {
      onChange(DateTimeUtils.formatDateStd(parsed));
      setInputValue(DateTimeUtils.formatDate(parsed)); // normalise display
      setMonth(parsed);
      return;
    }

    // Nothing parsed — revert to the last known good value rather than clearing.
    setInputValue(DateTimeUtils.formatDate(value));
  };

  return (
    <div className={className}>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          placeholder="DD-MMM-YYYY"
          aria-invalid={!!error}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <InputGroupButton
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Select date"
                >
                  <PiCalendar />
                </InputGroupButton>
              }
            />
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleSelect}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};
