import * as DateFns from "date-fns";
import {
  isEmpty,
  isUndefined,
  isDate,
  isString,
  isNullOrUndefined,
  replaceString,
} from "./functions";
import { first } from "lodash";

/**
 * Supported Format Options.
 */
const __formatOptions: any = {
  standard: {
    name: "en-sg",
    date: "yyyy-MM-dd",
    time: "HH:mm:ss",
    dateTime: "yyyy-MM-dd HH:mm:ss",
    dateTimeLong: "yyyy-MM-dd HH:mm:ss.SSS",
    month: "yyyy-MM",
    year: "yyyy",
    tzName: "Asia/Singapore",
    tzDisplay: "Singapore Standard Time",
  },
  standard1: {
    name: "en-sg",
    date: "yyyyMMdd",
    time: "HHmmss",
    dateTime: "yyyyMMddHHmmss",
    dateTimeLong: "yyyyMMddHH:mm:ss.SSS",
    month: "yyyyMM",
    year: "yyyy",
    tzName: "Asia/Singapore",
    tzDisplay: "Singapore Standard Time",
  },
  "en-sg": {
    name: "en-sg",
    date: "dd MMM yyyy",
    time: "HH:mm:ss",
    dateTime: "dd MMM yyyy HH:mm:ss",
    dateTimeLong: "dd MMM yyyy HH:mm:ss.SSS",
    month: "MMM yyyy",
    year: "yyyy",
    tzName: "Asia/Singapore",
    tzDisplay: "Singapore Standard Time",
  },
};

const __default = __formatOptions["en-sg"];
let __standard = __formatOptions["standard"];
const __standard1 = __formatOptions["standard1"];
let __currentOption = __default; // Current options.
const __serverDateTimeInfo = {
  enabledSystemDate: false,
  systemDate: new Date(),
  systemDateUtc: null,
  timeZoneID: "Singapore Standard Time",
  timeZoneDisplayName: "(UTC+08:00) Kuala Lumpur, Singapore",
  timeZoneUtcOffset: "08:00",
  tzOffset: "+08:00",
  differentInSeconds: 0,
};

/**
 * Format datetime to string.
 * @param input
 * @param format
 */
function __format(
  input: Date | string | number | null | undefined,
  format: string,
): string {
  if (
    input === undefined ||
    input === null ||
    isEmpty(input) ||
    input === "Invalid Date"
  ) {
    return "";
  }

  try {
    if (isString(input)) {
      const offset = "+" + __serverDateTimeInfo.timeZoneUtcOffset;
      let s = input as string;
      if (s && s.endsWith(offset)) {
        s = s.replace(offset, "");
      }
      const d = DateFns.parseISO(s);
      const res = DateFns.format(d, format);
      return res;
    } else {
      return DateFns.format(input as Date, format);
    }
  } catch (e) {
    return "";
  }
}

/**
 * Parse datetime
 * @param input
 * @param options
 */
function __parse(
  input: Date | string | null | undefined,
  options: any = undefined,
): Date | undefined {
  try {
    if (isUndefined(input)) {
      return undefined;
    }
    if (isDate(input)) {
      return input as Date;
    }
    const normalized = replaceString(input as string, "/", "-");
    return DateFns.parseISO(normalized, options);
  } catch {
    return undefined;
  }
}

/**
 *
 */
