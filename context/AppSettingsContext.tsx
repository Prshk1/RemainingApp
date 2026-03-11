import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@remaining_app_settings";

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface AppSettings {
  /** Total required internship hours */
  requiredHours: number;
  /** Maximum hours that can be logged in a single day */
  maxHoursPerDay: number;
  /** Days counted toward completion-date estimation */
  workDays: string[];
  /** Automatically subtract 12:00–13:00 as lunch break */
  lunchBreakEnabled: boolean;
  /** Display format for all time strings in the app */
  timeFormat: "12h" | "24h";
  /** Per-list delete confirmation preferences */
  confirmAttendanceDelete: boolean;
  confirmBonusDelete: boolean;
  /** Invert swipe direction: when true, swipe left = Edit, swipe right = Delete */
  invertSwipeDirection: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  requiredHours: 400,
  maxHoursPerDay: 8,
  workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  lunchBreakEnabled: true,
  timeFormat: "12h",
  confirmAttendanceDelete: true,
  confirmBonusDelete: true,
  invertSwipeDirection: false,
};

interface AppSettingsContextValue {
  settings: AppSettings;
  isLoaded: boolean;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  updateSettings: async () => {},
});

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<AppSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...saved });
        } catch {
          // corrupted storage — fall back to defaults
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  return (
    <AppSettingsContext.Provider value={{ settings, isLoaded, updateSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
