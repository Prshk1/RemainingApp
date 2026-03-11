import { openDB } from "../db";

export interface GoalsRow {
  id: number;
  user_id: string;
  required_hours: number;
  max_hours_per_day: number;
  work_days: string; // JSON stringified array
  lunch_break_enabled: number;
  time_format: string;
  updated_at: string;
  synced: number;
}

export function getGoals(userId: string): GoalsRow | null {
  return (
    openDB().getFirstSync<GoalsRow>(
      "SELECT * FROM goals WHERE user_id = ? LIMIT 1",
      [userId]
    ) ?? null
  );
}

export function upsertGoals(
  userId: string,
  requiredHours: number,
  maxHoursPerDay: number,
  workDays: string[],
  lunchBreakEnabled: boolean,
  timeFormat: string
): void {
  const existing = getGoals(userId);
  const workDaysJson = JSON.stringify(workDays);
  if (existing) {
    openDB().runSync(
      `UPDATE goals SET required_hours = ?, max_hours_per_day = ?, work_days = ?,
         lunch_break_enabled = ?, time_format = ?,
         updated_at = datetime('now'), synced = 0
       WHERE user_id = ?`,
      [
        requiredHours,
        maxHoursPerDay,
        workDaysJson,
        lunchBreakEnabled ? 1 : 0,
        timeFormat,
        userId,
      ]
    );
  } else {
    openDB().runSync(
      `INSERT INTO goals (user_id, required_hours, max_hours_per_day, work_days, lunch_break_enabled, time_format)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        requiredHours,
        maxHoursPerDay,
        workDaysJson,
        lunchBreakEnabled ? 1 : 0,
        timeFormat,
      ]
    );
  }
}