function __calcDuration(
  start: string | Date | undefined = undefined,
  end: string | Date | undefined = undefined,
  roundUpSecond: boolean = false,
): null | { year: number; month: number; day: number; hour: number } {
  if (isEmpty(start) || isEmpty(end)) {
    return null;
  }

  let startDate = __parse(start);
  let endDate = __parse(end);

  if (startDate === undefined || endDate === undefined) {
    return null;
  }

  //convert both to date so can compare correctly in UI (javascript):
  startDate = DateFns.addSeconds(startDate, 0);
  const startDateYear = DateFns.getYear(startDate);
  const startDateMonth = DateFns.getMonth(startDate);
  const startDateDate = DateFns.getDate(startDate);
  const startDateHours = DateFns.getHours(startDate);
  const startDateMinutes = DateFns.getMinutes(startDate);
  const startDateSeconds = DateFns.getSeconds(startDate);
  const startDateMilliseconds = DateFns.getMilliseconds(startDate);
  let starthourIsZero = false;
  if (roundUpSecond) {
    if (startDateHours == 0) {
      starthourIsZero = true;
      endDate = DateFns.addSeconds(endDate, 1);
    } else {
      endDate = DateFns.addSeconds(endDate, 0);
    }
  } else {
    endDate = DateFns.addSeconds(endDate, 0);
  }
  const endDateYear = DateFns.getYear(endDate);
  const endDateMonth = DateFns.getMonth(endDate);
  const endDateDate = DateFns.getDate(endDate);
  const endDateHours = DateFns.getHours(endDate);
  const endDateMinutes = DateFns.getMinutes(endDate);
  const endDateSeconds = DateFns.getSeconds(endDate);
  const endDateMilliseconds = DateFns.getMilliseconds(endDate);
  const endDateModified: string | number | Date = new Date(
    endDateYear,
    endDateMonth,
    endDateDate,
    endDateHours,
    endDateMinutes,
    endDateSeconds,
    endDateMilliseconds,
  );
  let startDateModified: string | number | Date = new Date(
    startDateYear,
    startDateMonth,
    startDateDate,
    startDateHours,
    startDateMinutes,
    startDateSeconds,
    startDateMilliseconds,
  );

  let monthsAlreadyCounted: number = 0;

  //1. calculate number of year(s):
  const dY = Math.abs(
    DateFns.differenceInYears(endDateModified, startDateModified),
  );

  //2. calculate number of month(s):
  //forward start-date with months of the years that already calculated:
  monthsAlreadyCounted = dY * 12; //month is fixed so can do this one to substract the correct number of months.
  startDateModified = DateFns.addMonths(
    startDateModified,
    monthsAlreadyCounted,
  );
  const dM = Math.abs(
    DateFns.differenceInMonths(endDateModified, startDateModified),
  );

  //3. calculate number of day(s):
  //forward start-date with months that already calculated:
  startDateModified = DateFns.addMonths(startDateModified, dM);
  const dD = Math.abs(
    DateFns.differenceInDays(endDateModified, startDateModified),
  );

  //4. calculate number of hour(s):
  //forward start-date with days that already calculated:
  startDateModified = DateFns.addDays(startDateModified, dD);
  let dH = Math.abs(
    DateFns.differenceInHours(endDateModified, startDateModified),
  );
  if (!starthourIsZero) {
    //special case (if start-date hour not 00:00:00 then plus 1 hour):
    dH = dH + 1;
  }

  return { year: dY, month: dM, day: dD, hour: dH };

  // if (!returnObject) {
  //     //return "" + dY + " Year(s), " + dM + " Month(s), " + dD + " Day(s), " + dH + " Hour(s)";
  // } else {
  // }
}

/**
 * Create new Server Date object
 */
function __newDate(value: string | Date | undefined = undefined): Date {
  let res: Date | null = null;

  if (!isEmpty(value)) {
    if (isDate(value)) {
      res = value as Date;
    } else if (isString(value)) {
      const d = __parse(value as string);
      if (d !== undefined) {
        res = d;
      }
    }
  }

  if (res === null) {
    const { differentInSeconds } = __serverDateTimeInfo;
    const date =
      differentInSeconds === 0 ||
      differentInSeconds === null ||
      differentInSeconds == undefined
        ? new Date()
        : DateFns.addSeconds(new Date(), differentInSeconds);
    return date;
  } else {
    return res;
  }
}

// EXPORT FUNCTIONS
/**
 * Load Supported Options.
 * @param options override options, for sample: { "en-sg" : { date : "DD MMM YYYY" } }
 */
export function loadSupportedOptions(options: any) {
  if (isNullOrUndefined(options)) {
    Object.assign(__formatOptions, options);
  }
  if (isNullOrUndefined(__formatOptions["standard"])) {
    __standard = __formatOptions["standard"];
  }
  if (isNullOrUndefined(__formatOptions["standard1"])) {
    __standard = __formatOptions["standard"];
  }
}
/**
 * Initialize DateTime Utils
 * @param locale locale name: en-sg, en-us....
 * @param options override options, for sample: { "en-sg" : { date : "DD MMM YYYY" } }
 */
