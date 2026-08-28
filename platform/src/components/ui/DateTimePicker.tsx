/**
 * DateTimePicker
 *
 * One component, two visible fields: a date field (the standalone DatePicker, reused rather than
 * reimplemented, so the calendar, the tolerant typing and the parse-on-blur behave identically in
 * both places) and a time field beside it. The pair share a single `value`/`onChange`, so a form
 * still binds one control and shows one error.
 *
 * Two fields rather than a time control inside the calendar popover, for a concrete reason:
 * `InputGroupAddon` focuses its text input on click, and React propagates through the React tree,
 * so a non-button control inside a popup the addon hosts has its focus pulled away the moment it is
 * clicked. Keeping the time input out of the InputGroup avoids that by construction instead of by
 * patching a shared primitive.
 *
 * `value`/`onChange` speak offset-aware ISO (`2026-03-12T14:30:00+08:00`) via
 * DateTimeUtils.convertToDatetimeOffset, because a datetime without an offset is one the server has
 * to guess at; a Postgres `timestamptz` round-trips this unambiguously.
 *
 * Both halves are this repo's own components, so both are tokenised and both behave the same way:
 * type into the field or pick from the popover. The time half used to be the native
 * `<input type="time">`, whose dropdown is browser chrome that no CSS reaches and whose 12h/24h
 * rendering followed the viewer's OS locale with no attribute to override it — see TimePicker.
 *
 * All formatting and parsing goes through DateTimeUtils, never inline date-fns
 * (`.claude/rules/utils-rules.md`).
 */

import { useId } from "react";
import { DatePicker } from "@framework/components/ui/DatePicker";
import { TimePicker } from "@framework/components/ui/TimePicker";
import { Field, FieldGroup, FieldLabel } from "@framework/components/ui/field";
import { DateTimeUtils } from "@framework/lib";

export const DateTimePicker = ({
  value,
  onChange,
  withSeconds = false,
  error,
  className,
}: {
  /** Offset-aware ISO, e.g. `2026-03-12T14:30:00+08:00`. */
  value: string;
  /** Called with offset-aware ISO. */
  onChange: (v: string) => void;
  /** Show and keep seconds. Off by default — internal tools rarely schedule to the second. */
  withSeconds?: boolean;
  error?: string;
  className?: string;
}) => {
  // Two of these can share a page, so the time field's id has to be per-instance.
  const timeId = useId();

  const date = value ? DateTimeUtils.stringToDate(value) : undefined;

  /**
   * Each half changes only its own part of the value. The failure mode of a split picker is one
   * field silently zeroing the other, so both handlers start from what is already held.
   */
  const handleDateChange = (next: string) => {
    if (!next) return;
    const d = DateTimeUtils.stringToDate(next);
    if (!d) return;
    // Keep the time already entered; midnight only when there was none.
    if (date) {
      d.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), 0);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    onChange(DateTimeUtils.convertToDatetimeOffset(d));
  };

  const handleTimeChange = (next: string) => {
    const [h, m, s] = next.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    // No date yet? Take today, so entering a time alone still produces a value.
    const d = date ? new Date(date) : new Date();
    d.setHours(h, m, withSeconds ? s || 0 : 0, 0);
    onChange(DateTimeUtils.convertToDatetimeOffset(d));
  };

  const dateValue = date ? DateTimeUtils.formatDateStd(date) : "";
  // TimePicker always stores HH:mm:ss; `withSeconds` only governs what it shows.
  const timeValue = date ? DateTimeUtils.formatTimeStd(date) : "";

  return (
    <div className={className}>
      {/* Responsive rather than a fixed row: the two fields sit side by side where
          there is room and stack below sm, which a date field plus a time field
          cannot do in a single 375px row without either one becoming unusable. */}
      <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <Field>
          <FieldLabel htmlFor={`${timeId}-date`}>Date</FieldLabel>
          {/* DatePicker owns the calendar, the tolerant parsing and the yyyy-MM-dd
              normalisation — this component only decides what to do with the result. */}
          <DatePicker
            id={`${timeId}-date`}
            value={dateValue}
            onChange={handleDateChange}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={timeId}>Time</FieldLabel>
          <TimePicker
            id={timeId}
            value={timeValue}
            onChange={handleTimeChange}
            withSeconds={withSeconds}
          />
        </Field>
      </FieldGroup>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};
