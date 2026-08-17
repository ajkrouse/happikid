/**
 * Utilities for determining if a provider has a closure starting within 14 days.
 * All date comparisons use local calendar dates to avoid UTC-shift bugs.
 */

export interface ClosedDateEntry {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  reason?: string;
}

/**
 * Build a YYYY-MM-DD string from a Date using local calendar components,
 * avoiding the UTC-shift that toISOString() introduces for time zones east of UTC.
 */
export function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns the earliest upcoming closure whose `from` date falls within the next
 * `windowDays` calendar days (inclusive). Entries entirely in the past are excluded.
 *
 * @param closedDates - raw jsonb value from the provider record
 * @param today - local calendar today (defaults to new Date())
 * @param windowDays - how many days ahead to look (default 14)
 */
export function getClosingSoonEntry(
  closedDates: unknown,
  today: Date = new Date(),
  windowDays = 14
): ClosedDateEntry | null {
  if (!Array.isArray(closedDates) || closedDates.length === 0) return null;

  // Build comparison strings from local date components — avoids UTC-shift bugs.
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayStr = localDateStr(todayNorm);

  const cutoff = new Date(todayNorm);
  cutoff.setDate(cutoff.getDate() + windowDays);
  const cutoffStr = localDateStr(cutoff);

  const candidates = (closedDates as ClosedDateEntry[]).filter(
    (entry) =>
      typeof entry.from === "string" &&
      typeof entry.to === "string" &&
      entry.from >= todayStr &&   // starts today or later (not in the past)
      entry.from <= cutoffStr &&  // starts within the window
      entry.to >= todayStr        // not entirely past
  );

  if (candidates.length === 0) return null;

  // Return the entry with the earliest start date.
  return candidates.reduce((earliest, entry) =>
    entry.from < earliest.from ? entry : earliest
  );
}

/**
 * Returns true when today's local calendar date falls within any closure entry.
 * Only current entries are matched — past and future entries return false.
 *
 * @param closedDates - raw jsonb value from the provider record
 * @param today - local calendar today (defaults to new Date())
 */
export function isClosedToday(
  closedDates: unknown,
  today: Date = new Date()
): boolean {
  if (!Array.isArray(closedDates) || closedDates.length === 0) return false;

  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayStr = localDateStr(todayNorm);

  return (closedDates as ClosedDateEntry[]).some(
    (entry) =>
      typeof entry.from === "string" &&
      typeof entry.to === "string" &&
      entry.from <= todayStr &&
      entry.to >= todayStr
  );
}

/**
 * Formats a closure entry as a human-readable label, e.g. "Aug 25 – Sep 2".
 */
export function formatClosureDateRange(entry: { from: string; to: string }): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  return `${fmt(entry.from)} – ${fmt(entry.to)}`;
}
