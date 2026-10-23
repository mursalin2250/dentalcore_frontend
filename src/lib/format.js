import { CURRENCY_MINOR_UNIT, JUST_NOW_LABEL, LOCALE, TIMEZONE } from "@/constants/locale";

const numberFormat = new Intl.NumberFormat(LOCALE);
const compactFormat = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const timeFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit" });
const shortDateFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric" });
const longDateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }); // YYYY-MM-DD
const hourFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hour12: false });
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

// Chart labels come from API keys: "2026-10-20" (day) or "2026-10" (month). Read as UTC so they never shift.
const bucketDayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
const bucketMonthFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", month: "short", year: "numeric" });

const SECONDS = { HOUR: 3600, DAY: 86400 };
const RELATIVE_MAX_DAYS = 7;

export const formatNumber = (value) => numberFormat.format(value);
export const formatCompact = (value) => compactFormat.format(value);

// Amount only, for places where the currency is shown separately.
export const formatAmount = (minorUnits) =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(minorUnits / CURRENCY_MINOR_UNIT);

export function formatMoney(minorUnits, currency) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency, maximumFractionDigits: 0 }).format(
    minorUnits / CURRENCY_MINOR_UNIT,
  );
}

export const formatTime = (iso) => timeFormat.format(new Date(iso));

/** Always dd/mm/yyyy (day → month → year). */
export function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = shortDateFormat.formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;
  if (!day || !month || !year) return shortDateFormat.format(d);
  return `${day}/${month}/${year}`;
}

export function formatLongDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, weekday: "long" }).format(d);
  return `${weekday}, ${formatShortDate(d)}`;
}
export const isSameClinicDay = (a, b) => dayKeyFormat.format(new Date(a)) === dayKeyFormat.format(new Date(b));
export const getClinicHour = (date) => Number(hourFormat.format(date)) % 24;

export function formatBucket(key, isMonthly) {
  const date = new Date(isMonthly ? `${key}-01T00:00:00Z` : `${key}T00:00:00Z`);
  return (isMonthly ? bucketMonthFormat : bucketDayFormat).format(date);
}

// "Just now" under an hour, then "3 hours ago", "yesterday", and a plain date after a week.
export function formatRelativeTime(iso, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < SECONDS.HOUR) return JUST_NOW_LABEL;
  if (abs < SECONDS.DAY) return relativeFormat.format(Math.round(seconds / SECONDS.HOUR), "hour");
  if (abs < RELATIVE_MAX_DAYS * SECONDS.DAY) return relativeFormat.format(Math.round(seconds / SECONDS.DAY), "day");
  return formatShortDate(iso);
}
