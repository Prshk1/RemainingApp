import { openDB } from "../db";

export interface AttachmentRow {
  id: string;
  entry_id: string;
  user_id: string;
  file_uri: string;
  remote_path: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  synced: number;
  deleted: number;
}

export function getAttachmentsByEntryId(entryId: string): AttachmentRow[] {
  return openDB().getAllSync<AttachmentRow>(
    "SELECT * FROM attendance_attachments WHERE entry_id = ? AND deleted = 0 ORDER BY created_at ASC",
    [entryId]
  );
}

export function insertAttachment(
  row: Omit<AttachmentRow, "created_at" | "updated_at" | "synced" | "deleted">
): void {
  openDB().runSync(
    `INSERT INTO attendance_attachments (id, entry_id, user_id, file_uri, remote_path, display_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.id, row.entry_id, row.user_id, row.file_uri, row.remote_path ?? null, row.display_name ?? null]
  );
}

export function softDeleteAttachment(id: string): void {
  try {
    openDB().runSync(
      "UPDATE attendance_attachments SET deleted = 1, synced = 0, updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  } catch {
    // Backward-compat fallback for installs missing updated_at on this table.
    openDB().runSync(
      "UPDATE attendance_attachments SET deleted = 1, synced = 0 WHERE id = ?",
      [id]
    );
  }
}

export function softDeleteAttachmentsByEntryId(entryId: string): void {
  try {
    openDB().runSync(
      `UPDATE attendance_attachments
       SET deleted = 1, synced = 0, updated_at = datetime('now')
       WHERE entry_id = ? AND deleted = 0`,
      [entryId]
    );
  } catch {
    // Backward-compat fallback for installs missing updated_at on this table.
    openDB().runSync(
      `UPDATE attendance_attachments
       SET deleted = 1, synced = 0
       WHERE entry_id = ? AND deleted = 0`,
      [entryId]
    );
  }
}

export function getUnsyncedAttachments(userId: string): AttachmentRow[] {
  return openDB().getAllSync<AttachmentRow>(
    "SELECT * FROM attendance_attachments WHERE user_id = ? AND synced = 0",
    [userId]
  );
}

export function updateAttachmentPaths(
  id: string,
  fileUri: string,
  remotePath: string | null
): void {
  openDB().runSync(
    `UPDATE attendance_attachments
     SET file_uri = ?, remote_path = ?, synced = 0, updated_at = datetime('now')
     WHERE id = ?`,
    [fileUri, remotePath, id]
  );
}

export function updateAttachmentLocalFileUri(id: string, fileUri: string): void {
  openDB().runSync(
    `UPDATE attendance_attachments
     SET file_uri = ?
     WHERE id = ?`,
    [fileUri, id]
  );
}
