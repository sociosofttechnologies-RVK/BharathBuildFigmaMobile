// Ported from the web app's listings.functions.ts. The web runs this server-side with the
// service-role key; here it runs on-device with the anon key, which returns the same rows because
// of the public RLS policy "Active approved listings are public" (status='active' AND is_approved).
import { supabase } from "@/lib/supabase";
import { CATEGORY_LABEL } from "@/lib/categories";

const COLS = "id,vendor_id,name,category,subcategory,attributes,images,city,location,description,services,views,contact_phone,contact_email,rating,review_count,is_verified,is_featured,is_premium";

export type Listing = {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  categoryLabel: string;
  location: string;
  city: string;
  rating: number;
  reviews: number;
  experience: number;
  verified: boolean;
  topRated: boolean;
  featured: boolean;
  premium: boolean;
  phone: string;
  contactPhone: string | null;
  contactEmail: string | null;
  description: string;
  tags: string[];
  subcategory: string | null;
  attributes: Record<string, string>;
  images: string[];
};

// Deterministic pseudo-random from id, so rating/reviews are stable per listing
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

type DbListing = {
  id: string;
  vendor_id: string;
  name: string;
  category: string;
  city: string;
  location: string;
  description: string | null;
  services: string[] | null;
  views: number | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_phone2?: string | null;
  subcategory?: string | null;
  images?: string[] | null;
  attributes?: unknown;
  rating?: number | null;
  review_count?: number | null;
  is_verified?: boolean | null;
  is_featured?: boolean | null;
  is_premium?: boolean | null;
};

function toListing(row: DbListing): Listing {
  const h = hash(row.id);
  const rating = row.rating ? Number(row.rating) : Number((3.8 + ((h % 13) / 10)).toFixed(1));
  const reviews = row.review_count ?? 25 + (h % 280);
  const experience = 4 + ((h >> 3) % 22);
  const verified = row.is_verified ?? (h % 4) !== 0;
  const topRated = rating >= 4.6;
  const phone = `+91 ${String(90000 + (h % 9999)).slice(0, 5)} ${String(10000 + ((h >> 5) % 89999)).slice(0, 5)}`;
  return {
    id: row.id,
    vendorId: row.vendor_id,
    name: row.name,
    category: row.category,
    categoryLabel: CATEGORY_LABEL[row.category] ?? row.category,
    location: `${row.location}, ${row.city}`,
    city: row.city,
    rating,
    reviews,
    experience,
    verified,
    topRated,
    featured: row.is_featured ?? false,
    premium: row.is_premium ?? false,
    phone,
    contactPhone: row.contact_phone ?? null,
    contactEmail: row.contact_email ?? null,
    description:
      row.description ||
      `Trusted ${CATEGORY_LABEL[row.category]?.toLowerCase() ?? row.category} serving ${row.city} and nearby regions.`,
    tags: row.services ?? [],
    subcategory: row.subcategory ?? null,
    images: (row.images ?? []).filter((u) => typeof u === "string" && u.trim() !== ""),
    attributes: Object.fromEntries(
      Object.entries(
        (row.attributes && typeof row.attributes === "object" && !Array.isArray(row.attributes)
          ? (row.attributes as Record<string, unknown>)
          : {}),
      )
        .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
        .map(([k, v]) => [k, String(v)]),
    ),
  };
}


export async function searchListings(p: { category?: string; subcategory?: string; location?: string; keyword?: string }): Promise<Listing[]> {
  const cat = (p.category ?? "").toLowerCase();
  const sub = (p.subcategory ?? "").toLowerCase();
  const loc = (p.location ?? "").trim();
  const kw = (p.keyword ?? "").trim();
  let q = supabase.from("listings").select(COLS).eq("status", "active").eq("is_approved", true);
  if (cat) q = q.eq("category", cat);
  if (sub) q = q.eq("subcategory", sub);
  if (loc) q = q.or(`city.ilike.%${loc}%,location.ilike.%${loc}%`);
  const { data: rows, error } = await q.order("views", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  let result = (rows ?? []) as unknown as DbListing[];
  if (kw) {
    const terms = kw.toLowerCase().split(/\s+/).filter(Boolean);
    const score = (r: DbListing) => {
      const hs = [r.name ?? "", CATEGORY_LABEL[r.category] ?? r.category ?? "", r.category ?? "", r.subcategory ?? "", r.description ?? "", (r.services ?? []).join(" ")].map((s) => s.toLowerCase());
      let s = 0;
      for (const t of terms) { const i = hs.findIndex((h) => h.includes(t)); if (i === -1) return -1; s += 10 - i; }
      return s;
    };
    result = result.map((r) => ({ r, s: score(r) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).map((x) => x.r);
  }
  return result.slice(0, 200).map(toListing);
}

export async function getListing(id: string): Promise<{ listing: Listing; similar: Listing[] }> {
  const { data: row, error } = await supabase.from("listings").select(COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Listing not found");
  const listing = toListing(row as unknown as DbListing);
  const { data: sim } = await supabase.from("listings").select(COLS).eq("status", "active").eq("is_approved", true).neq("id", listing.id).or(`category.eq.${listing.category},city.eq.${listing.city}`).limit(4);
  return { listing, similar: (sim ?? []).map((r) => toListing(r as unknown as DbListing)) };
}
