import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { generateId } from "../utils/generateId";

// ── Offline-first mode ────────────────────────────────────────────────────────
// Supabase auth is intentionally disabled. Change OFFLINE_FIRST to false and
// restore the Supabase implementation when you are ready to enable cloud sync.
const OFFLINE_FIRST = true; // eslint-disable-line @typescript-eslint/no-unused-vars

// ── Local types ───────────────────────────────────────────────────────────────
export interface LocalUser {
  id: string;
  email: string;
  fullName: string;
}

export interface LocalSession {
  userId: string;
}

interface AuthContextValue {
  session: LocalSession | null;
  user: LocalUser | null;
  isLoading: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

// ── SecureStore keys ──────────────────────────────────────────────────────────
const USERS_KEY = "offline_users_v1";    // JSON: Record<email, {id, fullName, password}>
const SESSION_KEY = "offline_session_v1"; // JSON: {userId, email, fullName}

type UserRecord = { id: string; fullName: string; password: string };
type UserMap = Record<string, UserRecord>;

async function loadUsers(): Promise<UserMap> {
  try {
    const raw = await SecureStore.getItemAsync(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveUsers(users: UserMap): Promise<void> {
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
}

async function loadSession(): Promise<{ userId: string; email: string; fullName: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveSession(data: { userId: string; email: string; fullName: string }): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(data));
}

async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted local session on mount
  useEffect(() => {
    loadSession().then((s) => {
      if (s) {
        setSession({ userId: s.userId });
        setUser({ id: s.userId, email: s.email, fullName: s.fullName });
      }
      setIsLoading(false);
    });
  }, []);

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await loadUsers();

    if (users[normalizedEmail]) {
      return { error: "An account with this email already exists on this device." };
    }

    const id = generateId();
    users[normalizedEmail] = { id, fullName: fullName.trim(), password };
    await saveUsers(users);
    await saveSession({ userId: id, email: normalizedEmail, fullName: fullName.trim() });

    setSession({ userId: id });
    setUser({ id, email: normalizedEmail, fullName: fullName.trim() });
    return { error: null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await loadUsers();
    const record = users[normalizedEmail];

    if (!record) {
      return { error: "No account found with this email." };
    }
    if (record.password !== password) {
      return { error: "Incorrect password." };
    }

    await saveSession({ userId: record.id, email: normalizedEmail, fullName: record.fullName });
    setSession({ userId: record.id });
    setUser({ id: record.id, email: normalizedEmail, fullName: record.fullName });
    return { error: null };
  };

  const signOut = async () => {
    // Clears the local session only — all app data (attendance, bonus, timer)
    // remains on device so it is available when the user signs back in.
    await clearSession();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, isLoading, signInWithEmail, signUpWithEmail, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