export function initialize(locale: string, options: any = undefined) {
  if (isEmpty(locale)) {
    locale = "en-sg"; //fallback
  }
  if (isNullOrUndefined(options)) {
    Object.assign(__formatOptions, options);
  }

  let option = __formatOptions[locale.toLocaleLowerCase()];
  if (isNullOrUndefined(option)) {
    option = __default;
  }
  __currentOption = option;
}
/**
 * Parse ISO string to datetime
 * @param input
 * @param options
 */
export function stringToDate(
  input: string,
  options: any = undefined,
): Date | undefined {
  return __parse(input, options);
}
/**
 * Format Datetime.
 * @param input
 * @param format
 */
export function dateToString(
  input: Date | string | number | undefined,
  format: string,
): string {
  return __format(input, format);
}
/** Format datetime */
export function formatValue(
  input: Date | string | number | null | undefined,
  format: string,
) {
  return __format(input, format);
}
/** Format datetime */
export function formatDateFromText(s: string): string | undefined {
  if (s === undefined || s === null || s === "") return undefined;
  s = replaceString(s, "  ", " ").trim();
  const months: any = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const p = s.indexOf(" ") > 0 ? s.split(" ") : s.split("-");
  try {
    return __format(
      new Date(parseInt(p[2]), months[p[1].toLowerCase()], parseInt(p[0])),
      __standard.date,
    );
  } catch (e) {
    try {
      return __format(
        new Date(parseInt(p[2]), months[parseInt(p[1])], parseInt(p[0])),
        __standard.date,
      );
    } catch (e) {
      return undefined;
    }
  }
}
/** Parse Date Time */
export function parseDateTime(
  input: string | Date | undefined | null,
): Date | undefined {
  return __parse(input);
}
/**
 * Set Server Date Time
 * @param serverDateTime
 */
export function syncServerTime(item: any): void {
  if (item === undefined && item === null) return;
  Object.assign(__serverDateTimeInfo, item);
}
/**
 * Return start of date in ISO format. 'YYYY-MM-DDT00:00:00'
 */
export function convertToDatetimeOffset(
  input: Date | string | number | undefined,
): string {
  if (input === undefined || input === null || input === "") return "";
  return (
    __format(input, "yyyy-MM-dd") +
    "T" +
    __format(input, "HH:mm:ss") +
    "+" +
    __serverDateTimeInfo.timeZoneUtcOffset
  );
}
/**
 * Get Timezone Utc Offset
 */
export function timeZoneUtcOffset(): string {
  return __serverDateTimeInfo.timeZoneUtcOffset;
}
/**
 * Get Timezone Utc Offset
 */
export function timeZoneId(): string {
  return __serverDateTimeInfo.timeZoneID;
}
/**
 * Convert timezone
 * @param date
 * @param timezone
 * @returns
 */
export function convertTZ(
  date: Date | string,
  timezone: string | undefined = undefined,
): Date | string {
  return date;
  //if (timezone === undefined) timezone = __currentOption.tzName;
  //return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString(__currentOption.name, { timeZone: timezone }));
}
/**
 * Get Timezone Display
 */
export function timezoneDisplay(): string {
  return __currentOption.tzDisplay;
}
/**
 * Create new Server Date object
 */
export function newDate(value: string | Date | undefined = undefined): Date {
  return __newDate(value);
}
/**
 * Format Date
 * @param input
 */
export function formatDate(input: Date | string | number | undefined): string {
  return __format(input, __currentOption.date);
}
/**
 * Format Time
 * @param input
 */
export function formatTime(input: Date | string | number | undefined): string {
  return __format(input, __currentOption.time);
}
/**
 * Format Date Time
 * @param input
 */
export function formatDateTime(
  input: Date | string | number | undefined,
): string {
  return __format(input, __currentOption.dateTime);
}
/**
 * Format Datetime with milisecond
 * @param input
 */
export function formatDateTimeLong(
  input: Date | string | number | undefined,
): string {
  return __format(input, __currentOption.dateTimeLong);
}
/**
 * Format Month Year
 * @param input
 */
export function formatMonth(input: Date | string | number | undefined): string {
  return __format(input, __currentOption.month);
}
/**
 * Format Year
 * @param input
 */
export function formatYear(input: Date | string | number | undefined): string {
  return __format(input, __currentOption.year);
}
/**
 * Format Date standard
 * @param input
 */
