/**
 * Background sync engine — pushes locally unsynced records to Supabase
 * when the device is online, and marks them synced on success.
 *
 * Called from the app root after authentication and whenever the network
 * comes back online. All writes are offline-first (local SQLite is the source
 * of truth); this engine only pushes to the cloud — never overwrites local data.
 */
import { supabase } from "../supabase/client";
import {
  getUnsyncedAttendance,
} from "../database/repositories/attendance";
import { getUnsyncedBonus } from "../database/repositories/bonus";
import { getUnsyncedTimerSessions } from "../database/repositories/timer";
import { openDB } from "../database/db";

function markSynced(table: string, id: string | number): void {
  openDB().runSync(`UPDATE ${table} SET synced = 1 WHERE id = ?`, [id]);
}

async function pushAttendance(userId: string): Promise<void> {
  const rows = getUnsyncedAttendance(userId);
  for (const row of rows) {
    const { error } = await supabase.from("attendance").upsert({
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
    });
    if (!error) markSynced("attendance", row.id);
  }
}

async function pushBonus(userId: string): Promise<void> {
  const rows = getUnsyncedBonus(userId);
  for (const row of rows) {
    const { error } = await supabase.from("bonus").upsert({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      date: row.date,
      hours: row.hours,
      status: row.status,
      note: row.note,
      deleted: row.deleted === 1,
      updated_at: row.updated_at,
    });
    if (!error) markSynced("bonus", row.id);
  }
}

async function pushTimerSessions(userId: string): Promise<void> {
  const rows = getUnsyncedTimerSessions(userId);
  for (const row of rows) {
    const { error } = await supabase.from("timer_sessions").upsert({
      id: row.id,
      user_id: row.user_id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      break_minutes: row.break_minutes,
      is_active: row.is_active === 1,
      updated_at: row.updated_at,
    });
    if (!error) markSynced("timer_sessions", row.id);
  }
}

/** Run a full sync cycle for the given user. Safe to call repeatedly. */
export async function runSync(userId: string): Promise<void> {
  try {
    await Promise.all([
      pushAttendance(userId),
      pushBonus(userId),
      pushTimerSessions(userId),
    ]);
  } catch {
    // Sync failures are silent — the app remains fully functional offline.
    // Records will be re-attempted on the next sync cycle.
  }
}
