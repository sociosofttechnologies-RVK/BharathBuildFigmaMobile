// Vendor operations, all through RLS ("Vendors can view/update/delete own ...", scoped to auth.uid() = vendor_id).
import { supabase } from "@/lib/supabase";

export type VendorListing = { id: string; name: string; category: string; status: "draft" | "active" | "paused"; views: number | null; is_approved: boolean };
export async function getVendorListings(uid: string): Promise<VendorListing[]> {
  const { data, error } = await supabase.from("listings").select("id,name,category,status,views,is_approved").eq("vendor_id", uid).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VendorListing[];
}
export async function setListingStatus(id: string, status: "draft" | "active" | "paused") {
  const { error } = await supabase.from("listings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
export async function deleteVendorListing(id: string) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getVendorStats(uid: string) {
  const [l, le, r, m] = await Promise.all([
    supabase.from("listings").select("id,views,status").eq("vendor_id", uid),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("vendor_id", uid),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("vendor_id", uid),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("vendor_id", uid).eq("sender_type", "user").eq("vendor_read", false),
  ]);
  const listings = l.data ?? [];
  return {
    activeListings: listings.filter((x) => x.status === "active").length,
    totalViews: listings.reduce((s, x) => s + (x.views ?? 0), 0),
    leads: le.count ?? 0, reviews: r.count ?? 0, unread: m.count ?? 0,
  };
}

export type VendorLead = { id: string; name: string; phone: string; requirement: string; status: string; created_at: string };
export async function getVendorLeads(uid: string): Promise<VendorLead[]> {
  const { data, error } = await supabase.from("leads").select("id,name,phone,requirement,status,created_at").eq("vendor_id", uid).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
export async function setLeadStatus(id: string, status: string) {
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export type VendorReview = { id: string; customer_name: string; rating: number; body: string; created_at: string };
export async function getVendorReviews(uid: string): Promise<VendorReview[]> {
  const { data, error } = await supabase.from("reviews").select("id,customer_name,rating,body,created_at").eq("vendor_id", uid).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSubscription(uid: string) {
  const { data, error } = await supabase.from("subscriptions").select("plan,status,started_at,expires_at").eq("vendor_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type MessageRow = { id: string; thread_id: string; listing_id: string; thread_token: string; sender_type: string; user_name: string | null; user_phone: string | null; body: string; created_at: string; vendor_read: boolean };
const MSG_COLS = "id,thread_id,listing_id,thread_token,sender_type,user_name,user_phone,body,created_at,vendor_read";
export async function getVendorMessages(uid: string): Promise<MessageRow[]> {
  const { data, error } = await supabase.from("messages").select(MSG_COLS).eq("vendor_id", uid).order("created_at", { ascending: true }).limit(1000);
  if (error) throw new Error(error.message);
  return data ?? [];
}
export type Thread = { id: string; userName: string; last: MessageRow; unread: number };
export function groupThreads(rows: MessageRow[]): Thread[] {
  const map = new Map<string, MessageRow[]>();
  for (const r of rows) map.set(r.thread_id, [...(map.get(r.thread_id) ?? []), r]);
  return [...map.entries()]
    .map(([id, msgs]) => ({ id, userName: msgs.find((m) => m.user_name)?.user_name ?? "Customer", last: msgs[msgs.length - 1], unread: msgs.filter((m) => m.sender_type === "user" && !m.vendor_read).length }))
    .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
}
export async function markThreadRead(uid: string, threadId: string) {
  await supabase.from("messages").update({ vendor_read: true }).eq("vendor_id", uid).eq("thread_id", threadId).eq("sender_type", "user");
}
// Mirrors the web's vendorReply: copies listing/thread/user fields from the thread's first message.
export async function vendorReply(uid: string, threadId: string, body: string) {
  const text = body.trim();
  if (!text || text.length > 500) throw new Error("Reply must be 1–500 characters.");
  const { data: first, error: e1 } = await supabase.from("messages").select("listing_id,thread_token,user_name,user_phone").eq("thread_id", threadId).eq("vendor_id", uid).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!first) throw new Error("Thread not found");
  const { error } = await supabase.from("messages").insert({ listing_id: first.listing_id, vendor_id: uid, thread_id: threadId, thread_token: first.thread_token, sender_type: "vendor", user_name: first.user_name, user_phone: first.user_phone, body: text });
  if (error) throw new Error(error.message);
}