export function formatDateStd(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard.date);
}
/**
 * Format Time standard
 * @param input
 */
export function formatTimeStd(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard.time);
}
/**
 * Format Time standard
 * @param input
 */
export function formatTimeNoSecondStd(
  input: Date | string | number | undefined,
): string {
  return __format(input, "HH:mm");
}
/**
 * Parse a date a user typed, tolerantly.
 *
 * For text fields where the user may type in any of the shapes the app displays or that a
 * spreadsheet paste produces. Returns undefined rather than throwing or guessing, so a caller can
 * revert to its last known good value.
 *
 * Deliberately NOT formatDateFromText(): that one splits on "-" and maps the pieces as
 * day-month-year, so "2026-03-12" silently yields new Date(12, undefined, 2026) — garbage that
 * looks like a successful parse. This tries whole formats and validates the result.
 */
export function parseUserDate(input: string): Date | undefined {
  if (isEmpty(input)) return undefined;
  const s = replaceString(input.trim(), "  ", " ");
  for (const fmt of [
    "dd MMM yyyy",
    "dd-MMM-yyyy",
    "dd/MM/yyyy",
    "yyyy-MM-dd",
    "MM/dd/yyyy",
  ]) {
    const parsed = DateFns.parse(s, fmt, new Date());
    if (DateFns.isValid(parsed)) return parsed;
  }
  return undefined;
}
/**
 * Parse a time a user typed, tolerantly. Returns normalised 24-hour `HH:mm:ss`, or undefined.
 *
 * Explicit patterns rather than one permissive regex: a greedy `\d{1,2}` hour turns "930" into
 * hour 93, and the match succeeds before anything can reject it. Ambiguous input returns undefined
 * instead of a confident wrong answer.
 */
