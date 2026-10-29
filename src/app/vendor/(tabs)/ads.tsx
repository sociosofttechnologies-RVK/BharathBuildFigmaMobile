// 12 · My Ads
import React, { useMemo, useState } from "react";
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, RefreshControl, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { EllipsisVertical, Eye, Megaphone, Search, X } from "lucide-react-native";
import { C, F, R } from "@/theme";
import { Badge, Chip, EmptyState, ErrorBox, IconButton, Initial, Loading, PageHeader, Txt } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getVendorAds, type VendorAd } from "@/lib/ads";
import { deleteVendorListing, setListingStatus } from "@/lib/vendor";
import { categoryLabel } from "@/lib/categories";
import { subLabel } from "@/lib/adFields";

type Tab = "all" | "active" | "paused" | "draft";

export default function MyAds() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user!.id;
  const q = useQuery({ queryKey: ["vendorAds", uid], queryFn: () => getVendorAds(uid) });
  const [tab, setTab] = useState<Tab>("all");
  const [searching, setSearching] = useState(false);
  const [term, setTerm] = useState("");

  const ads = q.data ?? [];
  const count = (t: Tab) => (t === "all" ? ads.length : ads.filter((a) => a.status === t).length);
  const shown = useMemo(() => ads.filter((a) => (tab === "all" || a.status === tab) && (!term || a.name.toLowerCase().includes(term.toLowerCase()))), [ads, tab, term]);
  const invalidate = () => { qc.invalidateQueries({ queryKey: ["vendorAds", uid] }); qc.invalidateQueries({ queryKey: ["vendorStats", uid] }); };

  const more = (ad: VendorAd) => {
    const toggle = ad.status === "active" ? "Pause ad" : "Publish ad";
    const run = async (i: number) => {
      try {
        if (i === 0) router.push({ pathname: "/vendor/ad-editor", params: { id: ad.id } });
        if (i === 1) { await setListingStatus(ad.id, ad.status === "active" ? "paused" : "active"); invalidate(); }
        if (i === 2) Alert.alert("Delete this ad?", `“${ad.name}” will be removed for buyers.`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: async () => { try { await deleteVendorListing(ad.id); invalidate(); } catch (e) { Alert.alert("Couldn't delete", (e as Error).message); } } },
        ]);
      } catch (e) { Alert.alert("Couldn't update", (e as Error).message); }
    };
    if (Platform.OS === "ios") ActionSheetIOS.showActionSheetWithOptions({ options: ["Edit", toggle, "Delete", "Cancel"], destructiveButtonIndex: 2, cancelButtonIndex: 3, title: ad.name }, (i) => i < 3 && run(i));
    else Alert.alert(ad.name, undefined, [{ text: "Edit", onPress: () => run(0) }, { text: toggle, onPress: () => run(1) }, { text: "Delete", style: "destructive", onPress: () => run(2) }, { text: "Cancel", style: "cancel" }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <PageHeader title="My Ads" subtitle="Manage the ads you've posted for your work."
        right={<IconButton icon={searching ? X : Search} label={searching ? "Close search" : "Search ads"} bordered onPress={() => { setSearching(!searching); setTerm(""); }} />}>
        {searching && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, borderRadius: R.md, backgroundColor: C.chip }}>
            <Search size={17} color={C.muted} />
            <TextInput autoFocus value={term} onChangeText={setTerm} placeholder="Search your ads" placeholderTextColor={C.muted} style={{ flex: 1, fontFamily: F.regular, fontSize: 15, color: C.navy }} />
          </View>
        )}
        <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
          {(["all", "active", "paused", "draft"] as Tab[]).map((t) => (
            <Chip key={t} size="sm" selected={tab === t} onPress={() => setTab(t)} label={`${t[0].toUpperCase()}${t.slice(1)} · ${count(t)}`} />
          ))}
        </View>
      </PageHeader>

      {q.isLoading ? <Loading /> : q.error ? <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} /> : (
        <FlatList
          data={shown}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} tintColor={C.orange} />}
          ListEmptyComponent={<EmptyState icon={Megaphone} title={ads.length ? "No ads here" : "No ads yet"} body={ads.length ? "Try another filter." : "Create an ad so buyers can find your work."} action={ads.length ? undefined : "Create New Ad"} onAction={() => router.push("/vendor/ad-editor")} />}
          renderItem={({ item: ad }) => (
            <View style={{ padding: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, flexDirection: "row", gap: 12 }}>
              {ad.images?.[0] ? <Image source={{ uri: ad.images[0] }} style={{ width: 72, height: 72, borderRadius: 12 }} contentFit="cover" /> : <Initial name={ad.name} size={72} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
                  <Txt size={14} weight="bold" lh={1.3} style={{ flex: 1 }} numberOfLines={2}>{ad.name}</Txt>
                  <IconButton icon={EllipsisVertical} label="More actions" color={C.muted} size={18} style={{ width: 32, height: 32, marginTop: -6, marginRight: -6 }} onPress={() => more(ad)} />
                </View>
                <Txt size={12} color={C.muted} numberOfLines={1} style={{ marginTop: 2 }}>{categoryLabel(ad.category)}{ad.subcategory ? ` · ${subLabel(ad.category, ad.subcategory)}` : ""}</Txt>
                <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Badge kind={ad.status} h={22} />
                  {!ad.is_approved && ad.status !== "draft" && <Badge kind="pending" h={22} />}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Eye size={13} color={C.body} />
                    <Txt size={12} color={C.body}>{(ad.views ?? 0).toLocaleString("en-IN")} views</Txt>
                  </View>
                  <Pressable style={{ marginLeft: "auto" }} hitSlop={10} onPress={() => router.push({ pathname: "/vendor/ad-editor", params: { id: ad.id } })}>
                    <Txt size={13} weight="bold" color={C.orangeDark}>Edit</Txt>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
