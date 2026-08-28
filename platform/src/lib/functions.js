import { cloneDeep, isArguments, startCase } from "lodash";
import { formatNumber10 } from "./numericUtils";
import LZString from "lz-string";

//-----------------------------------------------------------------------------------
/**
 *
 */
export function randomNumber() {
  const crypto = window.crypto;
  var array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const random1 = Number(`0.${array[0]}`);
  return random1;
}
/**
 * Generate random UUID v4
 * @returns
 */
export function uuid() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16),
  );
}
/**
 * Generate a unique string
 * @param {*} prefix
 * @returns
 */
export function getUniqueID(prefix = "") {
  return prefix + Math.floor(randomNumber() * 1000000).toString();
}
/**
 * Random number between start and end
 * @param {*} start
 * @param {*} end
 * @returns
 */
export function random(start, end) {
  return Math.floor((end - start + 1) * randomNumber()) + start;
}
//-----------------------------------------------------------------------------------
/**
 * Check input is object
 * @param {*} obj
 * @returns
 */
export function isObject(obj) {
  return obj && typeof obj === "object";
}
/***
 *
 */
export function isEmpty(value) {
  return (
    value === null ||
    value === undefined ||
    typeof value === "undefined" ||
    value.toString().trim() === ""
  );
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isUndefined(value) {
  return value === undefined || typeof value === "undefined";
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isNull(value) {
  return value === null;
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isNullOrUndefined(value) {
  return value === null || value === undefined || typeof value === "undefined";
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isNoValue(value) {
  return value === null || value === undefined || value == "";
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isDate(value) {
  if (!value) return false;
  return (
    value instanceof Date ||
    Object.prototype.toString.call(value) === "[object Date]"
  );
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isString(value) {
  if (!value) return false;
  return typeof value === "string" || value instanceof String;
}
/**
 *Returns if a value is really a number
 * @param {*} value
 * @returns
 */
export function isNumber(value) {
  if (!value) return false;
  return typeof value === "number" && isFinite(value);
}
/**
 * Returns if a value is an array
 * @param {*} value
 * @returns
 */
export function isArray(value) {
  if (!value) return false;
  return (
    Array.isArray(value) ||
    (value && typeof value === "object" && value.constructor === Array) ||
    JSON.stringify(value).startsWith("[")
  );
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isFunction(value) {
  if (!value) return false;
  return typeof value === "function";
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isBoolean(value) {
  if (!value) return false;
  return typeof value === "boolean";
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isRegExp(value) {
  if (!value) return false;
  return value && typeof value === "object" && value.constructor === RegExp;
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isError(value) {
  if (!value) return false;
  return value instanceof Error && typeof value.message !== "undefined";
}
/**
 *
 * @param {*} value
 * @returns
 */
export function isSymbol(value) {
  if (!value) return false;
  return typeof value === "symbol";
}
/**
 * Checks the value of the variable to be equivalent to "true"
 * @param value
 * @return {boolean}
 */
export function isTrue(value) {
  if (value === undefined || value === null) return false;

  let sValue = "" + value; // conver to string
  sValue = sValue.toLowerCase();
  return (
    sValue === "true" || sValue === "yes" || sValue === "y" || sValue === "1"
  );
}
/**
 * Equal
 * @param {*} obj1
 * @param {*} obj2
 * @returns
 */
export function isEquals(obj1, obj2) {
  if (
    (obj1 === undefined || obj1 === null) &&
    (obj2 === undefined || obj2 === null)
  )
    return true;
  if ((obj1 === undefined || obj1 === null) && !obj2) return false;
  if ((obj2 === undefined || obj2 === null) && !obj1) return false;

  const v1 = JSON.stringify(obj1);
  const v2 = JSON.stringify(obj2);
  return v1 == v2;
}
//-----------------------------------------------------------------------------------
/**
 *
 */
export function capitalizeWords(text) {
  if (text === undefined || text === null || text.length === 0) return "";
  //return text.charAt(0).toUpperCase() + text.slice(1);
  return startCase(text);
}
/**
 *
 * @param {*} target
 * @param {*} search
 * @param {*} replacement
 * @returns
 */
export function replaceString(target, search, replacement) {
  if (target === undefined || target === null) return target;
  return target.replace(new RegExp(search, "g"), replacement);
}
/**
 * Replace string
 * @param target
 * @param search
 * @param replacement
 */
export function replaceStrings(target, replacements) {
  if (!target || !replacements || replacements.length == 0) return target;
  for (var i = 0; i < replacements.length; i++) {
    target = replaceString(
      target,
      replacements[i].key,
      replacements[i].value ?? "",
    );
  }
  return target;
}
/**
 * Checks if input is null, undefined, or empty
 * @param str
 * @return {boolean}
 */
export function notEmptyString(val) {
  return val !== undefined && val !== null && String(val).trim() !== "";
}
/**
 * Convert string to List
 * @param {string} text - String with comma separated items
 * @returns {Array<string>} Array of string items
 */
export function stringToList(text, split = ",") {
  let sRet = [];
  try {
    if (text) {
      sRet = text.split(split);
    }
  } catch {
    // do nothing
  }
  return sRet;
}
/**
 * Contain String
 * @param text
 * @param searchString
 */
export function stringContains(text, searchString) {
  return text.indexOf(searchString) >= 0;
}
/**
 * Format string
 */
export function sprintf(format) {
  const args = Array.prototype.slice.call(isArguments, 1);
  return format.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== "undefined" ? args[number] : match;
  });
}
/**
 * Remove string
 * @param target
 * @param search
 * @param replacement
 */
export function removeString(text, value) {
  while (text.indexOf(value) >= 0) {
    text = text.replace(new RegExp(value, "g"), "");
  }
  return text;
}
/**
 *
 * @param {*} text
 * @param {*} length
 * @param {*} useWordBoundary
 * @returns
 */
export function truncateString(text, length, useWordBoundary) {
  if (text === undefined || text === null) return "";
  text = String(text);
  if (text.length <= length) {
    return text;
  }
  var subString = text.substr(0, length - 1);
  return (
    (useWordBoundary
      ? subString.substr(0, subString.lastIndexOf(" "))
      : subString) + "..."
  );
}
/**
 * Safe convert object to string
 * @param {*} val
 * @returns
 */
export function convertToString(val) {
  if (val === undefined || val === null) return "";
  const v = JSON.stringify(val);
  if (v === "[]" || v == '""') return "";
  return v;
}
/**
 * Pad left
 * @param {*} num
 * @param {*} size
 * @returns
 */
export function padLeft(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}
/** Normalize Text */
export function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return value.toLowerCase();
}
//-----------------------------------------------------------------------------------
/**
 * Copy all property from source to destination, this method doesn't support deep copy.
 * @param {*} source
 * @param {*} target
 * @param {*} ignoreIfFieldHasValue
 */
export function copyTo(source, target, ignoreIfFieldHasValue = undefined) {
  const g =
    ignoreIfFieldHasValue === null || ignoreIfFieldHasValue === undefined
      ? "null"
      : ignoreIfFieldHasValue.toString();
  for (var property in source) {
    const val = source[property];
    const c = val === undefined || val === null ? "null" : val.toString();
    if (c === g) {
      // do nothing
    } else {
      target[property] = val;
    }
  }
}
/**
 * Clone object, use cloneDeep for deep clone.
 * @param {*} source
 * @returns
 */
export function clone(source) {
  if (!source) source;
  return cloneDeep(source);
}
/**
 * Deep clone object
 * @param {*} source
 * @returns
 */
export function deepCopy(source) {
  if (!source) source;
  return JSON.parse(JSON.stringify(source));
}
/**
 * Deep clone object
 * @param {*} source
 * @returns
 */
export function cloneObject(source) {
  if (!source) source;
  return JSON.parse(JSON.stringify(source));
}
/**
 * Deep Compare
 * @param {*} obj1
 * @param {*} obj2
 * @returns
 */
export function compare(obj1, obj2) {
  if (obj1 === undefined && obj2 === undefined) {
    return true;
  } else if (obj1 === null && obj2 === null) {
    return true;
  } else if (
    (obj1 !== undefined && obj2 === undefined) ||
    (obj1 === undefined && obj2 !== undefined)
  ) {
    return false;
  } else if (
    (obj1 !== null && obj2 === null) ||
    (obj1 === null && obj2 !== null)
  ) {
    return false;
  }

  function compare2Objects(x, y) {
    var p;
    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (
      isNaN(x) &&
      isNaN(y) &&
      typeof x === "number" &&
      typeof y === "number"
    ) {
      return true;
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on the step where we compare prototypes
    if (x === y) {
      return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if (
      (typeof x === "function" && typeof y === "function") ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)
    ) {
      return x.toString() === y.toString();
    }

    if (JSON.stringify(x) !== JSON.stringify(y)) {
      return false;
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }

    // eslint-disable-next-line no-prototype-builtins
    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      return false;
    }

    if (x.constructor !== y.constructor) {
      return false;
    }

    if (x.prototype !== y.prototype) {
      return false;
    }

    // Quick checking of one object being a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
      // eslint-disable-next-line no-prototype-builtins
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      } else if (y[p] !== x[p]) {
        if (JSON.stringify(y[p]) !== JSON.stringify(x[p])) {
          return false;
        } else {
          return true;
        }
      }
    }

    for (p in x) {
      // eslint-disable-next-line no-prototype-builtins
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      } else if (y[p] !== x[p]) {
        if (JSON.stringify(y[p]) !== JSON.stringify(x[p])) {
          return false;
        } else {
          return true;
        }
      }
    }
    return true;
  }

  return compare2Objects(obj1, obj2);
}
/**
 * Compare 2 arrays
 * @param {*} array1
 * @param {*} array2
 * @returns
 */
export function compareArray(array1, array2) {
  if (!array1 || !array2) return false;

  // compare lengths - can save a lot of time
  if (array1.length != array2.length) return false;

  for (var i = 0, l = array1.length; i < l; i++) {
    // Check if we have nested arrays
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this.compareArray(array1[i], array2[i])) return false;
    } else if (array1[i] != array2[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
}
/**
 * Returns TRUE if the first specified array contains all elements
 * from the second one. FALSE otherwise.
 *
 * @param {array} superset
 * @param {array} subset
 * @returns {boolean}
 *
 * example of use:
 * var array1 = ['A', 'B', 'C', 'D', 'E'];
 * var array2 = ['B', 'C', 'E'];
 * var array3 = ['B', 'C', 'Z'];
 * var array4 = [];
 * console.log(arrayContainsArray(array1, array2));
 */
export function isArrayContainsArray(superset, subset) {
  if (0 === subset.length) {
    return false;
  }

  return subset.every(function (value) {
    return superset.indexOf(value) >= 0;
  });
}
/**
 *
 * @param val
 */
export function compareAfterNormalize(val1, val2) {
  if (val1 != "" && val2 == "") return false;
  if (val1 == "" && val2 != "") return false;

  var c1 = val1;
  var c2 = val2;
  if (c1 == undefined || c1 == null) c1 = "NULL";
  else {
    const t = Number(val1);
    if (!Number.isNaN(t)) c1 = formatNumber10(t);
    c1 = replaceString(c1.toString(), ",", "");
  }
  if (c2 == undefined || c2 == null) c2 = "NULL";
  else {
    const t = Number(val2);
    if (!Number.isNaN(t)) c2 = formatNumber10(t);
    c2 = replaceString(c2.toString(), ",", "");
  }
  return c1 == c2;
}
//-----------------------------------------------------------------------------------
/**
 * Get path from the url
 * @param {String} url
 */
export function getPathFromUrl(url) {
  return url.split(/[?#]/)[0];
}
/**
 * Get current host path (end with "/"
 */
export function getHostPath() {
  return window.location.protocol + "//" + window.location.host + "/";
}
/**
 *
 */
export function getCurrentPath(withSearch = false) {
  return !withSearch
    ? window.location.pathname
    : window.location.pathname + window.location.search;
}
/**
 *
 */
export function getFullPath() {
  return window.location.href;
}
/**
 * Get Current related patth
 * @param {*} appendQueryString
 * @returns
 */
export function getUrlRelativePath(appendQueryString = undefined) {
  const l = window.location;
  return l.pathname + l.search + (appendQueryString === undefined)
    ? ""
    : l.search === undefined || l.search === null || l.search === ""
      ? "?" + appendQueryString
      : "&" + appendQueryString;
}
/**
 * Takes query string name  and url
 * @param {*} parameterName
 * @param {*} url
 * @returns
 */
export function getURLParameterValue(parameterName, url) {
  if (!url) url = window.location.href;
  parameterName = parameterName.replace(/[[]]/g, "\\><");
  var regularExpression = new RegExp(
      "[?&]" + parameterName + "(=([^&#]*)|&|#|$)",
    ),
    results = regularExpression.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\{1,10}/g, " "));
}
//-----------------------------------------------------------------------------------
/**
 * Safe get value by field name from object
 * @param {*} item
 * @param {*} fieldName
 * @param {*} defaultValue
 * @returns
 */
export function getValueIfAvailable(item, fieldName, defaultValue = null) {
  if (
    item === undefined ||
    item === null ||
    item[fieldName] === undefined ||
    item[fieldName] === null
  ) {
    return defaultValue;
  }
  return item[fieldName];
}
/**
 * Convert Whitespace to Null
 * @param {*} value
 * @returns
 */
export function convertOnlySpaceToNull(value) {
  if (this.isString(value)) {
    // check if string contains only space
    if (value.trim().length === 0) {
      value = null;
    }
  }

  if (value === "" || value === "()") {
    value = null;
  }
  return value;
}
/**
 * Set all boolean string to boolean
 * @param {*} obj
 * @returns
 */
export function correctBooleanProps(obj) {
  for (let x in obj) {
    if (obj[x] === "true" || obj[x] === "True" || obj[x] === "TRUE") {
      obj[x] = true;
    } else if (obj[x] === "false" || obj[x] === "False" || obj[x] === "FALSE") {
      obj[x] = false;
    }
  }
  return obj;
}
/**
 * Delay in {number} milisecond
 * @param delay
 */
export async function delayAsync(delay) {
  await new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}
/**
 *
 * @returns
 */
export function debounce() {
  let timeout = null;
  return function (fnc, delayMs) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fnc();
    }, delayMs || 1000);
  };
}
/***
 * Convert to based 64 string
 */
export function toBase64(str) {
  return btoa(
    encodeURIComponent(str).replace(
      /%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode("0x" + p1);
      },
    ),
  );
}
/**
 * From based 64 string
 * @param {string} str
 * @returns
 */
export function fromBase64(str) {
  return decodeURIComponent(
    atob(str)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
}
/***
 * Convert file to base64
 * e.g. data:image/png;base64,aBc....
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    // reader.onload = () => resolve(reader.result)
    reader.onload = function (e) {
      const dataURL = e.target.result;
      const base64String = dataURL.split(",")[1];
      resolve({ dataURL, base64String });
    };
    reader.onerror = (error) => reject(error);
  });
}
//-----------------------------------------------------------------------------------
/***
 * Compress value to based64 string
 */
export function toCompressedBase64(str) {
  if (!str) return "";
  return LZString.compressToBase64(str);
}
/***
 * Decompress value to based64 string
 */
export function fromCompressedBase64(text) {
  if (!text) return "";
  return LZString.decompressFromBase64(text);
}
