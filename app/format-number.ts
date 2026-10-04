// Preserve familiar existing suffixes; extend the same short-scale notation
// through 1e306, the last complete thousand-group supported by JavaScript.
const INITIAL_SUFFIXES = ["", "k", "M", "Md", "B", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
const ONES = ["", "U", "D", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
const TENS = ["", "Dc", "Vg", "Tg", "Qag", "Qig", "Sxg", "Spg", "Ocg", "Nog"];

export function localizeDecimalText(text: string): string {
  return text.replace(/(\d)\.(?=\d)/g, "$1,");
}

export function formatDecimal(value: number, digits: number): string {
  return localizeDecimalText(value.toFixed(digits));
}

export function magnitudeSuffix(group: number): string {
  if (group <= 10) return INITIAL_SUFFIXES[group] ?? "";
  const illion = group - 1;
  if (illion >= 100) return `${ONES[illion - 100]}Ct`;
  return `${ONES[illion % 10]}${TENS[Math.floor(illion / 10)]}`;
}

export function formatNumber(value: number): string {
  if (Number.isNaN(value)) return "0";
  if (!Number.isFinite(value)) return value < 0 ? "−∞" : "∞";
  const absolute = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (absolute < 1000) {
    return sign + (absolute < 100 ? formatDecimal(absolute, absolute < 10 ? 1 : 0) : Math.floor(absolute).toString());
  }
  let group = Math.min(102, Math.floor(Math.log10(absolute) / 3));
  let scaled = absolute / 10 ** (group * 3);
  // Carry rounded values into the next unit instead of displaying "1000 k".
  if (Number(scaled.toFixed(scaled < 10 ? 1 : 0)) >= 1000 && group < 102) {
    group += 1;
    scaled = absolute / 10 ** (group * 3);
  }
  return `${sign}${formatDecimal(scaled, scaled < 10 ? 1 : 0)} ${magnitudeSuffix(group)}`;
}

export function formatCount(value: number): string {
  return Number.isFinite(value) && Math.abs(value) < 1000
    ? Math.trunc(value).toString()
    : formatNumber(value);
}
