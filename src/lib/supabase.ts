import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DEMO, demoFetch } from "@/lib/demo";

// These must be written as literal process.env.EXPO_PUBLIC_* so the bundler can inline them at build time.
const ENV_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ENV_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Never throw at import time: in a release build that closes the app with no message.
// Instead export the problem so the root layout can show it on screen.
export const supabaseConfigError: string | null =
  !DEMO && (!ENV_URL || !ENV_KEY) ? "This build is missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Rebuild with both set." : null;
const SUPABASE_URL = DEMO ? "https://demo.invalid" : ENV_URL || "https://missing-config.invalid";
const SUPABASE_ANON_KEY = ENV_KEY || "missing-config";

// SecureStore caps values at ~2KB on iOS; Supabase sessions can exceed that, so chunk them.
const CHUNK = 1800;
const Storage = {
  async getItem(key: string) {
    if (Platform.OS === "web") return AsyncStorage.getItem(key);
    const n = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!n) return SecureStore.getItemAsync(key);
    let v = "";
    for (let i = 0; i < parseInt(n, 10); i++) v += (await SecureStore.getItemAsync(`${key}_${i}`)) ?? "";
    return v || null;
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
    if (value.length <= CHUNK) {
      await SecureStore.deleteItemAsync(`${key}_chunks`);
      return SecureStore.setItemAsync(key, value);
    }
    const count = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < count; i++) await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${key}_chunks`, String(count));
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") return AsyncStorage.removeItem(key);
    const n = await SecureStore.getItemAsync(`${key}_chunks`);
    await SecureStore.deleteItemAsync(key);
    if (n) {
      for (let i = 0; i < parseInt(n, 10); i++) await SecureStore.deleteItemAsync(`${key}_${i}`);
      await SecureStore.deleteItemAsync(`${key}_chunks`);
    }
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: Storage, autoRefreshToken: !DEMO, persistSession: !DEMO, detectSessionInUrl: false, flowType: "pkce" },
  ...(DEMO ? { global: { fetch: demoFetch } } : {}),
});

// Keep tokens fresh only while the app is in the foreground (recommended for React Native).
import { AppState } from "react-native";
if (Platform.OS !== "web" && !DEMO) {
  AppState.addEventListener("change", (s) => {
    if (s === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
