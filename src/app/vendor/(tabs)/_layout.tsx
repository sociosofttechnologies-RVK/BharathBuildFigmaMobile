// Vendor bottom navigation: Dashboard · My Ads · (+) · Messages · Analytics
import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Tabs, TabList, TabSlot, TabTrigger } from "expo-router/ui";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChartColumn, LayoutDashboard, Megaphone, MessageSquare, Plus } from "lucide-react-native";
import { TabButton, tabBarStyle } from "@/components/TabButton";
import { useAuth } from "@/context/AuthContext";
import { getVendorStats } from "@/lib/vendor";
import { C } from "@/theme";

export default function VendorTabs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const stats = useQuery({ queryKey: ["vendorStats", user?.id], queryFn: () => getVendorStats(user!.id), enabled: !!user, refetchInterval: 30_000 });

  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1, minHeight: 0 }} />
      <TabList style={[tabBarStyle, { paddingBottom: Math.max(insets.bottom, 10), alignItems: "center" }]}>
        <TabTrigger name="dashboard" href="/vendor" asChild><TabButton icon={LayoutDashboard} label="Dashboard" /></TabTrigger>
        <TabTrigger name="ads" href="/vendor/ads" asChild><TabButton icon={Megaphone} label="My Ads" /></TabTrigger>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Create new ad" onPress={() => router.push("/vendor/ad-editor")}
            style={({ pressed }) => [{ width: 52, height: 52, marginTop: -22, borderRadius: 26, backgroundColor: C.orange, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: C.white,
              shadowColor: C.orange, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 }, pressed && { opacity: 0.85 }]}>
            <Plus size={24} color={C.white} strokeWidth={2.5} />
          </Pressable>
        </View>
        <TabTrigger name="messages" href="/vendor/messages" asChild><TabButton icon={MessageSquare} label="Messages" badge={stats.data?.unread} /></TabTrigger>
        <TabTrigger name="analytics" href="/vendor/analytics" asChild><TabButton icon={ChartColumn} label="Analytics" /></TabTrigger>
      </TabList>
    </Tabs>
  );
}
