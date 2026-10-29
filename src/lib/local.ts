// Small on-device stores (saved vendors, customer enquiry threads, recent location).
import AsyncStorage from "@react-native-async-storage/async-storage";

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
async function write<T>(key: string, value: T) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
}

/* Saved vendors */
export type SavedVendor = { id: string; name: string; categoryLabel: string; city: string; rating: number };
const SAVED = "bb_saved_vendors";
export const getSaved = () => read<SavedVendor[]>(SAVED, []);
export async function toggleSaved(v: SavedVendor): Promise<boolean> {
  const list = await getSaved();
  const exists = list.some((x) => x.id === v.id);
  await write(SAVED, exists ? list.filter((x) => x.id !== v.id) : [v, ...list]);
  return !exists;
}

/* Customer-side enquiry threads (the web app identifies a customer thread by thread_id + thread_token). */
export type LocalMsg = { id: string; body: string; created_at: string; sender_type: "user" | "vendor" };
export type LocalThread = {
  threadId: string; token: string; listingId: string; vendorId: string;
  vendorName: string; categoryLabel: string; image?: string; verified: boolean; phone?: string | null;
  userName: string; userPhone: string; messages: LocalMsg[]; updatedAt: string;
};
const THREADS = "bb_threads";
export const getThreads = () => read<LocalThread[]>(THREADS, []);
export async function getThreadForListing(listingId: string) {
  return (await getThreads()).find((t) => t.listingId === listingId) ?? null;
}
export async function saveThread(t: LocalThread) {
  const list = (await getThreads()).filter((x) => x.threadId !== t.threadId);
  await write(THREADS, [t, ...list]);
}

/* Last used search location */
const LOC = "bb_location";
export const getLastLocation = () => read<string>(LOC, "");
export const setLastLocation = (v: string) => write(LOC, v);
