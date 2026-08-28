/**
 * Converts a browser-computed `rgb(...)`/`rgba(...)` color string into display formats for the
 * Component Library's color palette swatches. Reads the *live* computed style rather than typed-in
 * values, so the numbers shown can never drift from `index.css` and update automatically in dark
 * mode — see src/pages/sample/Primitives.tsx.
 */

function parseRgb(rgbString: string): [number, number, number] | null {
  const match = rgbString.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i,
  );
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function rgbStringToHex(rgbString: string): string {
  const rgb = parseRgb(rgbString);
  if (!rgb) return rgbString;
  return (
    "#" +
    rgb
      .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** sRGB -> OKLCH, via linear RGB -> LMS -> OKLab (Björn Ottosson's formulas). */
export function rgbStringToOklch(rgbString: string): string {
  const rgb = parseRgb(rgbString);
  if (!rgb) return rgbString;
  const [r, g, b] = rgb.map(srgbToLinear);

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bLab * bLab);
  let H = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${C < 0.0001 ? 0 : H.toFixed(1)})`;
}
