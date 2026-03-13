import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  BonusRow,
  getAllBonus,
  getTotalBonusHours,
  insertBonus,
  softDeleteBonus,
  updateBonus,
} from "../services/database/repositories/bonus";
import { generateId } from "../utils/generateId";
import { useSync } from "./SyncContext";

export interface BonusEntry {
  id: string;
  title: string;
  date: string;
  hours: number;
  status: "Pending" | "Approved";
  note: string | null;
}

function rowToEntry(row: BonusRow): BonusEntry {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    hours: row.hours,
    status: row.status,
    note: row.note,
  };
}

interface BonusContextValue {
  entries: BonusEntry[];
  totalApprovedHours: number;
  isLoading: boolean;
  addBonus: (entry: Omit<BonusEntry, "id">) => Promise<string>;
  updateBonus: (
    id: string,
    updates: Partial<Omit<BonusEntry, "id">>
  ) => Promise<void>;
  deleteBonus: (id: string) => Promise<void>;
  refresh: () => void;
}

const BonusContext = createContext<BonusContextValue>({
  entries: [],
  totalApprovedHours: 0,
  isLoading: true,
  addBonus: async () => "",
  updateBonus: async () => {},
  deleteBonus: async () => {},
  refresh: () => {},
});

export function BonusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { requestSync } = useSync();
  const [entries, setEntries] = useState<BonusEntry[]>([]);
  const [totalApprovedHours, setTotalApprovedHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    const rows = getAllBonus(user.id);
    setEntries(rows.map(rowToEntry));
    setTotalApprovedHours(getTotalBonusHours(user.id));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addBonus = useCallback(
    async (entry: Omit<BonusEntry, "id">) => {
      if (!user) return "";
      const id = generateId();
      insertBonus({
        id,
        user_id: user.id,
        title: entry.title,
        date: entry.date,
        hours: entry.hours,
        status: entry.status,
        note: entry.note,
      });
      load();
      requestSync();
      return id;
    },
    [user, load, requestSync]
  );

  const updateBonusEntry = useCallback(
    async (id: string, updates: Partial<Omit<BonusEntry, "id">>) => {
      updateBonus(id, updates);
      load();
      requestSync();
    },
    [load, requestSync]
  );

  const deleteBonus = useCallback(
    async (id: string) => {
      softDeleteBonus(id);
      load();
      requestSync();
    },
    [load, requestSync]
  );

  return (
    <BonusContext.Provider
      value={{
        entries,
        totalApprovedHours,
        isLoading,
        addBonus,
        updateBonus: updateBonusEntry,
        deleteBonus,
        refresh: load,
      }}
    >
      {children}
    </BonusContext.Provider>
  );
}

export const useBonus = () => useContext(BonusContext);
