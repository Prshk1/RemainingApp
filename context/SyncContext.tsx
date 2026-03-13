import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./AuthContext";
import { getPendingSyncCount, runSync } from "../services/sync/engine";

interface SyncContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  syncNow: () => Promise<void>;
  requestSync: () => void;
}

const SyncContext = createContext<SyncContextValue>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  lastError: null,
  syncNow: async () => {},
  requestSync: () => {},
});

const BASE_RETRY_MS = 3000;
const MAX_RETRY_MS = 60000;
const PERIODIC_SYNC_MS = 90000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const isRunningRef = useRef(false);
  const retryDelayRef = useRef(BASE_RETRY_MS);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const periodicRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerSyncRef = useRef<
    ((reason: "manual" | "foreground" | "reconnect" | "periodic" | "retry") => Promise<void>) | null
  >(null);

  const refreshPending = useCallback(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    setPendingCount(getPendingSyncCount(user.id));
  }, [user]);

  const clearRetryTimer = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback(() => {
    if (!user || !isOnline || retryTimeoutRef.current) return;

    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null;
      if (triggerSyncRef.current) {
        void triggerSyncRef.current("retry");
      }
    }, retryDelayRef.current);

    retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_MS);
  }, [isOnline, user]);

  const triggerSync = useCallback(
    async (_reason: "manual" | "foreground" | "reconnect" | "periodic" | "retry") => {
      if (!user || !isOnline || isRunningRef.current) return;

      isRunningRef.current = true;
      setIsSyncing(true);
      try {
        const result = await runSync(user.id);
        refreshPending();

        if (result.failed > 0) {
          setLastError(
            result.failureSummary ?? `${result.failed} item(s) pending sync`
          );
          scheduleRetry();
        } else {
          clearRetryTimer();
          retryDelayRef.current = BASE_RETRY_MS;
          setLastError(null);
          setLastSyncAt(new Date().toISOString());
        }
      } catch (err: unknown) {
        setLastError(err instanceof Error ? err.message : "Sync failed");
        scheduleRetry();
      } finally {
        isRunningRef.current = false;
        setIsSyncing(false);
      }
    },
    [clearRetryTimer, isOnline, refreshPending, scheduleRetry, user]
  );

  const syncNow = useCallback(async () => {
    await triggerSync("manual");
  }, [triggerSync]);

  const requestSync = useCallback(() => {
    void triggerSync("manual");
  }, [triggerSync]);

  useEffect(() => {
    triggerSyncRef.current = triggerSync;
  }, [triggerSync]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        refreshPending();
        void triggerSync("foreground");
      }
    };

    const appStateSub = AppState.addEventListener("change", onAppStateChange);
    return () => appStateSub.remove();
  }, [refreshPending, triggerSync]);

  useEffect(() => {
    const netUnsub = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) {
        refreshPending();
        void triggerSync("reconnect");
      }
    });

    void NetInfo.fetch().then((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) {
        void triggerSync("manual");
      }
    });

    return () => netUnsub();
  }, [refreshPending, triggerSync]);

  useEffect(() => {
    if (periodicRef.current) {
      clearInterval(periodicRef.current);
      periodicRef.current = null;
    }

    if (!user) return;

    periodicRef.current = setInterval(() => {
      void triggerSync("periodic");
    }, PERIODIC_SYNC_MS);

    return () => {
      if (periodicRef.current) {
        clearInterval(periodicRef.current);
        periodicRef.current = null;
      }
    };
  }, [triggerSync, user]);

  useEffect(() => {
    return () => {
      clearRetryTimer();
      if (periodicRef.current) {
        clearInterval(periodicRef.current);
      }
    };
  }, [clearRetryTimer]);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncAt,
        lastError,
        syncNow,
        requestSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
