// Vendor analytics computed from the vendor's own rows (listings.views, leads, messages).
import { supabase } from "@/lib/supabase";

export type VendorAnalytics = {
  totalViews: number; totalLeads: number; leadsThisMonth: number; conversion: number;
  activeAds: number; totalAds: number; paused: number; drafts: number;
  months: { label: string; value: number }[];
  leadStatus: { status: string; count: number }[];
  top: { id: string; name: string; views: number; leads: number }[];
  enquiriesThisMonth: number; enquiriesLastMonth: number;
};

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export async function getVendorAnalytics(uid: string): Promise<VendorAnalytics> {
  const [l, le, m] = await Promise.all([
    supabase.from("listings").select("id,name,views,status").eq("vendor_id", uid).is("deleted_at", null),
    supabase.from("leads").select("id,listing_id,status,created_at").eq("vendor_id", uid),
    supabase.from("messages").select("thread_id,listing_id,created_at").eq("vendor_id", uid).eq("sender_type", "user"),
  ]);
  if (l.error) throw new Error(l.error.message);
  const listings = l.data ?? [];
  const leads = le.data ?? [];
  // first message of each thread = one enquiry
  const firstByThread = new Map<string, { listing_id: string; created_at: string }>();
  for (const r of m.data ?? []) {
    const cur = firstByThread.get(r.thread_id);
    if (!cur || r.created_at < cur.created_at) firstByThread.set(r.thread_id, r);
  }
  const enquiries = [...leads.map((x) => ({ listing_id: x.listing_id, created_at: x.created_at })), ...firstByThread.values()];

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const counts = new Map(months.map((d) => [monthKey(d), 0]));
  for (const e of enquiries) {
    const k = monthKey(new Date(e.created_at));
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const thisK = monthKey(months[5]), lastK = monthKey(months[4]);

  const totalViews = listings.reduce((s, x) => s + (x.views ?? 0), 0);
  const statusCounts = new Map<string, number>();
  for (const x of leads) statusCounts.set(x.status || "new", (statusCounts.get(x.status || "new") ?? 0) + 1);
  const leadsPer = new Map<string, number>();
  for (const e of enquiries) leadsPer.set(e.listing_id, (leadsPer.get(e.listing_id) ?? 0) + 1);

  return {
    totalViews,
    totalLeads: enquiries.length,
    leadsThisMonth: leads.filter((x) => monthKey(new Date(x.created_at)) === thisK).length,
    conversion: totalViews ? (enquiries.length / totalViews) * 100 : 0,
    activeAds: listings.filter((x) => x.status === "active").length,
    totalAds: listings.length,
    paused: listings.filter((x) => x.status === "paused").length,
    drafts: listings.filter((x) => x.status === "draft").length,
    months: months.map((d) => ({ label: d.toLocaleDateString("en-IN", { month: "short" }), value: counts.get(monthKey(d)) ?? 0 })),
    leadStatus: ["new", "contacted", "converted", "closed"].map((st) => ({ status: st, count: statusCounts.get(st) ?? 0 }))
      .concat([...statusCounts.entries()].filter(([k]) => !["new", "contacted", "converted", "closed"].includes(k)).map(([status, count]) => ({ status, count }))),
    top: listings.map((x) => ({ id: x.id, name: x.name, views: x.views ?? 0, leads: leadsPer.get(x.id) ?? 0 })).sort((a, b) => b.views - a.views).slice(0, 3),
    enquiriesThisMonth: counts.get(thisK) ?? 0,
    enquiriesLastMonth: counts.get(lastK) ?? 0,
  };
}

export function analyticsCsv(a: VendorAnalytics) {
  const rows = [
    ["Metric", "Value"],
    ["Total views", a.totalViews], ["Total enquiries", a.totalLeads], ["Conversion rate %", a.conversion.toFixed(1)],
    ["Active ads", a.activeAds], ["Total ads", a.totalAds], [],
    ["Month", "Enquiries"], ...a.months.map((m) => [m.label, m.value]), [],
    ["Lead status", "Count"], ...a.leadStatus.map((s) => [s.status, s.count]), [],
    ["Ad", "Views", "Enquiries"], ...a.top.map((t) => [t.name, t.views, t.leads]),
  ];
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
