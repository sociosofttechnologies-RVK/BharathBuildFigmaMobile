// 15 · Analytics
import React from "react";
import { Alert, Platform, RefreshControl, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Download } from "lucide-react-native";
import { C } from "@/theme";
import { Button, Card, ErrorBox, H2, Loading, PageHeader, Txt } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { analyticsCsv, getVendorAnalytics, type VendorAnalytics } from "@/lib/analytics";

const STATUS_COLOR: Record<string, string> = { new: C.orange, contacted: C.navy, converted: "#2E9E5B", closed: "#B8C1CB" };

export default function Analytics() {
  const { user } = useAuth();
  const uid = user!.id;
  const q = useQuery({ queryKey: ["vendorAnalytics", uid], queryFn: () => getVendorAnalytics(uid) });

  const exportCsv = async () => {
    if (!q.data) return;
    const csv = analyticsCsv(q.data);
    try {
      if (Platform.OS === "web") {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = "bharathbuild-analytics.csv";
        a.click();
        return;
      }
      const file = new File(Paths.cache, `bharathbuild-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
      if (file.exists) file.delete();
      file.create();
      file.write(csv);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "text/csv", dialogTitle: "Export analytics", UTI: "public.comma-separated-values-text" });
      else Alert.alert("Saved", file.uri);
    } catch (e) { Alert.alert("Export failed", (e as Error).message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <PageHeader title="Analytics" right={<Button title="Export CSV" icon={Download} variant="outline" height={40} textSize={13} style={{ paddingHorizontal: 12, borderColor: C.border }} onPress={exportCsv} disabled={!q.data} />} />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} /> : (
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); }} tintColor={C.orange} />}>
          <Body a={q.data!} />
        </ScrollView>
      )}
    </View>
  );
}

function Body({ a }: { a: VendorAnalytics }) {
  const diff = a.enquiriesThisMonth - a.enquiriesLastMonth;
  const kpis = [
    { label: "Total Views", value: a.totalViews.toLocaleString("en-IN"), delta: "Across all your ads" },
    { label: "Total Leads", value: String(a.totalLeads), delta: `${diff >= 0 ? "+" : ""}${diff} vs last month` },
    { label: "Conversion Rate", value: `${a.conversion.toFixed(1)}%`, delta: "Leads ÷ views" },
    { label: "Active Ads", value: `${a.activeAds} / ${a.totalAds}`, delta: [a.paused && `${a.paused} paused`, a.drafts && `${a.drafts} draft`].filter(Boolean).join(", ") || "All live" },
  ];
  const max = Math.max(1, ...a.months.map((m) => m.value));
  const leadTotal = a.leadStatus.reduce((s, x) => s + x.count, 0);

  return (
    <>
      <View style={{ paddingHorizontal: 16, paddingTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {kpis.map((k) => (
          <View key={k.label} style={{ width: "48%", flexGrow: 1, padding: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14 }}>
            <Txt size={12} weight="semibold" color={C.muted}>{k.label}</Txt>
            <Txt heading="xb" size={24} style={{ marginTop: 6 }}>{k.value}</Txt>
            <Txt size={12} weight="semibold" color={C.green} style={{ marginTop: 4 }}>{k.delta}</Txt>
          </View>
        ))}
      </View>

      <Card style={{ marginTop: 14, marginHorizontal: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <H2>Monthly enquiries</H2>
          <View style={{ height: 30, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.chip, justifyContent: "center" }}><Txt size={12} weight="semibold">Last 6 months</Txt></View>
        </View>
        <View accessibilityRole="image" accessibilityLabel={`Monthly enquiries: ${a.months.map((m) => `${m.label} ${m.value}`).join(", ")}`}
          style={{ marginTop: 16, height: 170, flexDirection: "row", alignItems: "flex-end", gap: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
          {a.months.map((m, i) => (
            <View key={m.label + i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6, height: "100%" }}>
              <Txt size={11} weight="bold" color={C.body}>{m.value}</Txt>
              <View style={{ width: "100%", height: Math.max(3, Math.round((m.value / max) * 130)), borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: i === a.months.length - 1 ? C.orange : C.navy }} />
            </View>
          ))}
        </View>
        <View style={{ marginTop: 6, flexDirection: "row", gap: 12 }}>
          {a.months.map((m, i) => <Txt key={m.label + i} size={11} color={C.muted} center style={{ flex: 1 }}>{m.label}</Txt>)}
        </View>
      </Card>

      <Card style={{ marginTop: 14, marginHorizontal: 16 }}>
        <H2>Leads by status</H2>
        <View accessibilityRole="image" accessibilityLabel={`${leadTotal} leads: ${a.leadStatus.map((s) => `${s.count} ${s.status}`).join(", ")}`}
          style={{ marginTop: 14, height: 14, borderRadius: 7, overflow: "hidden", flexDirection: "row", gap: 2, backgroundColor: C.chip }}>
          {leadTotal > 0 && a.leadStatus.filter((s) => s.count).map((s) => <View key={s.status} style={{ flex: s.count, backgroundColor: STATUS_COLOR[s.status] ?? C.muted }} />)}
        </View>
        <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
          {a.leadStatus.map((s) => (
            <View key={s.status} style={{ width: "50%", flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 12 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: STATUS_COLOR[s.status] ?? C.muted }} />
              <Txt size={13} style={{ flex: 1, textTransform: "capitalize" }}>{s.status}</Txt>
              <Txt size={13} weight="bold">{s.count}</Txt>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: 14, marginHorizontal: 16, paddingVertical: 6 }}>
        <H2 style={{ marginTop: 10, marginBottom: 4 }}>Top performing ads</H2>
        {a.top.length === 0 && <Txt size={13} color={C.muted} style={{ paddingVertical: 10 }}>Publish an ad to see how it performs.</Txt>}
        {a.top.map((t, i) => (
          <View key={t.id} style={{ paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: C.divider }}>
            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: C.orangeTint, alignItems: "center", justifyContent: "center" }}><Txt size={12} heading="xb" color={C.orangeDark}>{i + 1}</Txt></View>
            <Txt size={14} weight="semibold" style={{ flex: 1 }} numberOfLines={2}>{t.name}</Txt>
            <View style={{ alignItems: "flex-end" }}>
              <Txt size={12} color={C.body}>{t.views.toLocaleString("en-IN")} views</Txt>
              <Txt size={12} weight="bold">{t.leads} leads</Txt>
            </View>
          </View>
        ))}
      </Card>
    </>
  );
}
