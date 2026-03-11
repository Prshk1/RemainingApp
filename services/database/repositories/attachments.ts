import { openDB } from "../db";

export interface AttachmentRow {
  id: string;
  entry_id: string;
  user_id: string;
  file_uri: string;
  remote_path: string | null;
  display_name: string | null;
  created_at: string;
  synced: number;
  deleted: number;
}

export function getAttachmentsByEntryId(entryId: string): AttachmentRow[] {
  return openDB().getAllSync<AttachmentRow>(
    "SELECT * FROM attendance_attachments WHERE entry_id = ? AND deleted = 0 ORDER BY created_at ASC",
    [entryId]
  );
}

export function insertAttachment(row: Omit<AttachmentRow, "created_at" | "synced" | "deleted">): void {
  openDB().runSync(
    `INSERT INTO attendance_attachments (id, entry_id, user_id, file_uri, remote_path, display_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.id, row.entry_id, row.user_id, row.file_uri, row.remote_path ?? null, row.display_name ?? null]
  );
}

export function softDeleteAttachment(id: string): void {
  openDB().runSync(
    "UPDATE attendance_attachments SET deleted = 1, synced = 0 WHERE id = ?",
    [id]
  );
}
