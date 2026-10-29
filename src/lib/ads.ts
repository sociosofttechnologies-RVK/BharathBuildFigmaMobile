// Vendor ad (listing) create / edit, through RLS (vendor_id = auth.uid()).
import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

// Storage bucket the web app uploads listing photos to. Check src/components/vendor/ListingImagesField.tsx
// in the web repo and change this if it differs.
export const LISTING_IMAGES_BUCKET = "listing-images";
export const MAX_PHOTOS = 8;

export type AdDraft = {
  name: string; category: string; subcategory: string; city: string; location: string;
  phone1: string; phone2: string; services: string; description: string;
  attributes: Record<string, string>; images: string[];
};
export const emptyDraft = (): AdDraft => ({ name: "", category: "", subcategory: "", city: "", location: "", phone1: "", phone2: "", services: "", description: "", attributes: {}, images: [] });

export function validateAd(d: AdDraft) {
  const e: Partial<Record<keyof AdDraft, string>> = {};
  if (!d.category) e.category = "Pick a category";
  if (!d.subcategory) e.subcategory = "Pick a sub-category";
  if (d.name.trim().length < 3) e.name = "Enter a name for the ad";
  if (!d.city.trim()) e.city = "Enter a city";
  if (!d.location.trim()) e.location = "Enter the address";
  if (!/^\d{10}$/.test(d.phone1.replace(/\D/g, "").slice(-10)) || d.phone1.replace(/\D/g, "").length < 10) e.phone1 = "10-digit mobile number";
  if (d.phone2 && d.phone2.replace(/\D/g, "").length < 10) e.phone2 = "10-digit mobile number";
  return e;
}

function toRow(d: AdDraft) {
  const attrs = Object.fromEntries(Object.entries(d.attributes).filter(([, v]) => String(v).trim() !== ""));
  return {
    name: d.name.trim(), category: d.category, subcategory: d.subcategory || null, city: d.city.trim(), location: d.location.trim(),
    contact_phone: d.phone1.trim() || null, contact_phone2: d.phone2.trim() || null,
    services: d.services.split(",").map((x) => x.trim()).filter(Boolean), description: d.description.trim(),
    attributes: attrs as Json, images: d.images,
  };
}

export async function saveAd(uid: string, d: AdDraft, opts: { id?: string; status: "draft" | "active" }) {
  const row = { ...toRow(d), status: opts.status };
  if (opts.id) {
    const { error } = await supabase.from("listings").update(row).eq("id", opts.id).eq("vendor_id", uid);
    if (error) throw new Error(error.message);
    return opts.id;
  }
  const { data, error } = await supabase.from("listings").insert({ ...row, vendor_id: uid }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function loadAd(id: string): Promise<AdDraft & { status: string; is_approved: boolean }> {
  const { data, error } = await supabase.from("listings").select("name,category,subcategory,city,location,contact_phone,contact_phone2,services,description,attributes,images,status,is_approved").eq("id", id).single();
  if (error) throw new Error(error.message);
  const attrs = data.attributes && typeof data.attributes === "object" && !Array.isArray(data.attributes) ? (data.attributes as Record<string, unknown>) : {};
  return {
    name: data.name, category: data.category, subcategory: data.subcategory ?? "", city: data.city === "—" ? "" : data.city, location: data.location === "—" ? "" : data.location,
    phone1: data.contact_phone ?? "", phone2: data.contact_phone2 ?? "", services: (data.services ?? []).join(", "),
    description: data.description ?? "", images: data.images ?? [],
    attributes: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, String(v ?? "")])),
    status: data.status, is_approved: data.is_approved,
  };
}

/** Uploads a picked photo (local file URI) and returns its public URL. */
export async function uploadAdPhoto(uid: string, uri: string, mime = "image/jpeg") {
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).upload(path, buf, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export type VendorAd = { id: string; name: string; category: string; subcategory: string | null; status: "draft" | "active" | "paused"; views: number | null; is_approved: boolean; images: string[] | null };
export async function getVendorAds(uid: string): Promise<VendorAd[]> {
  const { data, error } = await supabase.from("listings").select("id,name,category,subcategory,status,views,is_approved,images").eq("vendor_id", uid).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VendorAd[];
}