export function parseUserTime(input: string): string | undefined {
  if (isEmpty(input)) return undefined;
  const s = input.trim();
  const patterns = [
    /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/, // 14:30, 9:5, 14:30:45
    /^(\d{2})(\d{2})(\d{2})?$/, // 1430, 143045
    /^(\d{1,2})$/, // 14
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;
    const h = Number(m[1]);
    const min = m[2] === undefined ? 0 : Number(m[2]);
    const sec = m[3] === undefined ? 0 : Number(m[3]);
    if (h > 23 || min > 59 || sec > 59) return undefined;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(min)}:${pad(sec)}`;
  }
  return undefined;
}
/**
 * Format DateTime standard
 * @param input
 */
export function formatDateTimeStd(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard.dateTime);
}
/**
 * Format Datetime standard with milisecond
 * @param input
 */
export function formatDateTimeLongStd(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard.dateTimeLong);
}
/**
 * Format Month Year standard
 * @param input
 */
export function formatMonthStd(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard.month);
}
/**
 * Format Year
 * @param input
 */
export function formatYearStd(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard.year);
}
/**
 * Format Date standard
 * @param input
 */
export function formatDateStd1(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard1.date);
}
/**
 * Format Time standard
 * @param input
 */
export function formatTimeStd1(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard1.time);
}
/**
 * Format DateTime standard
 * @param input
 */
export function formatDateTimeStd1(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard1.dateTime);
}
/**
 * Format Datetime standard with milisecond
 * @param input
 */
export function formatDateTimeLongStd1(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard1.dateTimeLong);
}
/**
 * Format Month Year standard
 * @param input
 */
export function formatMonthStd1(
  input: Date | string | number | undefined,
): string {
  return __format(input, __standard1.month);
}
/**
 * Return start of date in ISO format. 'YYYY-MM-DDT00:00:00+08:00'
 */
export function formatDateTimeStdStart(
  input: Date | string | number | undefined,
): string {
  if (input === undefined || input === null || input === "") return "";
  return (
    __format(input, "yyyy-MM-dd") +
    "T" +
    __format(input, "00:00:00" + __serverDateTimeInfo.tzOffset)
  );
}
/** */
export function formatDateTimeStdEnd(
  input: Date | string | number | undefined,
): string {
  if (input === undefined || input === null || input === "") return "";
  return (
    __format(input, "yyyy-MM-dd") +
    "T" +
    __format(input, "23:59:59" + __serverDateTimeInfo.tzOffset)
  );
}
/**
 * Calculate duration between 2 dates
 * @param start
 * @param end
 * @param roundUpSecond
 * @param returnObject
 * @param shortCalc
 */
export function calcDuration(
  start: string | Date | undefined = undefined,
  end: string | Date | undefined = undefined,
  roundUpSecond: boolean = false,
): null | { year: number; month: number; day: number; hour: number } {
  return __calcDuration(start, end, roundUpSecond);
}
/**
 * Calculate duration between 2 dates and convert to text.
 * @param start
 * @param end
 * @param roundUpSecond
 * @param returnObject
 * @param shortCalc
 */
export function calcDurationText(
  start: string | Date | undefined = undefined,
  end: string | Date | undefined = undefined,
  roundUpSecond: boolean = false,
  isFull: boolean = false,
): string {
  const d = __calcDuration(start, end, roundUpSecond);
  const formatPlural = function (v: number, t: string) {
    return v == 1 ? `${v} ${t}` : `${v} ${t}s`;
  };
  if (d === null) {
    return "";
  } else if (isFull) {
    return `${formatPlural(d.year, "year")}, ${formatPlural(d.month, "month")}, ${formatPlural(d.day, "day")}, ${formatPlural(d.hour, "hour")}`;
  } else {
    const duration =
      "" +
      (d.year && d.year > 0 ? `${formatPlural(d.year, "year")}, ` : "") +
      (d.month && d.month > 0 ? `${formatPlural(d.month, "month")}, ` : "") +
      (d.day && d.day > 0 ? `${formatPlural(d.day, "day")}, ` : "") +
      (d.hour && d.hour > 0 ? `${formatPlural(d.hour, "hour")}` : "");
    return duration.trim().replace(/,$/, "");
  }
}
/** Format duration text by inputted minutes */
export function formatDurationFromMinute(minutes: number): string {
  if (minutes == 0) return "0 minute(s)";
  if (minutes == 1) return "1 minute(s)";

  let text = "";
  const m = minutes % 60;
  if (m > 0) {
    text += m == 1 ? "1 minutes" : `${m} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    const h = hours % 24;
    if (h > 0) {
      text = (h == 1 ? "1 hour" : `${m} hours`) + ` ${text}`;
    }

    const d = Math.floor(hours / 24);
    if (d > 0) {
      text = (d == 1 ? "1 day" : `${m} days`) + ` ${text}`;
    }
  }
  return text;
}
/**
 * Format Date Time
 * @param input
 */
export function formatDateTimeWeek(input: Date): string {
  const w = getWeekDayFullName(input);
  const d = __format(input, "dd MM yyyy, HH:mm");
  return `${w}, ${d}`;
}
/**
 * Calculate duration between 2 dates in hour and convert to text.
 * @param start
 * @param end
 * @param roundUpSecond
 */
export function calcDurationInHourText(
  start: Date,
  end: Date,
  roundUpSecond: boolean = false,
): string {
  const daterightHours = DateFns.getHours(end);
  if (roundUpSecond && daterightHours == 0) {
    start = DateFns.addSeconds(start, 1);
  }
  const dateDiff = start.valueOf() - end.valueOf();
  return `${Math.abs(Math.floor(dateDiff / 1000 / 60 / 60))} Hour(s)`; // convert milisecond to hours
}
/**
 * Get array of monthes between start date and end date.
 * @param start
 * @param end
 * @param year
 */
export function getMonthsArray(
  start: Date,
  end: Date,
  year: number | undefined = undefined,
): number[] {
  const months: Array<number> = [];
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  if (start == end) {
    months.push(startMonth);
  } else if (start > end) {
    for (let i = startMonth; i < 12; i++) {
      months.push(i);
    }
    if (year !== undefined) {
      for (let i = 0; i <= endMonth; i++) {
        months.push(i);
      }
    }
  } else {
    for (let i = startMonth; i <= endMonth; i++) {
      months.push(i);
    }
  }

  return months;
}
/**
 * Return Quater value for Datetime
 * @param date
 */
export function getQuater(date: string | Date | undefined | null): string {
  let q: string = "Q1";
  if (isEmpty(date)) {
    const d = __parse(date);
    const month = (d?.getMonth() ?? 0) + 1;
    if (month <= 3) q = "Q1";
    else if (month <= 6) q = "Q2";
    else if (month <= 9) q = "Q3";
    else q = "Q4";
  }
  return q;
}
/**
 * Get number of days in month
 */
