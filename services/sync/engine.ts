/**
 * Background sync engine for offline-first data flow.
 *
 * Sync order is push-then-pull using last-write-wins by `updated_at`:
 * 1) Push local unsynced records to Supabase and mark local rows as synced.
 * 2) Pull remote records and merge into local SQLite when remote is newer.
 */
import * as FileSystem from "expo-file-system/legacy";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { supabase } from "../supabase/client";
import {
  AttendanceRow,
  getUnsyncedAttendance,
} from "../database/repositories/attendance";
import { BonusRow, getUnsyncedBonus } from "../database/repositories/bonus";
import {
  TimerRow,
  getUnsyncedTimerSessions,
} from "../database/repositories/timer";
import { GoalsRow, getUnsyncedGoals } from "../database/repositories/goals";
import { QRRow, getUnsyncedQRImages } from "../database/repositories/qr";
import {
  AttachmentRow,
  getUnsyncedAttachments,
  updateAttachmentLocalFileUri,
} from "../database/repositories/attachments";
import { openDB } from "../database/db";

const ATTACHMENTS_BUCKET = "attendance-attachments";
const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}attachments/`;
const QR_BUCKET = "qr-images";
const QR_DIR = `${FileSystem.documentDirectory}qr/`;

type SyncFailure = {
  entity: "attachments" | "qr_image";
  phase: "push" | "pull";
  id: string;
  message: string;
};

function recordFailure(
  failures: SyncFailure[],
  failure: SyncFailure
): void {
  failures.push(failure);
}

function summarizeFailures(failures: SyncFailure[]): string | null {
  if (failures.length === 0) return null;
  const first = failures[0];
  const prefix = `${first.entity} ${first.phase} failed (${first.id})`;
  if (failures.length === 1) {
    return `${prefix}: ${first.message}`;
  }
  return `${prefix}: ${first.message} (+${failures.length - 1} more)`;
}

function markSynced(table: string, id: string | number): void {
  openDB().runSync(`UPDATE ${table} SET synced = 1 WHERE id = ?`, [id]);
}

function markSyncedByUser(table: string, userId: string): void {
  openDB().runSync(`UPDATE ${table} SET synced = 1 WHERE user_id = ?`, [userId]);
}

function parseTimestamp(input: string): number {
  const direct = Date.parse(input);
  if (!Number.isNaN(direct)) return direct;

  // SQLite datetime('now') format is "YYYY-MM-DD HH:MM:SS" (UTC, no timezone marker).
  // Normalize to strict ISO so parsing is stable across JS engines.
  const sqliteLike = input.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  if (sqliteLike) {
    const normalized = input.replace(" ", "T") + "Z";
    const normalizedTs = Date.parse(normalized);
    if (!Number.isNaN(normalizedTs)) return normalizedTs;
  }

  return Number.NaN;
}

function isRemoteNewer(remoteUpdatedAt: string, localUpdatedAt: string): boolean {
  const remoteTs = parseTimestamp(remoteUpdatedAt);
  const localTs = parseTimestamp(localUpdatedAt);
  if (!Number.isNaN(remoteTs) && !Number.isNaN(localTs)) {
    return remoteTs > localTs;
  }
  return remoteUpdatedAt > localUpdatedAt;
}

function countPendingForUser(userId: string, table: string): number {
  const row = openDB().getFirstSync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM ${table} WHERE user_id = ? AND synced = 0`,
    [userId]
  );
  return row?.total ?? 0;
}

export function getPendingSyncCount(userId: string): number {
  return (
    countPendingForUser(userId, "attendance") +
    countPendingForUser(userId, "bonus") +
    countPendingForUser(userId, "timer_sessions") +
    countPendingForUser(userId, "goals") +
    countPendingForUser(userId, "qr_image") +
    countPendingForUser(userId, "attendance_attachments")
  );
}

type RemoteAttendance = {
  id: string;
  user_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  break_minutes: number;
  hours: number | null;
  is_manual: boolean;
  note: string | null;
  created_at: string | null;
  updated_at: string;
  deleted: boolean;
};

type RemoteBonus = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  hours: number;
  status: "Pending" | "Approved";
  note: string | null;
  created_at: string | null;
  updated_at: string;
  deleted: boolean;
};

type RemoteTimer = {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  break_minutes: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string;
};

type RemoteGoals = {
  user_id: string;
  required_hours: number;
  max_hours_per_day: number;
  work_days: string;
  lunch_break_enabled: boolean;
  time_format: string;
  updated_at: string;
};

