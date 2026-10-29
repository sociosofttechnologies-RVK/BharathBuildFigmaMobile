// Customer → vendor messaging. Mirrors the web's messages table contract:
// a thread is (thread_id, thread_token); customer rows use sender_type "user".
import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/listings";
import { getThreadForListing, saveThread, type LocalMsg, type LocalThread } from "@/lib/local";

export const MAX_MESSAGE = 500;

export async function getOrCreateThread(listing: Listing, user: { name: string; phone: string }): Promise<LocalThread> {
  const existing = await getThreadForListing(listing.id);
  if (existing) return existing;
  const t: LocalThread = {
    threadId: Crypto.randomUUID(),
    token: Crypto.randomUUID().replace(/-/g, ""),
    listingId: listing.id, vendorId: listing.vendorId, vendorName: listing.name,
    categoryLabel: listing.categoryLabel, image: listing.images[0], verified: listing.verified, phone: listing.contactPhone,
    userName: user.name, userPhone: user.phone, messages: [], updatedAt: new Date().toISOString(),
  };
  return t;
}

export async function sendCustomerMessage(t: LocalThread, body: string): Promise<LocalThread> {
  const text = body.trim();
  if (!text || text.length > MAX_MESSAGE) throw new Error(`Message must be 1–${MAX_MESSAGE} characters.`);
  const { data, error } = await supabase
    .from("messages")
    .insert({
      listing_id: t.listingId, vendor_id: t.vendorId, thread_id: t.threadId, thread_token: t.token,
      sender_type: "user", user_name: t.userName || null, user_phone: t.userPhone || null, body: text,
    })
    .select("id,created_at")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const msg: LocalMsg = { id: data?.id ?? Crypto.randomUUID(), body: text, created_at: data?.created_at ?? new Date().toISOString(), sender_type: "user" };
  const next = { ...t, messages: [...t.messages, msg], updatedAt: msg.created_at };
  await saveThread(next);
  return next;
}

/** Pulls vendor replies. If row-level security hides the thread from this user, the local copy is returned. */
export async function refreshThread(t: LocalThread): Promise<LocalThread> {
  const { data, error } = await supabase
    .from("messages")
    .select("id,body,created_at,sender_type")
    .eq("thread_id", t.threadId)
    .eq("thread_token", t.token)
    .order("created_at", { ascending: true });
  if (error || !data || data.length === 0) return t;
  const next: LocalThread = {
    ...t,
    messages: data.map((m) => ({ id: m.id, body: m.body, created_at: m.created_at, sender_type: m.sender_type === "vendor" ? "vendor" : "user" })),
    updatedAt: data[data.length - 1].created_at,
  };
  await saveThread(next);
  return next;
}

export async function submitLead(p: { listingId: string; vendorId: string; name: string; phone: string; requirement: string }) {
  const name = p.name.trim(), phone = p.phone.replace(/\s+/g, ""), requirement = p.requirement.trim();
  if (!name) throw new Error("Please enter your name.");
  if (!/^\+?\d{10,13}$/.test(phone)) throw new Error("Enter a valid phone number.");
  if (requirement.length < 5) throw new Error("Describe your project in a few words.");
  const { error } = await supabase.from("leads").insert({ listing_id: p.listingId, vendor_id: p.vendorId, name, phone, requirement });
  if (error) throw new Error(error.message);
}

export type PublicReview = { id: string; customer_name: string; rating: number; body: string; created_at: string };
export async function getListingReviews(listingId: string): Promise<PublicReview[]> {
  const { data, error } = await supabase.from("reviews").select("id,customer_name,rating,body,created_at").eq("listing_id", listingId).order("created_at", { ascending: false }).limit(20);
  if (error) return [];
  return data ?? [];
}

export async function submitReview(p: { listingId: string; vendorId: string; name: string; rating: number; body: string }) {
  const { error } = await supabase.from("reviews").insert({ listing_id: p.listingId, vendor_id: p.vendorId, customer_name: p.name.trim(), rating: p.rating, body: p.body.trim() });
  if (error) throw new Error(error.message);
}
