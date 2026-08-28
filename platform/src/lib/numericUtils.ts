/* eslint-disable no-var */

const __delta = 0.0000001;
/**
 *
 * @param {*} value
 * @param {*} prepend
 * @returns
 */
export function formatCurrency(value, prepend = "") {
  if (value === undefined || value === null) return prepend;

  const fractionDigit = 2;
  if (value === null) {
    return "";
  } else if (value === "") {
    return "";
  } else if (isNaN(value)) {
    return "";
  }
  return (
    prepend +
    parseFloat(String(value))
      .toFixed(fractionDigit)
      .replace(/(\d)(?=(\d\d\d){1,10}(?!\d))/g, "$1,")
  );
}
/**
 *
 * @param {*} value
 * @param {*} prepend
 * @returns
 */
export function formatCurrency0(value, prepend = "") {
  return formatCurrency(value, prepend);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatPadLeft(value) {
  return value;
  //if (value === undefined || value === null) return "00000";
  //let val = (parseFloat(String(value)) / 1).toFixed(0); //.replace(".", ",");
  //return Utils.padLeft(value, 5);
}
export function formatNumber(value, decimalPlace) {
  if (value === undefined || value === null) return undefined;

  value = value.toString().replaceAll(",", "");
  if (decimalPlace < 0) decimalPlace = 0;
  if (decimalPlace == 0) {
    const val = (parseFloat(value) / 1).toFixed(0); //.replace(".", ",");
    if (isNaN(parseFloat(String(value)))) return "";
    return val.toString().replace(/\B(?=(\d{3}){1,20}(?!\d))/g, ",");
  } else {
    const val = (value / 1).toFixed(decimalPlace); //.replace(".", ",");
    const parts = val.split(".");
    if (isNaN(parseFloat(String(value)))) return "";
    return (
      parts[0].toString().replace(/\B(?=(\d{3}){1,20}(?!\d))/g, ",") +
      "." +
      parts[1]
    );
  }
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber0(value) {
  return formatNumber(value, 0);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber1(value) {
  return formatNumber(value, 1);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber2(value) {
  return formatNumber(value, 2);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber3(value) {
  return formatNumber(value, 3);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber4(value) {
  return formatNumber(value, 4);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber5(value) {
  return formatNumber(value, 5);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber6(value) {
  return formatNumber(value, 6);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber7(value) {
  return formatNumber(value, 7);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber8(value) {
  return formatNumber(value, 8);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber9(value) {
  return formatNumber(value, 9);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber10(value) {
  return formatNumber(value, 10);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber11(value) {
  return formatNumber(value, 11);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber12(value) {
  return formatNumber(value, 11);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber13(value) {
  return formatNumber(value, 13);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumber14(value) {
  return formatNumber(value, 14);
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNumberRaw(value) {
  if (!value) return undefined;
  let v = value.toString().replace(/,/gi, "");
  while (v.indexOf("..") >= 0) v = v.replace("..", ".");
  if (v.startsWith(".")) v = "0" + v;
  return v;
}
/**
 *
 * @param {*} value
 * @param {*} decimalvalue
 * @returns
 */
export function format(value, decimalvalue) {
  value = value.split(/[^0-9.,]/).join("");
  const temp = value.split(".");
  if (temp.length == 2) {
    temp[0] = String(temp[0]).substring(0, 14);
    value = temp[0] + "." + String(temp[1]).substring(0, decimalvalue);
  } else if (temp.length > 2) {
    var s = "";
    for (var i = 0; i < temp.length - 1; i++) {
      s += temp[i];
    }
    value = s + "." + String(temp[temp.length - 1]).substring(0, decimalvalue);
  } else {
    value = String(value).substring(0, 14);
  }
  value = String(value).replace("-", "");
  return value;
}
/**
 *
 * @param {*} value
 * @returns
 */
export function formatNoneTrailingZeros(value) {
  if (value === undefined || value === null) return undefined;
  return value.replace(/\.?0{1,20}$/, "");
}
/**
 *
 * @param {*} value
 * @param {*} maxNumber
 * @returns
 */
export function getClosestNumber(value, maxNumber) {
  /**
   * Input: value: 1234.55, maxnumber: 999
   * Output: 123.55
   * Input: value: 998.55, maxnumber: 999
   * Output: 998.55
   * Input: value: 354, maxnumber: 999
   * Output: 354
   */
  var result = null;
  for (var i = 1; i <= value.toString().length; i++) {
    const num = Number(value.toString().substring(0, i));
    if (num < maxNumber) result = num;
  }
  return result ? result.toString() : "";
}
/**
 *
 * @param {*} value1
 * @param {*} maxNumber
 * @returns
 */
export function formatClosestNumber(value1, maxNumber) {
  var value = value1.split(/[^-0-9.,]/).join("");
  const temp = value.split(".");
  if (temp.length == 2) {
    temp[0] = String(temp[0]).substring(0, 14);
    value = getClosestNumber(temp[0], maxNumber) + "." + String(temp[1]);
  } else if (temp.length > 2) {
    var s = "";
    for (var i = 0; i < temp.length - 1; i++) {
      s += temp[i];
    }
    value =
      getClosestNumber(s, maxNumber) + "." + String(temp[temp.length - 1]);
  } else {
    value = getClosestNumber(value, maxNumber);
  }
  value = String(value).replace("-", "--");
  return value;
}
/**
 *
 * @param {*} numberStr
 * @returns
 */
export function formatPositiveNumber(numberStr) {
  /** Input: 2, output 2, Input: -2, output: -2 */
  return Math.abs(numberStr) || "";
}
/**
 *
 * @param {*} str
 * @returns
 */
export function removeNonNumericCharacters(str) {
  var str1 = "";
  for (const c of str) {
    if (
      c == "0" ||
      c == "1" ||
      c == "2" ||
      c == "3" ||
      c == "4" ||
      c == "5" ||
      c == "6" ||
      c == "7" ||
      c == "8" ||
      c == "9" || //
      c == "." ||
      c == "-" ||
      c == "(" ||
      c == ")"
    ) {
      str1 += c;
    }
  }
  if (str1) {
    if (str1.startsWith("(") && str1.endsWith(")")) {
      str1 = str1.substring(1, str1.length - 2);
      str1 = `-${str1}`;
    } else if (str1 == "-") {
      str1 = `0`;
    }
  }
  return str1;
}
/**
 *
 * @param {*} value
 * @returns
 */
export function truncate4(value) {
  var arr = (value ?? 0).toString().match(/^-?\d{1,300}(?:\.\d{0,4})?/);
  if (arr == null) return value;
  var with4Decimals = arr[0];
  return Number(with4Decimals);
}
/**
 *
 * @param {*} str
 * @returns
 */
export function toNumber(str) {
  const str1 = (str ?? 0).toString().replaceAll(",", "");
  return parseFloat(str1) + __delta;
}
/**
 *
 * @param {*} str
 * @returns
 */
export function valueToMask(value, format) {
  if (!format) return "";

  var v = value == null || value == undefined ? 0 : value;
  var fmt = "0.000";
  switch (format) {
    case "number0":
      fmt = formatNumber0(v);
      break;
    case "number1":
      fmt = formatNumber1(v);
      break;
    case "number2":
      fmt = formatNumber2(v);
      break;
    case "number3":
      fmt = formatNumber3(v);
      break;
    case "number8":
      fmt = formatNumber8(v);
      break;
    case "number10":
      fmt = formatNumber10(v);
      break;
    default:
      fmt = formatNumber4(v);
      break;
  }
  return fmt?.replaceAll(/[0-9]/, "#") ?? "";
}
/**
 *
 * @param {*} str
 * @returns
 */
export function toMask(format) {
  if (!format) return "";
  switch (format) {
    case "number0":
      return "#,###,###,###,###";
    case "number1":
      return "#,###,###,###,###.#";
    case "number2":
      return "#,###,###,###,###.##";
    case "number3":
      return "#,###,###,###,###.###";
    case "number8":
      return "#,###,###,###,###.########";
    case "number10":
      return "-#,###,###,###,###.##########";
    default:
      return "#,###,###,###,###.####";
  }
}
/**
 *
 * @param {*} value1
 * @param {*} value2
 */
export function greaterOrEqual(value1, value2) {
  const diff = value1 - value2;
  if (Math.abs(diff) < __delta) return true; // equal
  return diff >= 0;
}
/**
 *
 * @param {*} value1
 * @param {*} value2
 */
export function lessOrEqual(value1, value2) {
  const diff = value2 - value1;
  if (Math.abs(diff) < __delta * 2) return true; // equal
  return diff >= 0;
}

type NumericFormatOptions = {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  grouping?: boolean;
};

/**
 * The primitive behind `formatNumeric` below — same rounding/grouping, but returns the unit and
 * the digits separately so `DataTable` can render the unit in its own gutter instead of baking it
 * into the string (`.claude/rules/components-rules.md` § Data tables). `prefix`/`suffix` come back
 * untrimmed, exactly as declared on the column (`"SGD "`, `" days"`) — `formatNumeric` below
 * concatenates them as-is, so this function's output must stay assemble-compatible with it;
 * trimming for display is the caller's job (`DataTable.tsx`).
 *
 * On the nullish/NaN path the affixes come back empty and `body` is "—" — a unit beside an em dash
 * would imply a zero value that was never there.
 */
export function formatNumericParts(
  value: number | string | null | undefined,
  options: NumericFormatOptions = {},
): { prefix: string; body: string; suffix: string } {
  const { decimals = 2, prefix = "", suffix = "", grouping = true } = options;

  if (value === undefined || value === null || value === "") {
    return { prefix: "", body: "—", suffix: "" };
  }

  const numeric =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replaceAll(",", ""));
  if (isNaN(numeric)) return { prefix: "", body: "—", suffix: "" };

  const body = grouping
    ? formatNumber(numeric, decimals)
    : numeric.toFixed(Math.max(0, decimals));

  return { prefix, body, suffix };
}

/**
 * Declarative number formatting for a DataTable `numeric` column
 * (`platform/src/types/table.ts`'s `NumericFormat`). Unlike `formatNumber` above, nullish/NaN
 * input returns "—" rather than `undefined` — the behaviour `.claude/rules/utils-rules.md`
 * requires of new formatters, even though the older `formatNumber` predates that rule and is left
 * as-is (15 wrappers and unknown callers depend on its current return value).
 *
 * `decimals` is resolved to a definite number before delegating to `formatNumber` — passing
 * `undefined` straight through would hit `toFixed(undefined)`, which is `toFixed(0)`, but then
 * indexes into a `parts[1]` that doesn't exist and returns a string like `"1,235.undefined"`.
 *
 * Real TS parameter types, not JSDoc — this file is `.ts`, so unlike a `.js` file, JSDoc `@param`
 * annotations are documentation only and are never used for type-checking or inference here.
 *
 * The join of `formatNumericParts` above — kept as its own function (rather than having callers
 * assemble the parts themselves) because `DataTable`'s client-side search matches against this
 * exact concatenated string (`DataTable.tsx`'s `makeGlobalFilter`), so search and display can
 * never drift apart.
 */
export function formatNumeric(
  value: number | string | null | undefined,
  options: NumericFormatOptions = {},
): string {
  const { prefix, body, suffix } = formatNumericParts(value, options);
  return `${prefix}${body}${suffix}`;
}