type RemoteQR = {
  id: string;
  user_id: string;
  local_uri: string | null;
  remote_path: string | null;
  updated_at: string;
};

type RemoteAttachment = {
  id: string;
  entry_id: string;
  user_id: string;
  file_uri: string;
  remote_path: string | null;
  display_name: string | null;
  created_at: string | null;
  updated_at: string;
  deleted: boolean;
};

function sanitizePathSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function inferAttachmentExtension(pathOrName: string | null | undefined): string {
  if (!pathOrName) return "jpg";
  const matched = pathOrName.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  const ext = matched?.[1]?.toLowerCase();
  if (!ext) return "jpg";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(ext)) {
    return ext;
  }
  return "jpg";
}

function inferAttachmentMimeType(pathOrName: string | null | undefined): string {
  const ext = inferAttachmentExtension(pathOrName);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return "application/octet-stream";
}

function buildAttachmentRemotePath(row: AttachmentRow): string {
  const ext = inferAttachmentExtension(row.file_uri || row.display_name);
  return `${sanitizePathSegment(row.user_id)}/${sanitizePathSegment(row.entry_id)}/${sanitizePathSegment(row.id)}.${ext}`;
}

async function ensureAttachmentsDirectory(): Promise<void> {
  await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
}

async function ensureQRDirectory(): Promise<void> {
  await FileSystem.makeDirectoryAsync(QR_DIR, { intermediates: true });
}

async function localFileExists(uri: string | null | undefined): Promise<boolean> {
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists;
  } catch {
    return false;
  }
}

async function getUploadArrayBuffer(localUri: string): Promise<ArrayBuffer> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decodeBase64(base64);
}

async function uploadAttachmentToStorage(
  row: AttachmentRow,
  remotePath: string,
  failures: SyncFailure[]
): Promise<boolean> {
  try {
    const exists = await localFileExists(row.file_uri);
    if (!exists) {
      const message = "Local attachment file is missing";
      console.warn("Attachment upload skipped; local file missing", row.id);
      recordFailure(failures, {
        entity: "attachments",
        phase: "push",
        id: row.id,
        message,
      });
      return false;
    }

    const mimeType = inferAttachmentMimeType(row.file_uri || row.display_name);
    const uploadBody = await getUploadArrayBuffer(row.file_uri);
    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(remotePath, uploadBody, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn("Attachment upload failed", row.id, error.message);
      recordFailure(failures, {
        entity: "attachments",
        phase: "push",
        id: row.id,
        message: error.message,
      });
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Attachment upload crashed", row.id, error);
    recordFailure(failures, {
      entity: "attachments",
      phase: "push",
      id: row.id,
      message: error instanceof Error ? error.message : "Unexpected upload crash",
    });
    return false;
  }
}

async function deleteAttachmentFromStorage(remotePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([remotePath]);
    if (error) {
      console.warn("Attachment storage delete failed", remotePath, error.message);
    }
  } catch (error) {
    console.warn("Attachment storage delete crashed", remotePath, error);
  }
}