export function getNumberOfDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
/**
 * ?? TODO: to be reviewd..
 * @param count
 */
export function getLastMonth(count: number) {
  return DateFns.addMonths(__newDate(), count);
}
/**
 * Convert start-end to Period
 * @param start
 * @param end
 */
export function convertStartEndToPeriod(
  start: Date | number | string | undefined,
  end: Date | number | string | undefined,
) {
  if (!start && !end) {
    return "";
  } else if (start && !end) {
    return `${formatDate(start)} - present`;
  } else if (!start && end) {
    return `Start - ${formatDate(end)}`;
  } else if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  } else {
    return "";
  }
}
/** Extended for isBefore to support more data types */
export function isBeforeEx(
  start: string | Date | undefined | null,
  end: string | Date | undefined | null,
): boolean {
  const s = parseDateTime(start);
  const e = parseDateTime(end);
  if (s === undefined || e == undefined) return false;
  return DateFns.isBefore(s, e);
}
/** Extended for isEqual to support more data types */
export function isEqualEx(
  start: string | Date | undefined | null,
  end: string | Date | undefined | null,
): boolean {
  const s = parseDateTime(start);
  const e = parseDateTime(end);
  if (s === undefined || e == undefined) return false;
  return DateFns.isEqual(s, e);
}
/** Extended for isAfter to support more data types */
export function isAfterEx(
  start: string | Date | undefined | null,
  end: string | Date | undefined | null,
): boolean {
  const s = parseDateTime(start);
  const e = parseDateTime(end);
  if (s === undefined || e == undefined) return false;
  return DateFns.isAfter(s, e);
}
/** Extended for addSeconds to support more data types */
export function addSecondsEx(
  input: string | Date | undefined | null,
  value: number,
): Date {
  const d = parseDateTime(input);
  return DateFns.addSeconds(d, value);
}
/** Extended for addHours to support more data types */
export function addHoursEx(
  input: string | Date | undefined | null,
  value: number,
): Date {
  const d = parseDateTime(input);
  return DateFns.addHours(d, value);
}
/** Extended for addDays to support more data types */
export function addDaysEx(
  input: string | Date | undefined | null,
  value: number,
): Date {
  const d = parseDateTime(input);
  return DateFns.addDays(d, value);
}
/** Extended for addMonths to support more data types */
export function addMonthsEx(
  input: string | Date | undefined | null,
  value: number,
): Date {
  const d = parseDateTime(input);
  return DateFns.addMonths(d, value);
}
/** Extended for addYears to support more data types */
export function addYearsEx(
  input: string | Date | undefined | null,
  value: number,
): Date {
  const d = parseDateTime(input);
  return DateFns.addYears(d, value);
}
/** Get start date of month */
export function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
}
/** Get end date of month */
export function getEndOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  return DateFns.addSeconds(DateFns.addMonths(d, 1), -1);
}
/** Get week day name */
export function getWeekDayName(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}
/** Get week day name */
export function getWeekDayFullName(date: Date): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}
/** Get Dispatch Period Value from datetime */
export function getDispatchPeriodValue(
  dateTime: Date,
  balancingPeriodNumber: string,
): number {
  const h = dateTime.getHours(); //00:00:00-00:29:59, 00:30:00-00:59:59
  const m = dateTime.getMinutes();
  if (balancingPeriodNumber === "24") {
    return h + 1;
  } else {
    const v = Math.trunc((h * 60 + m) / 30);
    return v + 1;
  }
}
/** Get end time from dispatch period value, eg: 2 = 00:59:59 */
export function getDispatchPeriodEndTime(
  value: number,
  balancingPeriodNumber: string,
): string {
  let h = Math.floor((value - 1) / 2);
  let mm = value % 2 == 1 ? "29" : "59";
  let hh = (h < 10 ? "0" : "") + h.toString();

  if (balancingPeriodNumber === "24") {
    h = value - 1;
    mm = "59";
    hh = (h < 10 ? "0" : "") + h.toString();
  }
  return `${hh}:${mm}:59`;
}
/** Get start time from dispatch period value, eg: 2 = 00:30:00 */
export function getDispatchPeriodStartTime(
  value: number,
  balancingPeriodNumber: string,
): string {
  let h = Math.floor((value - 1) / 2);
  let mm = value % 2 == 1 ? "00" : "30";
  let hh = (h < 10 ? "0" : "") + h;

  if (balancingPeriodNumber === "24") {
    h = value - 1;
    mm = "00";
    hh = (h < 10 ? "0" : "") + h.toString();
  }

  return `${hh}:${mm}:00`;
}
/**
 * Format Date Range
 * @param prefix
 * @param start
 * @param end
 * @returns
 */
