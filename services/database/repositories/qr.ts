import { openDB } from "../db";

export interface QRRow {
  id: string;
  user_id: string;
  local_uri: string | null;
  remote_path: string | null;
  updated_at: string;
  synced: number;
}

export function getQRImage(userId: string): QRRow | null {
  return (
    openDB().getFirstSync<QRRow>(
      "SELECT * FROM qr_image WHERE user_id = ? LIMIT 1",
      [userId]
    ) ?? null
  );
}

export function upsertQRImage(
  id: string,
  userId: string,
  localUri: string | null,
  remotePath: string | null
): void {
  const existing = getQRImage(userId);
  if (existing) {
    openDB().runSync(
      `UPDATE qr_image SET local_uri = ?, remote_path = ?, updated_at = datetime('now'), synced = 0 WHERE user_id = ?`,
      [localUri, remotePath, userId]
    );
  } else {
    openDB().runSync(
      `INSERT INTO qr_image (id, user_id, local_uri, remote_path) VALUES (?, ?, ?, ?)`,
      [id, userId, localUri, remotePath]
    );
  }
}

export function getUnsyncedQRImages(userId: string): QRRow[] {
  return openDB().getAllSync<QRRow>(
    "SELECT * FROM qr_image WHERE user_id = ? AND synced = 0",
    [userId]
  );
}