async function downloadAttachmentToLocal(
  remote: RemoteAttachment,
  fallbackLocalUri: string | null,
  failures: SyncFailure[]
): Promise<string | null> {
  if (!remote.remote_path) {
    return fallbackLocalUri;
  }

  try {
    await ensureAttachmentsDirectory();
    const ext = inferAttachmentExtension(remote.remote_path || remote.file_uri || remote.display_name);
    const localUri = `${ATTACHMENTS_DIR}${sanitizePathSegment(remote.id)}.${ext}`;
    const { data, error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(remote.remote_path, 120);
    if (error || !data?.signedUrl) {
      console.warn("Attachment signed URL failed", remote.id, error?.message);
      recordFailure(failures, {
        entity: "attachments",
        phase: "pull",
        id: remote.id,
        message: error?.message ?? "Could not create signed URL",
      });
      return fallbackLocalUri;
    }

    const downloaded = await FileSystem.downloadAsync(data.signedUrl, localUri);
    if (downloaded.status >= 200 && downloaded.status < 300) {
      return downloaded.uri;
    }
    console.warn("Attachment download returned non-success status", remote.id, downloaded.status);
    recordFailure(failures, {
      entity: "attachments",
      phase: "pull",
      id: remote.id,
      message: `HTTP ${downloaded.status}`,
    });
    return fallbackLocalUri;
  } catch (error) {
    console.warn("Attachment download crashed", remote.id, error);
    recordFailure(failures, {
      entity: "attachments",
      phase: "pull",
      id: remote.id,
      message: error instanceof Error ? error.message : "Unexpected download crash",
    });
    return fallbackLocalUri;
  }
}

function inferQRExtension(pathOrName: string | null | undefined): string {
  return inferAttachmentExtension(pathOrName);
}

function inferQRMimeType(pathOrName: string | null | undefined): string {
  return inferAttachmentMimeType(pathOrName);
}

function buildQRRemotePath(row: QRRow): string {
  const ext = inferQRExtension(row.local_uri || row.remote_path);
  return `${sanitizePathSegment(row.user_id)}/qr.${ext}`;
}

async function uploadQRToStorage(row: QRRow, failures: SyncFailure[]): Promise<string | null> {
  if (!row.local_uri) {
    recordFailure(failures, {
      entity: "qr_image",
      phase: "push",
      id: row.id,
      message: "QR local image is missing",
    });
    return null;
  }

  const exists = await localFileExists(row.local_uri);
  if (!exists) {
    recordFailure(failures, {
      entity: "qr_image",
      phase: "push",
      id: row.id,
      message: "QR local image file is missing",
    });
    return null;
  }

  try {
    const remotePath = row.remote_path || buildQRRemotePath(row);
    const contentType = inferQRMimeType(row.local_uri);
    const uploadBody = await getUploadArrayBuffer(row.local_uri);
    const { error } = await supabase.storage.from(QR_BUCKET).upload(remotePath, uploadBody, {
      contentType,
      upsert: true,
    });
    if (error) {
      recordFailure(failures, {
        entity: "qr_image",
        phase: "push",
        id: row.id,
        message: error.message,
      });
      return null;
    }
    return remotePath;
  } catch (error) {
    recordFailure(failures, {
      entity: "qr_image",
      phase: "push",
      id: row.id,
      message: error instanceof Error ? error.message : "Unexpected QR upload crash",
    });
    return null;
  }
}

async function downloadQRToLocal(
  row: RemoteQR,
  failures: SyncFailure[]
): Promise<string | null> {
  if (!row.remote_path) return row.local_uri;
  try {
    await ensureQRDirectory();
    const ext = inferQRExtension(row.remote_path || row.local_uri);
    const localUri = `${QR_DIR}${sanitizePathSegment(row.user_id)}.${ext}`;
    const { data, error } = await supabase.storage
      .from(QR_BUCKET)
      .createSignedUrl(row.remote_path, 120);
    if (error || !data?.signedUrl) {
      recordFailure(failures, {
        entity: "qr_image",
        phase: "pull",
        id: row.id,
        message: error?.message ?? "Could not create QR signed URL",
      });
      return row.local_uri;
    }

    const downloaded = await FileSystem.downloadAsync(data.signedUrl, localUri);
    if (downloaded.status >= 200 && downloaded.status < 300) {
      return downloaded.uri;
    }
    recordFailure(failures, {
      entity: "qr_image",
      phase: "pull",
      id: row.id,
      message: `HTTP ${downloaded.status}`,
    });
    return row.local_uri;
  } catch (error) {
    recordFailure(failures, {
      entity: "qr_image",
      phase: "pull",
      id: row.id,
      message: error instanceof Error ? error.message : "Unexpected QR download crash",
    });
    return row.local_uri;
  }
}

async function pullAttendance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId);
  if (error || !data) return 0;

  let merged = 0;
  const rows = data as RemoteAttendance[];
  for (const remote of rows) {
    const local = openDB().getFirstSync<AttendanceRow>(
      "SELECT * FROM attendance WHERE id = ? LIMIT 1",
      [remote.id]
    );
    if (local?.synced === 0) {
      continue;
    }
    if (local && !isRemoteNewer(remote.updated_at, local.updated_at)) {
      continue;
    }

    openDB().runSync(
      `INSERT OR REPLACE INTO attendance
       (id, user_id, date, time_in, time_out, break_minutes, hours, is_manual, note, created_at, updated_at, synced, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?, 1, ?)`,
      [
        remote.id,
        remote.user_id,
        remote.date,
        remote.time_in,
        remote.time_out,
        remote.break_minutes,
        remote.hours,
        remote.is_manual ? 1 : 0,
        remote.note,
        remote.created_at,
        remote.updated_at,
        remote.deleted ? 1 : 0,
      ]
    );
    merged += 1;
  }

  return merged;
}

