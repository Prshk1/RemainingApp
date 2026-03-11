import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

/**
 * ⚠️  SETUP REQUIRED
 * Replace the placeholder values below with your Supabase project credentials.
 * You can find them in https://app.supabase.com → Project Settings → API.
 */
const SUPABASE_URL = "https://mahtrgihjcvrnrwmjihj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haHRyZ2loamN2cm5yd21qaWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ2MDIsImV4cCI6MjA4ODgwMDYwMn0.UVAeKvWWM7l5T0eA7Vs1ASLpRqnDCDnJ-DERaKUN0UA";

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