export function formatDateRange(prefix: any, start: any, end: any) {
  return (
    prefix +
    " [Start date: " +
    formatValue(start, "dd MMM yyyy") +
    " - End date: " +
    formatValue(end, "dd MMM yyyy") +
    "]"
  );
}
/**
 * Get start of month
 */
export function startOfMonthEx() {
  return getStartOfMonth(newDate());
}
/**
 * Get start of month
 */
export function startOfMonthStd() {
  return formatDateTimeStd(getStartOfMonth(newDate()));
}
/**
 * Get end of month
 */
export function endOfMonthEx() {
  return getEndOfMonth(newDate());
} /**
 * Get end of month
 */
export function endOfMonthStd() {
  return formatDateTimeStd(getEndOfMonth(newDate()));
}
/**
 * Get end of month
 */
export function getDisplayFormat(type: string) {
  return type == "date" //
    ? "dd MMM yyyy"
    : type == "datetime"
      ? "dd MMM yyyy HH:mm:ss"
      : type == "month"
        ? "MMM yyyy"
        : type == "year"
          ? "yyyy"
          : "dd MMM yyyy HH:mm:ss";
}
/**
 * Get end of month
 */
export function formatStandard(date: string | Date | number, type: string) {
  return formatValue(
    date,
    type == "date" //
      ? "yyyy-MM-dd"
      : type == "datetime"
        ? "yyyy-MM-dd HH:mm:ss"
        : type == "month"
          ? "yyyy/MM"
          : type == "year"
            ? "yyyy"
            : "yyyy/MM/dd HH:mm:ss",
  );
}

const parseRangeperiod = (rangeperiod: any) => {
  const val = Number(first(rangeperiod.match(/\d{1,300}/g)));
  const unit = first(rangeperiod.match(/[a-zA-Z]{1,300}/g));

  switch (unit) {
    case "H":
      return { val, unit: "h", text: "hour(s)" };
    case "D":
      return { val, unit: "d", text: "day(s)" };
    case "M":
      return { val, unit: "M", text: "month(s)" };
    case "Y":
      return { val, unit: "y", text: "year(s)" };

    default:
  }
};

//
export function addRangeEx(
  date: string | Date | undefined | null,
  range: string,
): Date {
  const { val, unit } = parseRangeperiod(range);
  if ("h" == unit) return addSecondsEx(addHoursEx(date, val), -1);
  else if ("d" == unit) return addSecondsEx(addDaysEx(date, val), -1);
  else if ("m" == unit) return addSecondsEx(addMonthsEx(date, val), -1);
  else if ("y" == unit) return addSecondsEx(addYearsEx(date, val), -1);
  return addSecondsEx(addDaysEx(date, val), -1);
}

/**
 * Get end of month
 */
export function formatISO(date: string | Date | number, type: string) {
  return formatValue(
    date,
    type == "date" //
      ? "yyyy-MM-dd"
      : type == "datetime"
        ? "yyyy-MM-dd HH:mm:ss"
        : type == "month"
          ? "yyyy-MM"
          : type == "year"
            ? "yyyy"
            : "yyyy-MM-dd HH:mm:ss",
  );
}

export const formatRangePeriod = (rangeperiod: any) => {
  const val = Number(first(rangeperiod.match(/\d{1,300}/g)));
  const unit = first(rangeperiod.match(/[a-zA-Z]{1,300}/g));

  switch (unit) {
    case "H":
      return `${val} hour(s)`;
    case "D":
      return `${val} day(s)`;
    case "M":
      return `${val} month(s)`;
    case "Y":
      return `${val} year(s)`;
    default:
      return "";
  }
};
