// 17 · Subscription
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, Crown } from "lucide-react-native";
import { C } from "@/theme";
import { Loading, ScreenHeader, Txt } from "@/components/ui";
import { BlueprintGrid } from "@/components/brand";
import { useAuth } from "@/context/AuthContext";
import { getSubscription } from "@/lib/vendor";
import { format } from "@/lib/format";

const FREE = ["Unlimited listings", "Business profile & gallery", "Leads and enquiries inbox", "Messages from customers", "Analytics dashboard", "Search placement"];
const PREMIUM = ["Everything in Free", "Featured placement in search", "Premium badge on your ads", "Priority support"];

export default function Subscription() {
  const router = useRouter();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["subscription", user!.id], queryFn: () => getSubscription(user!.id) });
  const premium = q.data?.plan === "premium" && q.data.status === "active";
  const features = premium ? PREMIUM : FREE;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Subscription" />
      {q.isLoading ? <Loading /> : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={{ marginTop: 16, marginHorizontal: 16, padding: 20, borderRadius: 20, backgroundColor: C.navy, overflow: "hidden" }}>
            <BlueprintGrid color={C.white} opacity={0.06} size={24} id="plan" />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Txt size={12} weight="bold" color="#F9A66C" style={{ letterSpacing: 1.4, textTransform: "uppercase" }}>Current plan</Txt>
                <Txt heading="xb" size={32} color={C.white} style={{ marginTop: 6 }}>{premium ? "Premium" : "Free"}</Txt>
              </View>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }}><Crown size={24} color={C.white} /></View>
            </View>
            <Txt size={13} lh={1.5} color={C.navyMuted} style={{ marginTop: 10 }}>
              {premium
                ? `Active since ${format(q.data!.started_at)}${q.data!.expires_at ? ` · renews ${format(q.data!.expires_at)}` : ""}.`
                : "Everything you need to list your business and receive enquiries on BharathBuild."}
            </Txt>
          </View>

          <View style={{ marginTop: 16, marginHorizontal: 16, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16 }}>
            <Txt heading size={16} style={{ marginTop: 12, marginBottom: 4 }}>Included in your plan</Txt>
            {features.map((f) => (
              <View key={f} style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: C.divider }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center" }}><Check size={14} color={C.green} strokeWidth={2.5} /></View>
                <Txt size={14} weight="semibold">{f}</Txt>
              </View>
            ))}
          </View>

          {!premium && (
            <Pressable accessibilityRole="button" onPress={() => router.push("/contact")}
              style={({ pressed }) => [{ marginTop: 16, marginHorizontal: 16, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: C.orange, backgroundColor: C.orangeTint, flexDirection: "row", alignItems: "center", gap: 12 }, pressed && { opacity: 0.85 }]}>
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="bold">Need more reach?</Txt>
                <Txt size={12} color={C.body} style={{ marginTop: 2 }}>Talk to our team about featured placement.</Txt>
              </View>
              <ChevronRight size={18} color={C.orangeDark} />
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}
