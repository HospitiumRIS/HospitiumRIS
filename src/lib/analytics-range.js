/**
 * Shared reporting-period parsing for institution analytics APIs.
 * Defaults to the last 12 months; also returns the previous period of equal length.
 */
const DAY = 24 * 60 * 60 * 1000;

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

export function resolveAnalyticsRange(searchParams) {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setFullYear(defaultStart.getFullYear() - 1);
  defaultStart.setDate(defaultStart.getDate() + 1);

  const start = parseDate(searchParams.get('startDate'), defaultStart);
  start.setHours(0, 0, 0, 0);
  const end = parseDate(searchParams.get('endDate'), now);
  end.setHours(23, 59, 59, 999);

  const span = end - start + 1;
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(start.getTime() - span);

  return { start, end, previousStart, previousEnd, valid: start <= end, now };
}

export const inRange = (date, start, end) => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  return d >= start && d <= end;
};

export const daysBetween = (from, to) => Math.round((new Date(to) - new Date(from)) / DAY);

export const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

export const pctChange = (current, previous) => (previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null);

export function monthBuckets(start, end) {
  const spanDays = (end - start) / DAY;
  const step = spanDays > 740 ? 3 : 1;
  const buckets = [];
  const cursor = step === 3
    ? new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1)
    : new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + step);
    const label = step === 3
      ? `Q${Math.floor(bucketStart.getMonth() / 3) + 1} ${String(bucketStart.getFullYear()).slice(2)}`
      : bucketStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    buckets.push({ label, start: bucketStart, end: new Date(next.getTime() - 1) });
    cursor.setTime(next.getTime());
  }
  return buckets;
}

export const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export const average = (values) => (values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null);
