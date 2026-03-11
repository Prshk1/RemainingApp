import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useAttendance } from "./AttendanceContext";
import {
  getActiveTimer,
  insertTimerSession,
  updateTimerSession,
} from "../services/database/repositories/timer";
import {
  insertAttendance,
  getAttendanceByDate,
  updateAttendance,
} from "../services/database/repositories/attendance";
import { generateId } from "../utils/generateId";

export type TimerState = "idle" | "running" | "break" | "completed";

export interface AttendanceConfirmation {
  existingId: string;
  dateStr: string;
  payload: {
    time_in: string;
    time_out: string;
    break_minutes: number;
    hours: number;
  };
}

interface TimerContextValue {
  timerState: TimerState;
  sessionId: string | null;
  startTime: Date | null;
  elapsedSeconds: number;
  breakMinutes: number;
  /** HH/MM/SS parts for display */
  displayHours: number;
  displayMins: number;
  displaySecs: number;
  timeIn: () => void;
  timeOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  /** Pending attendance confirmation (for duplicate entry) */
  pendingConfirmation: AttendanceConfirmation | null;
  /** Confirm and update existing attendance */
  confirmAttendanceUpdate: (confirmation: AttendanceConfirmation) => void;
  /** Cancel pending confirmation */
  cancelAttendanceConfirmation: () => void;
}

const TimerContext = createContext<TimerContextValue>({
  timerState: "idle",
  sessionId: null,
  startTime: null,
  elapsedSeconds: 0,
  breakMinutes: 0,
  displayHours: 0,
  displayMins: 0,
  displaySecs: 0,
  timeIn: () => {},
  timeOut: () => {},
  startBreak: () => {},
  endBreak: () => {},
  pendingConfirmation: null,
  confirmAttendanceUpdate: () => {},
  cancelAttendanceConfirmation: () => {},
});

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { refresh: refreshAttendance } = useAttendance();
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<AttendanceConfirmation | null>(null);
  const breakStartRef = useRef<Date | null>(null);
  const lunchAutoBreakApplied = useRef(false);

  // Restore active session on mount
  useEffect(() => {
    if (!user) return;
    const active = getActiveTimer(user.id);
    if (active) {
      const start = new Date(active.start_time);
      setSessionId(active.id);
      setStartTime(start);
      setBreakMinutes(active.break_minutes);
      setTimerState("running");
      const elapsed =
        Math.floor((Date.now() - start.getTime()) / 1000) -
        active.break_minutes * 60;
      setElapsedSeconds(Math.max(0, elapsed));
    }
  }, [user]);

  // Tick every second when running
  useEffect(() => {
    if (timerState !== "running") return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);

      // Automatic lunch break detection (12:00 PM – 1:00 PM)
      if (!lunchAutoBreakApplied.current) {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        if (h === 12 && m === 0) {
          startBreakInternal();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState]);

  // Auto end break at 1:00 PM
  useEffect(() => {
    if (timerState !== "break") return;
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 13 && now.getMinutes() === 0) {
        endBreakInternal();
        lunchAutoBreakApplied.current = true;
      }
    }, 10000); // check every 10 seconds to save battery
    return () => clearInterval(interval);
  }, [timerState]);

  const startBreakInternal = useCallback(() => {
    breakStartRef.current = new Date();
    setTimerState("break");
  }, []);

  const endBreakInternal = useCallback(() => {
    if (breakStartRef.current) {
      const mins = Math.floor(
        (Date.now() - breakStartRef.current.getTime()) / 60000
      );
      setBreakMinutes((prev) => {
        const next = prev + mins;
        if (sessionId) {
          updateTimerSession(sessionId, { break_minutes: next });
        }
        return next;
      });
      breakStartRef.current = null;
    }
    setTimerState("running");
  }, [sessionId]);

  const timeIn = useCallback(() => {
    if (!user || timerState !== "idle") return;
    const id = generateId();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    insertTimerSession({
      id,
      user_id: user.id,
      date: dateStr,
      start_time: now.toISOString(),
      end_time: null,
      break_minutes: 0,
      is_active: 1,
    });
    setSessionId(id);
    setStartTime(now);
    setElapsedSeconds(0);
    setBreakMinutes(0);
    lunchAutoBreakApplied.current = false;
    setTimerState("running");
  }, [user, timerState]);

  const timeOut = useCallback(() => {
    if (!user || !sessionId || timerState === "idle") return;
    const now = new Date();
    const endTimeStr = now.toISOString();

    // Calculate net hours
    const totalBreak =
      timerState === "break" && breakStartRef.current
        ? breakMinutes +
          Math.floor((Date.now() - breakStartRef.current.getTime()) / 60000)
        : breakMinutes;

    const netSeconds = elapsedSeconds - (totalBreak - breakMinutes) * 60;
    const netHours = Math.max(0, netSeconds / 3600);

    updateTimerSession(sessionId, {
      end_time: endTimeStr,
      break_minutes: totalBreak,
      is_active: 0,
    });

    // Capture before state reset so Alert callbacks can still reference them
    const capturedStart = startTime;

    // Reset timer state immediately so UI reflects idle
    setTimerState("idle");
    setSessionId(null);
    setStartTime(null);
    setElapsedSeconds(0);
    setBreakMinutes(0);
    breakStartRef.current = null;

    // Create or update attendance entry
    if (capturedStart) {
      const dateStr = capturedStart.toISOString().split("T")[0];
      const attendancePayload = {
        time_in: capturedStart.toISOString(),
        time_out: endTimeStr,
        break_minutes: totalBreak,
        hours: parseFloat(netHours.toFixed(2)),
      };
      const existing = getAttendanceByDate(user.id, dateStr);
      if (existing) {
        // Set pending confirmation instead of showing Alert
        setPendingConfirmation({
          existingId: existing.id,
          dateStr,
          payload: attendancePayload,
        });
      } else {
        insertAttendance({
          id: generateId(),
          user_id: user.id,
          date: dateStr,
          ...attendancePayload,
          is_manual: 0,
          note: null,
        });
        refreshAttendance();
      }
    }
  }, [user, sessionId, timerState, elapsedSeconds, breakMinutes, startTime, refreshAttendance]);

  const startBreak = useCallback(() => {
    if (timerState !== "running") return;
    startBreakInternal();
  }, [timerState, startBreakInternal]);

  const endBreak = useCallback(() => {
    if (timerState !== "break") return;
    endBreakInternal();
  }, [timerState, endBreakInternal]);

  const confirmAttendanceUpdate = useCallback(
    (confirmation: AttendanceConfirmation) => {
      updateAttendance(confirmation.existingId, confirmation.payload);
      refreshAttendance();
      setPendingConfirmation(null);
    },
    [refreshAttendance]
  );

  const cancelAttendanceConfirmation = useCallback(() => {
    setPendingConfirmation(null);
  }, []);

  const totalSecs = elapsedSeconds;
  const displayHours = Math.floor(totalSecs / 3600);
  const displayMins = Math.floor((totalSecs % 3600) / 60);
  const displaySecs = totalSecs % 60;

  return (
    <TimerContext.Provider
      value={{
        timerState,
        sessionId,
        startTime,
        elapsedSeconds,
        breakMinutes,
        displayHours,
        displayMins,
        displaySecs,
        timeIn,
        timeOut,
        startBreak,
        endBreak,
        pendingConfirmation,
        confirmAttendanceUpdate,
        cancelAttendanceConfirmation,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
