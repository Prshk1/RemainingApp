import { openDB } from "../db";

export interface AttendanceRow {
  id: string;
  user_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_minutes: number;
  hours: number | null;
  is_manual: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  synced: number;
  deleted: number;
}

export function getAllAttendance(userId: string): AttendanceRow[] {
  return openDB().getAllSync<AttendanceRow>(
    "SELECT * FROM attendance WHERE user_id = ? AND deleted = 0 ORDER BY date DESC, created_at DESC",
    [userId]
  );
}

export function getAttendanceById(id: string): AttendanceRow | null {
  return (
    openDB().getFirstSync<AttendanceRow>(
      "SELECT * FROM attendance WHERE id = ?",
      [id]
    ) ?? null
  );
}

export function insertAttendance(
  row: Omit<AttendanceRow, "created_at" | "updated_at" | "synced" | "deleted">
): void {
  openDB().runSync(
    `INSERT OR REPLACE INTO attendance
       (id, user_id, date, time_in, time_out, break_minutes, hours, is_manual, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.user_id,
      row.date,
      row.time_in,
      row.time_out,
      row.break_minutes,
      row.hours,
      row.is_manual ? 1 : 0,
      row.note,
    ]
  );
}

export function updateAttendance(
  id: string,
  updates: Partial<
    Pick<
      AttendanceRow,
      "time_in" | "time_out" | "break_minutes" | "hours" | "note"
    >
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
    `UPDATE attendance SET ${sets.join(", ")} WHERE id = ?`,
    values
  );
}

export function softDeleteAttendance(id: string): void {
  openDB().runSync(
    `UPDATE attendance SET deleted = 1, synced = 0, updated_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export function getTotalLoggedHours(userId: string): number {
  const row = openDB().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(hours), 0) AS total FROM attendance WHERE user_id = ? AND deleted = 0 AND hours IS NOT NULL",
    [userId]
  );
  return row?.total ?? 0;
}

export function getDaysLogged(userId: string): number {
  const row = openDB().getFirstSync<{ count: number }>(
    "SELECT COUNT(DISTINCT date) AS count FROM attendance WHERE user_id = ? AND deleted = 0",
    [userId]
  );
  return row?.count ?? 0;
}

export function getUnsyncedAttendance(userId: string): AttendanceRow[] {
  return openDB().getAllSync<AttendanceRow>(
    "SELECT * FROM attendance WHERE user_id = ? AND synced = 0",
    [userId]
  );
}
