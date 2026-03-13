/**
 * Background sync engine for offline-first data flow.
 *
 * Sync order is pull-then-push using last-write-wins by `updated_at`:
 * 1) Pull remote records and merge into local SQLite when remote is newer.
 * 2) Push local unsynced records to Supabase and mark local rows as synced.
 */
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
} from "../database/repositories/attachments";
import { openDB } from "../database/db";

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

async function pullQRImage(userId: string): Promise<number> {
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

  if (local) {
    openDB().runSync(
      `UPDATE qr_image SET id = ?, local_uri = ?, remote_path = ?, updated_at = ?, synced = 1 WHERE user_id = ?`,
      [remote.id, remote.local_uri, remote.remote_path, remote.updated_at, userId]
    );
  } else {
    openDB().runSync(
      `INSERT INTO qr_image (id, user_id, local_uri, remote_path, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [remote.id, remote.user_id, remote.local_uri, remote.remote_path, remote.updated_at]
    );
  }

  return 1;
}

async function pullAttachments(userId: string): Promise<number> {
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

    openDB().runSync(
      `INSERT OR REPLACE INTO attendance_attachments
       (id, entry_id, user_id, file_uri, remote_path, display_name, created_at, updated_at, synced, deleted)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), ?, 1, ?)`,
      [
        remote.id,
        remote.entry_id,
        remote.user_id,
        remote.file_uri,
        remote.remote_path,
        remote.display_name,
        remote.created_at,
        remote.updated_at,
        remote.deleted ? 1 : 0,
      ]
    );
    merged += 1;
  }

  return merged;
}

async function pushAttendance(userId: string): Promise<void> {
  const rows = getUnsyncedAttendance(userId);
  for (const row of rows) {
    if (row.deleted === 1) {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", row.id)
        .eq("user_id", row.user_id);
      if (!error) markSynced("attendance", row.id);
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

async function pushQRImage(userId: string): Promise<void> {
  const rows = getUnsyncedQRImages(userId);
  for (const row of rows) {
    const { error } = await supabase.from("qr_image").upsert(
      {
        id: row.id,
        user_id: row.user_id,
        local_uri: row.local_uri,
        remote_path: row.remote_path,
        updated_at: row.updated_at,
      },
      { onConflict: "id" }
    );
    if (!error) markSynced("qr_image", row.id);
  }
}

async function pushAttachments(userId: string): Promise<void> {
  const rows = getUnsyncedAttachments(userId);
  for (const row of rows) {
    if (row.deleted === 1) {
      const { error } = await supabase
        .from("attendance_attachments")
        .delete()
        .eq("id", row.id)
        .eq("user_id", row.user_id);
      if (!error) markSynced("attendance_attachments", row.id);
      continue;
    }

    const { error } = await supabase.from("attendance_attachments").upsert(
      {
        id: row.id,
        entry_id: row.entry_id,
        user_id: row.user_id,
        file_uri: row.file_uri,
        remote_path: row.remote_path,
        display_name: row.display_name,
        updated_at: row.updated_at,
        deleted: row.deleted === 1,
      },
      { onConflict: "id" }
    );
    if (!error) markSynced("attendance_attachments", row.id);
  }
}

export interface SyncRunResult {
  pulled: number;
  pushed: number;
  failed: number;
}

/** Run a full sync cycle for the given user. Safe to call repeatedly. */
export async function runSync(userId: string): Promise<SyncRunResult> {
  let pulled = 0;
  const pendingBefore = getPendingSyncCount(userId);
  try {
    // Push local changes first so user edits/deletes are not overwritten by stale remote rows.
    await pushAttendance(userId);
    await pushBonus(userId);
    await pushTimerSessions(userId);
    await pushGoals(userId);
    await pushQRImage(userId);
    await pushAttachments(userId);

    pulled += await pullAttendance(userId);
    pulled += await pullBonus(userId);
    pulled += await pullTimerSessions(userId);
    pulled += await pullGoals(userId);
    pulled += await pullQRImage(userId);
    pulled += await pullAttachments(userId);

    const pendingAfter = getPendingSyncCount(userId);
    return {
      pulled,
      pushed: Math.max(0, pendingBefore - pendingAfter),
      failed: pendingAfter,
    };
  } catch {
    return {
      pulled,
      pushed: 0,
      failed: getPendingSyncCount(userId),
    };
  }
}
