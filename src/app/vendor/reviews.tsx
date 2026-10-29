// 16 · Reviews
import React, { useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react-native";
import { C } from "@/theme";
import { EmptyState, ErrorBox, Initial, Loading, ScreenHeader, Txt } from "@/components/ui";
import { Pressable } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { relTime } from "@/lib/format";

type Row = { id: string; customer_name: string; rating: number; body: string; created_at: string; listing_id: string };
type Sort = "newest" | "low" | "high";

export default function VendorReviews() {
  const { user } = useAuth();
  const uid = user!.id;
  const q = useQuery({
    queryKey: ["vendorReviews", uid],
    queryFn: async () => {
      const [r, l] = await Promise.all([
        supabase.from("reviews").select("id,customer_name,rating,body,created_at,listing_id").eq("vendor_id", uid).order("created_at", { ascending: false }),
        supabase.from("listings").select("id,name").eq("vendor_id", uid),
      ]);
      if (r.error) throw new Error(r.error.message);
      return { reviews: (r.data ?? []) as Row[], names: new Map((l.data ?? []).map((x) => [x.id, x.name])) };
    },
  });
  const [sort, setSort] = useState<Sort>("newest");
  const reviews = q.data?.reviews ?? [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => Math.round(Number(r.rating)) === s).length }));
  const shown = useMemo(() => {
    if (sort === "low") return reviews.filter((r) => Number(r.rating) <= 3);
    if (sort === "high") return [...reviews].sort((a, b) => Number(b.rating) - Number(a.rating));
    return reviews;
  }, [reviews, sort]);
  const low = reviews.filter((r) => Number(r.rating) <= 3).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Reviews" />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} /> : (
        <FlatList
          data={shown}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingBottom: 28, gap: 10 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} tintColor={C.orange} />}
          ListHeaderComponent={
            <View>
              <View style={{ marginTop: 14, marginHorizontal: 16, padding: 16, borderRadius: 18, backgroundColor: C.navy, flexDirection: "row", gap: 18, alignItems: "center" }}>
                <View style={{ alignItems: "center" }}>
                  <Txt heading="xb" size={40} color={C.white}>{avg ? avg.toFixed(1) : "—"}</Txt>
                  <View style={{ flexDirection: "row", gap: 2, marginTop: 6 }} accessibilityLabel={`${avg.toFixed(1)} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} color={C.orange} fill={i <= Math.round(avg) ? C.orange : "transparent"} />)}
                  </View>
                  <Txt size={12} color={C.navyMuted} style={{ marginTop: 4 }}>{reviews.length} review{reviews.length === 1 ? "" : "s"}</Txt>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  {dist.map((d) => (
                    <View key={d.s} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Txt size={12} color={C.navyMuted} style={{ width: 10 }}>{d.s}</Txt>
                      <View style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                        <View style={{ height: 7, width: `${reviews.length ? (d.n / reviews.length) * 100 : 0}%`, borderRadius: 4, backgroundColor: C.orange }} />
                      </View>
                      <Txt size={12} color={C.navyMuted} style={{ width: 24, textAlign: "right" }}>{d.n}</Txt>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2, flexDirection: "row", gap: 8 }}>
                {([["newest", "Newest"], ["high", "Top rated"], ["low", low ? `Low rated · ${low}` : "Low rated"]] as const).map(([k, l]) => (
                  <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: sort === k }} onPress={() => setSort(k)}
                    style={{ height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: C.white, borderWidth: sort === k ? 1.5 : 1, borderColor: sort === k ? C.navy : C.border, justifyContent: "center" }}>
                    <Txt size={13} weight={sort === k ? "bold" : "semibold"}>{l}</Txt>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={<EmptyState icon={Star} title={reviews.length ? "Nothing here" : "No reviews yet"} body={reviews.length ? "No reviews match this filter." : "Ask happy customers to review you from your ad page."} />}
          renderItem={({ item: r }) => (
            <View style={{ marginHorizontal: 16, padding: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Initial name={r.customer_name} size={36} round />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={14} weight="bold">{r.customer_name}</Txt>
                  <Txt size={12} color={C.muted} numberOfLines={1}>{q.data?.names.get(r.listing_id) ?? "Your ad"} · {relTime(r.created_at)}</Txt>
                </View>
                <Txt size={13} weight="bold" color={C.orangeDark}>★ {Number(r.rating).toFixed(1)}</Txt>
              </View>
              {!!r.body && <Txt size={13} lh={1.5} color={C.body} style={{ marginTop: 10 }}>{r.body}</Txt>}
            </View>
          )}
        />
      )}
    </View>
  );
}
