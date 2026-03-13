import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  AttendanceRow,
  getAllAttendance,
  getDaysLogged,
  getTotalLoggedHours,
  insertAttendance,
  softDeleteAttendance,
  updateAttendance,
} from "../services/database/repositories/attendance";
import { generateId } from "../utils/generateId";
import { useSync } from "./SyncContext";

export interface AttendanceEntry {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  breakMinutes: number;
  hours: number | null;
  isManual: boolean;
  note: string | null;
}

function rowToEntry(row: AttendanceRow): AttendanceEntry {
  return {
    id: row.id,
    date: row.date,
    timeIn: row.time_in,
    timeOut: row.time_out,
    breakMinutes: row.break_minutes,
    hours: row.hours,
    isManual: row.is_manual === 1,
    note: row.note,
  };
}

interface AttendanceContextValue {
  entries: AttendanceEntry[];
  totalHours: number;
  daysLogged: number;
  isLoading: boolean;
  addEntry: (
    entry: Omit<AttendanceEntry, "id">
  ) => Promise<string>;
  updateEntry: (
    id: string,
    updates: Partial<
      Pick<AttendanceEntry, "timeIn" | "timeOut" | "breakMinutes" | "hours" | "note">
    >
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => void;
}

const AttendanceContext = createContext<AttendanceContextValue>({
  entries: [],
  totalHours: 0,
  daysLogged: 0,
  isLoading: true,
  addEntry: async () => "",
  updateEntry: async () => {},
  deleteEntry: async () => {},
  refresh: () => {},
});

export function AttendanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { requestSync } = useSync();
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [daysLogged, setDaysLogged] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    const rows = getAllAttendance(user.id);
    setEntries(rows.map(rowToEntry));
    setTotalHours(getTotalLoggedHours(user.id));
    setDaysLogged(getDaysLogged(user.id));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = useCallback(
    async (entry: Omit<AttendanceEntry, "id">) => {
      if (!user) return "";
      const id = generateId();
      insertAttendance({
        id,
        user_id: user.id,
        date: entry.date,
        time_in: entry.timeIn,
        time_out: entry.timeOut,
        break_minutes: entry.breakMinutes,
        hours: entry.hours,
        is_manual: entry.isManual ? 1 : 0,
        note: entry.note,
      });
      load();
      requestSync();
      return id;
    },
    [user, load, requestSync]
  );

  const updateEntry = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<AttendanceEntry, "timeIn" | "timeOut" | "breakMinutes" | "hours" | "note">
      >
    ) => {
      const mapped: Parameters<typeof updateAttendance>[1] = {};
      if (updates.timeIn !== undefined) mapped.time_in = updates.timeIn;
      if (updates.timeOut !== undefined) mapped.time_out = updates.timeOut;
      if (updates.breakMinutes !== undefined)
        mapped.break_minutes = updates.breakMinutes;
      if (updates.hours !== undefined) mapped.hours = updates.hours;
      if (updates.note !== undefined) mapped.note = updates.note;
      updateAttendance(id, mapped);
      load();
      requestSync();
    },
    [load, requestSync]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      softDeleteAttendance(id);
      load();
      requestSync();
    },
    [load, requestSync]
  );

  return (
    <AttendanceContext.Provider
      value={{
        entries,
        totalHours,
        daysLogged,
        isLoading,
        addEntry,
        updateEntry,
        deleteEntry,
        refresh: load,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export const useAttendance = () => useContext(AttendanceContext);
