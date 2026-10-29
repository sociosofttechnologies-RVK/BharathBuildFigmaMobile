// 11 · Vendor dashboard
import React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Briefcase, Crown, Megaphone, Plus, Star } from "lucide-react-native";
import { C } from "@/theme";
import { Button, Card, EmptyState, H1, IconButton, IconTile, Initial, SectionTitle, Txt } from "@/components/ui";
import { Logo } from "@/components/brand";
import { useAuth } from "@/context/AuthContext";
import { getVendorMessages, getVendorStats, groupThreads } from "@/lib/vendor";
import { getVendorAds } from "@/lib/ads";
import { relTime } from "@/lib/format";

export default function VendorDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, displayName } = useAuth();
  const uid = user!.id;
  const stats = useQuery({ queryKey: ["vendorStats", uid], queryFn: () => getVendorStats(uid) });
  const ads = useQuery({ queryKey: ["vendorAds", uid], queryFn: () => getVendorAds(uid) });
  const msgs = useQuery({ queryKey: ["vendorMessages", uid], queryFn: () => getVendorMessages(uid) });
  const threads = groupThreads(msgs.data ?? []).slice(0, 3);
  const s = stats.data;
  const conv = s && s.totalViews ? `${((s.leads / s.totalViews) * 100).toFixed(1)}%` : "—";
  const tiles = [
    ["Total Ads", ads.data?.length ?? "—"], ["Active Ads", s?.activeListings ?? "—"], ["Views", s ? s.totalViews.toLocaleString("en-IN") : "—"],
    ["Leads", s?.leads ?? "—"], ["Conversion", conv], ["Reviews", s?.reviews ?? "—"],
  ] as const;
  const refetchAll = () => { stats.refetch(); ads.refetch(); msgs.refetch(); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ paddingTop: insets.top, minHeight: 64 + insets.top, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Logo height={34} />
          <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 6, backgroundColor: C.navy, justifyContent: "center" }}><Txt size={11} weight="bold" color={C.white}>Vendor</Txt></View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <IconButton icon={Bell} label="Notifications" dot={!!s?.unread} onPress={() => router.push("/vendor/messages")} />
          <Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => router.push("/account")}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }}>
            <Txt weight="bold" color={C.white}>{displayName[0]?.toUpperCase()}</Txt>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} refreshControl={<RefreshControl refreshing={stats.isRefetching} onRefresh={refetchAll} tintColor={C.orange} />}>
        <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
          <H1>Dashboard</H1>
          <Txt size={13} color={C.muted} style={{ marginTop: 4 }}>Welcome back. Here's what's happening with your business.</Txt>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {tiles.map(([label, value]) => (
            <View key={label} style={{ width: "31.5%", flexGrow: 1, padding: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14 }}>
              <Txt size={11} weight="semibold" color={C.muted}>{label}</Txt>
              <Txt heading="xb" size={22} style={{ marginTop: 6 }} numberOfLines={1} adjustsFontSizeToFit>{String(value)}</Txt>
            </View>
          ))}
        </View>

        <Button title="Create New Ad" icon={Plus} style={{ marginTop: 14, marginHorizontal: 16 }} onPress={() => router.push("/vendor/ad-editor")} />

        <Card style={{ marginTop: 14, marginHorizontal: 16 }}>
          <SectionTitle title="Messages" action="View all" onAction={() => router.push("/vendor/messages")} />
          {threads.length === 0 && <Txt size={13} color={C.muted} style={{ paddingVertical: 6 }}>No messages yet. Enquiries from buyers will appear here.</Txt>}
          {threads.map((t) => (
            <Pressable key={t.id} onPress={() => router.push({ pathname: "/vendor/thread/[id]", params: { id: t.id } })}
              style={{ paddingVertical: 10, flexDirection: "row", gap: 10, alignItems: "center", borderTopWidth: 1, borderTopColor: C.divider }}>
              <Initial name={t.userName} size={38} round />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={14} weight={t.unread ? "bold" : "semibold"}>{t.userName}</Txt>
                <Txt size={12} color={C.muted} numberOfLines={1}>{t.last.sender_type === "vendor" ? "You: " : ""}{t.last.body}</Txt>
              </View>
              <Txt size={11} color={t.unread ? C.orangeDark : C.muted}>{relTime(t.last.created_at)}</Txt>
            </Pressable>
          ))}
        </Card>

        <View style={{ marginTop: 14, marginHorizontal: 16 }}>
          <Txt heading size={16} style={{ marginBottom: 10 }}>Manage</Txt>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([[Megaphone, "My Ads", "/vendor/ads"], [Briefcase, "Portfolio", "/vendor/portfolio"], [Star, "Reviews", "/vendor/reviews"], [Crown, "Plan", "/vendor/subscription"]] as const).map(([Icon, label, href]) => (
              <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href)}
                style={({ pressed }) => [{ flex: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, backgroundColor: pressed ? C.bg : C.white, borderWidth: 1, borderColor: C.border, alignItems: "center", gap: 6 }]}>
                <IconTile icon={Icon} size={38} iconSize={19} />
                <Txt size={12} weight="semibold">{label}</Txt>
              </Pressable>
            ))}
          </View>
        </View>

        {ads.data?.length === 0 && (
          <EmptyState icon={Megaphone} title="Post your first ad" body="Ads are how buyers find you. Add photos, your service area and contact numbers." />
        )}
      </ScrollView>
    </View>
  );
}
