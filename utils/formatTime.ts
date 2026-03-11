/**
 * Convert a Date (or ISO string) to a display time string, respecting the
 * user's time-format preference.
 */
export function formatTime(
  date: Date | string | null | undefined,
  format: "12h" | "24h"
): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-US", {
    hour12: format === "12h",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a Date or ISO string as a short display date (e.g. "Mar 11, 2026") */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Full day + date (e.g. "Wednesday, Mar 11, 2026") */
export function formatFullDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Return the day-name of a date (e.g. "Monday") */
export function getDayName(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/** Format seconds into HH MM SS parts */
export function secondsToHMS(totalSeconds: number): {
  h: number;
  m: number;
  s: number;
} {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s };
}

/** Convert hours (decimal) to "Xh Ym" string */
export function hoursToDisplay(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
