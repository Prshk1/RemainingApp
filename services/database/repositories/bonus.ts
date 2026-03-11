import { openDB } from "../db";

export interface BonusRow {
  id: string;
  user_id: string;
  title: string;
  date: string;
  hours: number;
  status: "Pending" | "Approved";
  note: string | null;
  created_at: string;
  updated_at: string;
  synced: number;
  deleted: number;
}

export function getAllBonus(userId: string): BonusRow[] {
  return openDB().getAllSync<BonusRow>(
    "SELECT * FROM bonus WHERE user_id = ? AND deleted = 0 ORDER BY date DESC",
    [userId]
  );
}

export function getBonusById(id: string): BonusRow | null {
  return (
    openDB().getFirstSync<BonusRow>("SELECT * FROM bonus WHERE id = ?", [
      id,
    ]) ?? null
  );
}

export function insertBonus(
  row: Omit<BonusRow, "created_at" | "updated_at" | "synced" | "deleted">
): void {
  openDB().runSync(
    `INSERT OR REPLACE INTO bonus (id, user_id, title, date, hours, status, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.user_id, row.title, row.date, row.hours, row.status, row.note]
  );
}

export function updateBonus(
  id: string,
  updates: Partial<Pick<BonusRow, "title" | "date" | "hours" | "status" | "note">>
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
    `UPDATE bonus SET ${sets.join(", ")} WHERE id = ?`,
    values
  );
}

export function softDeleteBonus(id: string): void {
  openDB().runSync(
    `UPDATE bonus SET deleted = 1, synced = 0, updated_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export function getTotalBonusHours(userId: string): number {
  const row = openDB().getFirstSync<{ total: number }>(
    "SELECT COALESCE(SUM(hours), 0) AS total FROM bonus WHERE user_id = ? AND deleted = 0 AND status = 'Approved'",
    [userId]
  );
  return row?.total ?? 0;
}

export function getUnsyncedBonus(userId: string): BonusRow[] {
  return openDB().getAllSync<BonusRow>(
    "SELECT * FROM bonus WHERE user_id = ? AND synced = 0",
    [userId]
  );
}
