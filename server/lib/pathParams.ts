/**
 * Parses a route path parameter as a strict positive integer.
 *
 * - Returns the integer value when `param` is a canonical non-negative integer string (e.g. "42").
 * - Returns `null` for anything else: "1junk", "1.5", "-3", "", "abc".
 *
 * Use this instead of plain `parseInt` so that partial-numeric strings like "1junk"
 * are rejected rather than silently parsed as 1.
 */
export function strictPathInt(param: string): number | null {
  if (!/^\d+$/.test(param)) return null;
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : null;
}