async function pullBonus(userId: string): Promise<number> {
  const { data, error } = await supabase.from("bonus").select("*").eq("user_id", userId);
  if (error || !data) return 0;

  let merged = 0;
  const rows = data as RemoteBonus[];
  for (const remote of rows) {
    const local = openDB().getFirstSync<BonusRow>(
      "SELECT * FROM bonus WHERE id = ? LIMIT 1",
      [remote.id]
    );
    if (local?.synced === 0) {
      continue;
    }
    if (local && !isRemoteNewer(remote.updated_at, local.updated_at)) {
      continue;
    }

    openDB().runSync(
      `INSERT OR REPLACE INTO bonus
       (id, user_id, title, date, hours, status, note, created_at, updated_at, synced, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?, 1, ?)`,
      [
        remote.id,
        remote.user_id,
        remote.title,
        remote.date,
        remote.hours,
        remote.status,
        remote.note,
        remote.created_at,
        remote.updated_at,
        remote.deleted ? 1 : 0,
      ]
    );
    merged += 1;
  }

  return merged;
}

async function pullTimerSessions(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("user_id", userId);
  if (error || !data) return 0;

  let merged = 0;
  const rows = data as RemoteTimer[];
  for (const remote of rows) {
    const local = openDB().getFirstSync<TimerRow>(
      "SELECT * FROM timer_sessions WHERE id = ? LIMIT 1",
      [remote.id]
    );
    if (local?.synced === 0) {
      continue;
    }
    if (local && !isRemoteNewer(remote.updated_at, local.updated_at)) {
      continue;
    }

    openDB().runSync(
      `INSERT OR REPLACE INTO timer_sessions
       (id, user_id, date, start_time, end_time, break_minutes, is_active, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?, 1)`,
      [
        remote.id,
        remote.user_id,
        remote.date,
        remote.start_time,
        remote.end_time,
        remote.break_minutes,
        remote.is_active ? 1 : 0,
        remote.created_at,
        remote.updated_at,
      ]
    );
    merged += 1;
  }

  return merged;
}

