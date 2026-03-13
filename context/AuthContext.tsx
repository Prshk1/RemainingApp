import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../services/supabase/client";

const CACHED_USER_KEY = "cached_auth_user_v1";
const PASSWORD_RESET_REDIRECT = "https://remaining-auth.netlify.app/";

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
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updateFullName: (fullName: string) => Promise<{ error: string | null }>;
  updateEmail: (
    email: string
  ) => Promise<{ error: string | null; pendingConfirmation: boolean }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
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
  requestPasswordReset: async () => ({ error: null }),
  updateFullName: async () => ({ error: null }),
  updateEmail: async () => ({ error: null, pendingConfirmation: false }),
  updatePassword: async () => ({ error: null }),
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

    const { error } = await supabase.auth.signUp({
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

  const requestPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: PASSWORD_RESET_REDIRECT,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  const updateFullName = async (fullName: string) => {
    if (!user) {
      return { error: "No user session found." };
    }

    const name = fullName.trim();
    if (!name) {
      return { error: "Name cannot be empty." };
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
      },
    });

    if (error) {
      return { error: error.message };
    }

    const nextUser = data.user ? toLocalUser(data.user) : { ...user, fullName: name };
    setUser(nextUser);
    await saveCachedUser(nextUser);

    return { error: null };
  };

  const updateEmail = async (email: string) => {
    if (!user) {
      return { error: "No user session found.", pendingConfirmation: false };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: "Email cannot be empty.", pendingConfirmation: false };
    }

    const { data, error } = await supabase.auth.updateUser({
      email: normalizedEmail,
    });

    if (error) {
      return { error: error.message, pendingConfirmation: false };
    }

    const updated = data.user;
    const nextUser = updated ? toLocalUser(updated) : user;
    const pendingConfirmation =
      !!updated &&
      (updated.email !== normalizedEmail ||
        ((updated as unknown as { new_email?: string }).new_email ?? "") === normalizedEmail);

    setUser(nextUser);
    await saveCachedUser(nextUser);

    return { error: null, pendingConfirmation };
  };

  const updatePassword = async (password: string) => {
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const { error } = await supabase.auth.updateUser({
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
      value={{
        session,
        user,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        requestPasswordReset,
        updateFullName,
        updateEmail,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
