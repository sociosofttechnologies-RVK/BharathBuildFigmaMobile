// 14 · Messages inbox (threads + leads)
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Phone, Search } from "lucide-react-native";
import { C, F, R } from "@/theme";
import { Chip, EmptyState, ErrorBox, Initial, Loading, PageHeader, Txt } from "@/components/ui";
import { callNumber } from "@/components/brand";
import { useAuth } from "@/context/AuthContext";
import { getVendorLeads, getVendorMessages, groupThreads, setLeadStatus, type VendorLead } from "@/lib/vendor";
import { getVendorAds } from "@/lib/ads";
import { relTime } from "@/lib/format";

type Tab = "all" | "unread" | "leads";
const LEAD_STATUSES = ["new", "contacted", "converted", "closed"];

export default function VendorMessages() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user!.id;
  const msgs = useQuery({ queryKey: ["vendorMessages", uid], queryFn: () => getVendorMessages(uid), refetchInterval: 10_000 });
  const leads = useQuery({ queryKey: ["vendorLeads", uid], queryFn: () => getVendorLeads(uid) });
  const ads = useQuery({ queryKey: ["vendorAds", uid], queryFn: () => getVendorAds(uid) });
  const [tab, setTab] = useState<Tab>("all");
  const [term, setTerm] = useState("");

  const adName = useMemo(() => new Map((ads.data ?? []).map((a) => [a.id, a.name])), [ads.data]);
  const threads = useMemo(() => groupThreads(msgs.data ?? []), [msgs.data]);
  const unread = threads.filter((t) => t.unread > 0).length;
  const t = term.trim().toLowerCase();
  const shownThreads = threads.filter((x) => (tab !== "unread" || x.unread > 0) && (!t || x.userName.toLowerCase().includes(t) || (adName.get(x.last.listing_id) ?? "").toLowerCase().includes(t)));
  const shownLeads = (leads.data ?? []).filter((l) => !t || l.name.toLowerCase().includes(t) || l.requirement.toLowerCase().includes(t));

  const changeStatus = (l: VendorLead) => Alert.alert(`Lead: ${l.name}`, "Update status", [
    ...LEAD_STATUSES.filter((s) => s !== l.status).map((s) => ({
      text: s[0].toUpperCase() + s.slice(1),
      onPress: async () => { try { await setLeadStatus(l.id, s); qc.invalidateQueries({ queryKey: ["vendorLeads", uid] }); } catch (e) { Alert.alert("Couldn't update", (e as Error).message); } },
    })),
    { text: "Cancel", style: "cancel" as const },
  ]);

  const loading = tab === "leads" ? leads.isLoading : msgs.isLoading;
  const error = (tab === "leads" ? leads.error : msgs.error) as Error | null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <PageHeader title="Messages">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, borderRadius: R.md, backgroundColor: C.chip }}>
          <Search size={17} color={C.muted} />
          <TextInput value={term} onChangeText={setTerm} placeholder={tab === "leads" ? "Search leads" : "Search by name or ad"} placeholderTextColor={C.muted} style={{ flex: 1, fontFamily: F.regular, fontSize: 15, color: C.navy }} />
        </View>
        <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 8 }}>
          <Chip size="sm" label="All" selected={tab === "all"} onPress={() => setTab("all")} />
          <Chip size="sm" label={unread ? `Unread · ${unread}` : "Unread"} selected={tab === "unread"} onPress={() => setTab("unread")} />
          <Chip size="sm" label={leads.data?.length ? `Leads · ${leads.data.length}` : "Leads"} selected={tab === "leads"} onPress={() => setTab("leads")} />
        </View>
      </PageHeader>

      {loading ? <Loading /> : error ? <ErrorBox message={error.message} /> : tab === "leads" ? (
        <FlatList
          data={shownLeads}
          keyExtractor={(l) => l.id}
          refreshControl={<RefreshControl refreshing={leads.isRefetching} onRefresh={() => { leads.refetch(); }} tintColor={C.orange} />}
          ListEmptyComponent={<EmptyState icon={Inbox} title="No leads yet" body="Quote requests from your ads will show up here." />}
          renderItem={({ item: l }) => (
            <View style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.divider, flexDirection: "row", gap: 12 }}>
              <Initial name={l.name} size={44} round />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Txt size={14} weight="bold" numberOfLines={1} style={{ flex: 1 }}>{l.name}</Txt>
                  <Txt size={11} color={C.muted}>{relTime(l.created_at)}</Txt>
                </View>
                <Txt size={13} color={C.body} lh={1.4} numberOfLines={3} style={{ marginTop: 2 }}>{l.requirement}</Txt>
                <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={() => callNumber(l.phone)} style={{ height: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.orangeTint, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Phone size={14} color={C.orange} /><Txt size={12} weight="bold" color={C.orangeDark}>{l.phone}</Txt>
                  </Pressable>
                  <Pressable onPress={() => changeStatus(l)} style={{ height: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.navyTint, justifyContent: "center" }}>
                    <Txt size={12} weight="bold" style={{ textTransform: "capitalize" }}>{l.status || "new"} ▾</Txt>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={shownThreads}
          keyExtractor={(x) => x.id}
          refreshControl={<RefreshControl refreshing={msgs.isRefetching} onRefresh={() => { msgs.refetch(); }} tintColor={C.orange} />}
          ListEmptyComponent={<EmptyState icon={Inbox} title={tab === "unread" ? "No unread messages" : "No messages yet"} body="When buyers message you about an ad, the conversation appears here." />}
          renderItem={({ item: x }) => {
            const on = x.unread > 0;
            return (
              <Pressable onPress={() => router.push({ pathname: "/vendor/thread/[id]", params: { id: x.id } })}
                style={({ pressed }) => [{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", gap: 12, backgroundColor: pressed ? C.bg : C.white, borderBottomWidth: 1, borderBottomColor: C.divider }]}>
                <Initial name={x.userName} size={44} round />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                    <Txt size={14} weight={on ? "bold" : "semibold"} style={{ flex: 1, fontFamily: on ? F.headingXB : undefined }} numberOfLines={1}>{x.userName}</Txt>
                    <Txt size={11} weight={on ? "bold" : "regular"} color={on ? C.orangeDark : C.muted}>{relTime(x.last.created_at)}</Txt>
                  </View>
                  <Txt size={12} weight="semibold" color={C.orangeDark} numberOfLines={1}>{adName.get(x.last.listing_id) ?? "Your ad"}</Txt>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <Txt size={13} color={on ? C.navy : C.muted} numberOfLines={1} style={{ flex: 1 }}>{x.last.sender_type === "vendor" ? "You: " : ""}{x.last.body}</Txt>
                    {on && <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }}><Txt size={11} weight="bold" color={C.white}>{x.unread}</Txt></View>}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