async function pullGoals(userId: string): Promise<number> {
  const { data, error } = await supabase.from("goals").select("*").eq("user_id", userId).limit(1);
  if (error || !data || data.length === 0) return 0;

  const remote = data[0] as RemoteGoals;
  const local = openDB().getFirstSync<GoalsRow>(
    "SELECT * FROM goals WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (local?.synced === 0) {
    return 0;
  }
  if (local && !isRemoteNewer(remote.updated_at, local.updated_at)) {
    return 0;
  }

  if (local) {
    openDB().runSync(
      `UPDATE goals SET required_hours = ?, max_hours_per_day = ?, work_days = ?,
         lunch_break_enabled = ?, time_format = ?, updated_at = ?, synced = 1
       WHERE user_id = ?`,
      [
        remote.required_hours,
        remote.max_hours_per_day,
        remote.work_days,
        remote.lunch_break_enabled ? 1 : 0,
        remote.time_format,
        remote.updated_at,
        userId,
      ]
    );
  } else {
    openDB().runSync(
      `INSERT INTO goals
       (user_id, required_hours, max_hours_per_day, work_days, lunch_break_enabled, time_format, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        remote.required_hours,
        remote.max_hours_per_day,
        remote.work_days,
        remote.lunch_break_enabled ? 1 : 0,
        remote.time_format,
        remote.updated_at,
      ]
    );
  }

  return 1;
}

async function pullQRImage(userId: string, failures: SyncFailure[]): Promise<number> {
  const { data, error } = await supabase.from("qr_image").select("*").eq("user_id", userId).limit(1);
  if (error || !data || data.length === 0) return 0;

  const remote = data[0] as RemoteQR;
  const local = openDB().getFirstSync<QRRow>(
    "SELECT * FROM qr_image WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (local?.synced === 0) {
    return 0;
  }
  if (local && !isRemoteNewer(remote.updated_at, local.updated_at)) {
    return 0;
  }

  let resolvedLocalUri = remote.local_uri;
  if (remote.remote_path) {
    const hasLocalFile = await localFileExists(local?.local_uri);
    if (hasLocalFile && local?.local_uri) {
      resolvedLocalUri = local.local_uri;
    } else {
      resolvedLocalUri = await downloadQRToLocal(remote, failures);
    }
  }

  if (local) {
    openDB().runSync(
      `UPDATE qr_image SET id = ?, local_uri = ?, remote_path = ?, updated_at = ?, synced = 1 WHERE user_id = ?`,
      [remote.id, resolvedLocalUri, remote.remote_path, remote.updated_at, userId]
    );
  } else {
    openDB().runSync(
      `INSERT INTO qr_image (id, user_id, local_uri, remote_path, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [remote.id, remote.user_id, resolvedLocalUri, remote.remote_path, remote.updated_at]
    );
  }

  return 1;
}

async function pullAttachments(userId: string, failures: SyncFailure[]): Promise<number> {
  const { data, error } = await supabase
    .from("attendance_attachments")
    .select("*")
    .eq("user_id", userId);
  if (error || !data) return 0;

  let merged = 0;
  const rows = data as RemoteAttachment[];
  for (const remote of rows) {
    const local = openDB().getFirstSync<AttachmentRow>(
      "SELECT * FROM attendance_attachments WHERE id = ? LIMIT 1",
      [remote.id]
    );
    if (local?.synced === 0) {
      continue;
    }
    if (local && !isRemoteNewer(remote.updated_at, local.updated_at)) {
      continue;
    }

    let resolvedFileUri = remote.file_uri;
    if (!remote.deleted) {
      if (remote.remote_path) {
        const hasLocalFile = await localFileExists(local?.file_uri);
        if (hasLocalFile && local?.file_uri) {
          resolvedFileUri = local.file_uri;
        } else {
          resolvedFileUri =
            (await downloadAttachmentToLocal(remote, local?.file_uri ?? null, failures)) ??
            remote.file_uri;
        }
      } else if (local?.file_uri) {
        resolvedFileUri = local.file_uri;
      }
    }

    openDB().runSync(
      `INSERT OR REPLACE INTO attendance_attachments
       (id, entry_id, user_id, file_uri, remote_path, display_name, created_at, updated_at, synced, deleted)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?, 1, ?)`,
      [
        remote.id,
        remote.entry_id,
        remote.user_id,
        resolvedFileUri,
        remote.remote_path,
        remote.display_name,
        remote.created_at,
        remote.updated_at,
        remote.deleted ? 1 : 0,
      ]
    );

    if (resolvedFileUri && local?.file_uri !== resolvedFileUri) {
      updateAttachmentLocalFileUri(remote.id, resolvedFileUri);
    }
    merged += 1;
  }

  return merged;
}

async function pushAttendance(userId: string, failures: SyncFailure[]): Promise<void> {
  const rows = getUnsyncedAttendance(userId);
  for (const row of rows) {
    if (row.deleted === 1) {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", row.id)
        .eq("user_id", row.user_id);
      if (!error) {
        markSynced("attendance", row.id);
      }
      continue;
    }

    const { error } = await supabase.from("attendance").upsert(
      {
        id: row.id,
        user_id: row.user_id,
        date: row.date,
        time_in: row.time_in,
        time_out: row.time_out,
        break_minutes: row.break_minutes,
        hours: row.hours,
        is_manual: row.is_manual === 1,
        note: row.note,
        deleted: row.deleted === 1,
        updated_at: row.updated_at,
      },
      { onConflict: "id" }
    );
    if (!error) markSynced("attendance", row.id);
  }
}

async function pushBonus(userId: string): Promise<void> {
  const rows = getUnsyncedBonus(userId);
  for (const row of rows) {
    if (row.deleted === 1) {
      const { error } = await supabase
        .from("bonus")
        .delete()
        .eq("id", row.id)
        .eq("user_id", row.user_id);
      if (!error) markSynced("bonus", row.id);
      continue;
    }

    const { error } = await supabase.from("bonus").upsert(
      {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        date: row.date,
        hours: row.hours,
        status: row.status,
        note: row.note,
        deleted: row.deleted === 1,
        updated_at: row.updated_at,
      },
      { onConflict: "id" }
    );
    if (!error) markSynced("bonus", row.id);
  }
}

async function pushTimerSessions(userId: string): Promise<void> {
  const rows = getUnsyncedTimerSessions(userId);
  for (const row of rows) {
    const { error } = await supabase.from("timer_sessions").upsert(
      {
        id: row.id,
        user_id: row.user_id,
        date: row.date,
        start_time: row.start_time,
        end_time: row.end_time,
        break_minutes: row.break_minutes,
        is_active: row.is_active === 1,
        updated_at: row.updated_at,
      },
      { onConflict: "id" }
    );
    if (!error) markSynced("timer_sessions", row.id);
  }
}

async function pushGoals(userId: string): Promise<void> {
  const rows = getUnsyncedGoals(userId);
  if (rows.length === 0) return;

  for (const row of rows) {
    const { error } = await supabase.from("goals").upsert(
      {
        user_id: row.user_id,
        required_hours: row.required_hours,
        max_hours_per_day: row.max_hours_per_day,
        work_days: row.work_days,
        lunch_break_enabled: row.lunch_break_enabled === 1,
        time_format: row.time_format,
        updated_at: row.updated_at,
      },
      { onConflict: "user_id" }
    );
    if (!error) markSyncedByUser("goals", row.user_id);
  }
}

async function pushQRImage(userId: string, failures: SyncFailure[]): Promise<void> {
  const rows = getUnsyncedQRImages(userId);
  for (const row of rows) {
    const remotePath = await uploadQRToStorage(row, failures);
    if (!remotePath) {
      continue;
    }

    const { error } = await supabase.from("qr_image").upsert(
      {
        id: row.id,
        user_id: row.user_id,
        local_uri: row.local_uri,
        remote_path: remotePath,
        updated_at: row.updated_at,
      },
      { onConflict: "id" }
    );
    if (!error) {
      openDB().runSync("UPDATE qr_image SET remote_path = ? WHERE id = ?", [
        remotePath,
        row.id,
      ]);
      markSynced("qr_image", row.id);
    } else {
      recordFailure(failures, {
        entity: "qr_image",
        phase: "push",
        id: row.id,
        message: error.message,
      });
    }
  }
}

async function pushAttachments(userId: string, failures: SyncFailure[]): Promise<void> {
  const rows = getUnsyncedAttachments(userId);
  for (const row of rows) {
    if (row.deleted === 1) {
      if (row.remote_path) {
        await deleteAttachmentFromStorage(row.remote_path);
      }
      const { error } = await supabase
        .from("attendance_attachments")
        .delete()
        .eq("id", row.id)
        .eq("user_id", row.user_id);
      if (!error) markSynced("attendance_attachments", row.id);
      continue;
    }

    const remotePath = row.remote_path || buildAttachmentRemotePath(row);
    const uploaded = await uploadAttachmentToStorage(row, remotePath, failures);
    if (!uploaded) {
      continue;
    }

    const { error } = await supabase.from("attendance_attachments").upsert(
      {
        id: row.id,
        entry_id: row.entry_id,
        user_id: row.user_id,
        file_uri: row.file_uri,
        remote_path: remotePath,
        display_name: row.display_name,
        updated_at: row.updated_at,
        deleted: row.deleted === 1,
      },
      { onConflict: "id" }
    );
    if (!error) {
      openDB().runSync(
        "UPDATE attendance_attachments SET remote_path = ? WHERE id = ?",
        [remotePath, row.id]
      );
      markSynced("attendance_attachments", row.id);
    } else {
      recordFailure(failures, {
        entity: "attachments",
        phase: "push",
        id: row.id,
        message: error.message,
      });
    }
  }
}

export interface SyncRunResult {
  pulled: number;
  pushed: number;
  failed: number;
  failureSummary: string | null;
  failureDetails: string[];
}

/** Run a full sync cycle for the given user. Safe to call repeatedly. */
export async function runSync(userId: string): Promise<SyncRunResult> {
  let pulled = 0;
  const pendingBefore = getPendingSyncCount(userId);
  const failures: SyncFailure[] = [];
  try {
    // Push local changes first so user edits/deletes are not overwritten by stale remote rows.
    await pushAttendance(userId, failures);
    await pushBonus(userId);
    await pushTimerSessions(userId);
    await pushGoals(userId);
    await pushQRImage(userId, failures);
    await pushAttachments(userId, failures);

    pulled += await pullAttendance(userId);
    pulled += await pullBonus(userId);
    pulled += await pullTimerSessions(userId);
    pulled += await pullGoals(userId);
    pulled += await pullQRImage(userId, failures);
    pulled += await pullAttachments(userId, failures);

    const pendingAfter = getPendingSyncCount(userId);
    return {
      pulled,
      pushed: Math.max(0, pendingBefore - pendingAfter),
      failed: pendingAfter,
      failureSummary: summarizeFailures(failures),
      failureDetails: failures.map(
        (f) => `${f.entity} ${f.phase} ${f.id}: ${f.message}`
      ),
    };
  } catch {
    return {
      pulled,
      pushed: 0,
      failed: getPendingSyncCount(userId),
      failureSummary: summarizeFailures(failures),
      failureDetails: failures.map(
        (f) => `${f.entity} ${f.phase} ${f.id}: ${f.message}`
      ),
    };
  }
}
