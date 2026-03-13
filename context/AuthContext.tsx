import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../services/supabase/client";

const CACHED_USER_KEY = "cached_auth_user_v1";

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

type CachedUser = {
  userId: string;
  email: string;
  fullName: string;
};

function toLocalUser(input: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): LocalUser {
  const fullNameFromMeta =
    typeof input.user_metadata?.full_name === "string"
      ? input.user_metadata.full_name
      : typeof input.user_metadata?.fullName === "string"
      ? input.user_metadata.fullName
      : null;

  const safeEmail = input.email ?? "";

  return {
    id: input.id,
    email: safeEmail,
    fullName: fullNameFromMeta ?? safeEmail,
  };
}

async function loadCachedUser(): Promise<CachedUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveCachedUser(user: LocalUser): Promise<void> {
  const cached: CachedUser = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  };
  await SecureStore.setItemAsync(CACHED_USER_KEY, JSON.stringify(cached));
}

async function clearCachedUser(): Promise<void> {
  await SecureStore.deleteItemAsync(CACHED_USER_KEY);
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

  // Restore Supabase session (or cached user when offline) on mount.
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user;
        if (authUser) {
          const mapped = toLocalUser(authUser);
          if (!isMounted) return;
          setSession({ userId: mapped.id });
          setUser(mapped);
          await saveCachedUser(mapped);
          return;
        }

        const cached = await loadCachedUser();
        if (cached && isMounted) {
          setSession({ userId: cached.userId });
          setUser({ id: cached.userId, email: cached.email, fullName: cached.fullName });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const authUser = nextSession?.user;
      if (authUser) {
        const mapped = toLocalUser(authUser);
        setSession({ userId: mapped.id });
        setUser(mapped);
        void saveCachedUser(mapped);
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const name = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.session) {
      return { error: "Sign up succeeded. Please verify your email before signing in." };
    }

    return { error: null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await clearCachedUser();
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
