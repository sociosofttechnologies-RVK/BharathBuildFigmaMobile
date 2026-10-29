// Offline demo mode — ONLY active when the build sets EXPO_PUBLIC_DEMO=1 (used for design reviews and
// screenshots without a backend). Never enabled in .env / eas.json. It answers Supabase REST calls from
// the fixtures below; filters other than `col=eq.value` are ignored.
export const DEMO = process.env.EXPO_PUBLIC_DEMO === "1";
export const DEMO_ROLE = (process.env.EXPO_PUBLIC_DEMO_ROLE ?? "vendor") as "vendor" | "customer";
export const DEMO_UID = "00000000-0000-4000-8000-000000000001";

const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const L = (id: string, name: string, category: string, sub: string, city: string, location: string, rating: number, reviews: number, verified: boolean, services: string[], extra: Record<string, unknown> = {}) => ({
  id, vendor_id: DEMO_UID, name, category, subcategory: sub, city, location, rating, review_count: reviews, is_verified: verified, is_featured: false, is_premium: false,
  description: "Turnkey residential and commercial construction across Chennai — from foundation and RCC framing to finishing and handover, with in-house engineers on every site.",
  services, views: 100, contact_phone: "+91 98400 12321", contact_email: "info@example.in", images: [], attributes: { experience: "12" }, status: "active", is_approved: true, created_at: ago(500), deleted_at: null, ...extra,
});

const TABLES: Record<string, Record<string, unknown>[]> = {
  listings: [
    L("l1", "Sri Lakshmi Constructions", "builders", "independent-houses", "Chennai", "Velachery", 4.8, 126, true, ["RCC work", "Turnkey homes", "Renovation", "Plan approvals"], { views: 642 }),
    L("l2", "Anand Builders & Developers", "builders", "independent-houses", "Chennai", "Tambaram", 4.6, 88, true, ["Villas", "Renovation"], { views: 318, vendor_id: "v2" }),
    L("l3", "Meenakshi Infra Projects", "builders", "apartments", "Chennai", "Porur", 4.4, 51, false, ["Apartments", "Approvals"], { views: 201, vendor_id: "v3" }),
    L("l4", "Waterproofing services", "technicians", "waterproofing", "Chennai", "Adyar", 4.2, 12, true, ["Terrace", "Bathrooms"], { views: 96, status: "paused" }),
    L("l5", "Plan approval assistance", "builders", "approvals", "Chennai", "Velachery", 4.0, 0, true, [], { views: 0, status: "draft", is_approved: false }),
  ],
  user_roles: [{ user_id: DEMO_UID, role: DEMO_ROLE }],
  profiles: [{ id: DEMO_UID, full_name: "Kamal", phone: "+919840012321", account_type: DEMO_ROLE, is_approved: true }],
  leads: [
    { id: "d1", listing_id: "l1", vendor_id: DEMO_UID, name: "Ramesh K.", phone: "+919876543210", requirement: "G+1 house on a 1,200 sq ft plot in Tambaram. Need estimate.", status: "new", created_at: ago(3) },
    { id: "d2", listing_id: "l1", vendor_id: DEMO_UID, name: "Divya S.", phone: "+919812345678", requirement: "Renovation of 2BHK kitchen and bathrooms.", status: "contacted", created_at: ago(30) },
    { id: "d3", listing_id: "l4", vendor_id: DEMO_UID, name: "Suresh P.", phone: "+919800011122", requirement: "Terrace waterproofing, 900 sq ft.", status: "converted", created_at: ago(24 * 40) },
  ],
  messages: [
    { id: "m1", thread_id: "t1", listing_id: "l1", vendor_id: DEMO_UID, thread_token: "x", sender_type: "user", user_name: "Ramesh K.", user_phone: "+919876543210", body: "Hi, I'm planning a G+1 house on a 1,200 sq ft plot in Tambaram. Can you share an estimate per sq ft?", created_at: ago(5), vendor_read: false },
    { id: "m2", thread_id: "t1", listing_id: "l1", vendor_id: DEMO_UID, thread_token: "x", sender_type: "vendor", user_name: "Ramesh K.", user_phone: "+919876543210", body: "Hello! Thanks for reaching out. Rates depend on the finish package — can we schedule a site visit this week?", created_at: ago(4.6), vendor_read: true },
    { id: "m3", thread_id: "t1", listing_id: "l1", vendor_id: DEMO_UID, thread_token: "x", sender_type: "user", user_name: "Ramesh K.", user_phone: "+919876543210", body: "Saturday morning works for me.", created_at: ago(4.4), vendor_read: false },
    { id: "m4", thread_id: "t2", listing_id: "l1", vendor_id: DEMO_UID, thread_token: "y", sender_type: "user", user_name: "Divya S.", user_phone: null, body: "Is the site visit on Saturday confirmed?", created_at: ago(28), vendor_read: true },
    { id: "m5", thread_id: "t3", listing_id: "l4", vendor_id: DEMO_UID, thread_token: "z", sender_type: "user", user_name: null, user_phone: null, body: "Do you take up renovation work in Adyar?", created_at: ago(80), vendor_read: true },
  ],
  reviews: [
    { id: "r1", listing_id: "l1", vendor_id: DEMO_UID, customer_name: "Anita R.", rating: 5, body: "Finished our duplex on schedule. Site engineer kept us updated every week.", created_at: ago(48) },
    { id: "r2", listing_id: "l1", vendor_id: DEMO_UID, customer_name: "Priya M.", rating: 4.5, body: "Good quality RCC work and transparent billing. Minor delays in finishing.", created_at: ago(170) },
    { id: "r3", listing_id: "l1", vendor_id: DEMO_UID, customer_name: "Vikram S.", rating: 5, body: "Handled approvals and construction end to end. Highly recommended.", created_at: ago(500) },
  ],
  subscriptions: [],
  portfolio_files: [],
};

function json(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { "Content-Type": "application/json", ...init.headers } });
}

export const demoFetch: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  const method = (init?.method ?? "GET").toUpperCase();
  const m = url.pathname.match(/\/rest\/v1\/([a-z_]+)/);
  if (!m) return json({ error: "demo mode: endpoint not mocked" }, { status: 400 });
  const rows = TABLES[m[1]] ?? [];
  if (method !== "GET" && method !== "HEAD") {
    return json(method === "POST" ? [{ id: `new-${Date.now()}`, created_at: new Date().toISOString() }] : [], { status: method === "POST" ? 201 : 200 });
  }
  let out = rows;
  url.searchParams.forEach((v, k) => {
    if (v.startsWith("eq.")) out = out.filter((r) => String(r[k]) === v.slice(3));
    if (v.startsWith("neq.")) out = out.filter((r) => String(r[k]) !== v.slice(4));
  });
  const headers = new Headers(init?.headers);
  const single = (headers.get("Accept") ?? "").includes("vnd.pgrst.object");
  const range = { "Content-Range": `0-${Math.max(0, out.length - 1)}/${out.length}` };
  if (method === "HEAD") return new Response(null, { status: 200, headers: range });
  if (single) return out[0] ? json(out[0]) : json({ code: "PGRST116", message: "no rows" }, { status: 406 });
  return json(out, { headers: range });
};

export const demoSession = {
  access_token: "demo", refresh_token: "demo", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer",
  user: { id: DEMO_UID, email: "kamal@example.com", app_metadata: {}, user_metadata: { full_name: "Kamal" }, aud: "authenticated", created_at: ago(1000) },
};
