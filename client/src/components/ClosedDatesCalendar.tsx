/**
 * ClosedDatesCalendar
 * A compact mini-calendar that visually marks every date covered by provider
 * closure ranges. Families can navigate month-by-month to check availability.
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ClosedDateEntry {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  reason?: string;
}

interface Props {
  closedDates: ClosedDateEntry[];
  /** How many months to show a nav arrow for (default: 12) */
  maxMonthsAhead?: number;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/** Returns YYYY-MM-DD for a local Date */
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Build a Set of ISO strings for every day covered by any closure range */
function buildClosedSet(entries: ClosedDateEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of entries) {
    const from = new Date(e.from + "T00:00:00");
    const to = new Date(e.to + "T00:00:00");
    const cur = new Date(from);
    while (cur <= to) {
      set.add(toIso(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

/** Return the reason(s) that cover a given ISO date */
function reasonsForDay(iso: string, entries: ClosedDateEntry[]): string[] {
  return entries
    .filter((e) => iso >= e.from && iso <= e.to && e.reason)
    .map((e) => e.reason!);
}

export function ClosedDatesCalendar({ closedDates, maxMonthsAhead = 12 }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const closedSet = buildClosedSet(closedDates);

  // Navigation bounds
  const minYear = today.getFullYear();
  const minMonth = today.getMonth();
  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + maxMonthsAhead);
  const maxYear = maxDate.getFullYear();
  const maxMonth = maxDate.getMonth();

  const canPrev = year > minYear || (year === minYear && month > minMonth);
  const canNext = year < maxYear || (year === maxYear && month < maxMonth);

  function prev() {
    if (!canPrev) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (!canNext) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // Build days grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = toIso(today);

  // Count upcoming closures this month
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const monthClosures = closedDates.filter((e) => e.to >= monthStart && e.from <= monthEnd);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={prev}
          disabled={!canPrev}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-gray-700">
          {MONTH_NAMES[month]} {year}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={next}
          disabled={!canNext}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-0">
        {DAY_LABELS.map((l) => (
          <div key={l} className="text-center text-[10px] font-semibold text-gray-400 pb-1">
            {l}
          </div>
        ))}

        {/* Calendar cells */}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isClosed = closedSet.has(iso);
          const isToday = iso === todayIso;
          const isPast = iso < todayIso;
          const reasons = isClosed ? reasonsForDay(iso, closedDates) : [];

          return (
            <div
              key={iso}
              title={isClosed && reasons.length > 0 ? reasons.join(", ") : undefined}
              className={[
                "flex items-center justify-center text-xs rounded-sm mx-0.5 my-0.5 h-7 w-full select-none",
                isClosed
                  ? "bg-red-100 text-red-700 font-semibold ring-1 ring-red-200"
                  : isPast
                  ? "text-gray-300"
                  : "text-gray-600 hover:bg-gray-50",
                isToday && !isClosed ? "ring-1 ring-brand-evergreen font-semibold" : "",
                isToday && isClosed ? "ring-2 ring-red-400" : "",
              ].join(" ")}
              aria-label={isClosed ? `${iso} closed${reasons[0] ? ` — ${reasons[0]}` : ""}` : undefined}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Closure legend for this month */}
      {monthClosures.length > 0 ? (
        <ul className="space-y-1 pt-1">
          {monthClosures.map((e, i) => {
            const fmtDate = (iso: string) => {
              const [yr, mo, d] = iso.split("-");
              return new Date(parseInt(yr), parseInt(mo) - 1, parseInt(d))
                .toLocaleDateString("en-US", { month: "short", day: "numeric" });
            };
            return (
              <li key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                <span className="mt-0.5 shrink-0 h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-200 inline-block" />
                <span>
                  <span className="font-medium">
                    {e.from === e.to ? fmtDate(e.from) : `${fmtDate(e.from)} – ${fmtDate(e.to)}`}
                  </span>
                  {e.reason && <span className="text-red-500 ml-1">· {e.reason}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 text-center pt-1">No closures this month</p>
      )}
    </div>
  );
}
