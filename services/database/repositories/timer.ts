import { openDB } from "../db";

export interface TimerRow {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  break_minutes: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  synced: number;
}

export function getActiveTimer(userId: string): TimerRow | null {
  return (
    openDB().getFirstSync<TimerRow>(
      "SELECT * FROM timer_sessions WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    ) ?? null
  );
}

export function getTimerById(id: string): TimerRow | null {
  return (
    openDB().getFirstSync<TimerRow>(
      "SELECT * FROM timer_sessions WHERE id = ?",
      [id]
    ) ?? null
  );
}

export function insertTimerSession(
  row: Omit<TimerRow, "created_at" | "updated_at" | "synced">
): void {
  openDB().runSync(
    `INSERT INTO timer_sessions
       (id, user_id, date, start_time, end_time, break_minutes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.user_id,
      row.date,
      row.start_time,
      row.end_time,
      row.break_minutes,
      row.is_active ? 1 : 0,
    ]
  );
}

export function updateTimerSession(
  id: string,
  updates: Partial<
    Pick<TimerRow, "end_time" | "break_minutes" | "is_active">
  >
): void {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(updates)) {
    sets.push(`${k} = ?`);
    values.push(v as string | number | null);
  }
  sets.push("updated_at = datetime('now')", "synced = 0");
  values.push(id);
  openDB().runSync(
    `UPDATE timer_sessions SET ${sets.join(", ")} WHERE id = ?`,
    values
  );
}

export function getUnsyncedTimerSessions(userId: string): TimerRow[] {
  return openDB().getAllSync<TimerRow>(
    "SELECT * FROM timer_sessions WHERE user_id = ? AND synced = 0",
    [userId]
  );
}
