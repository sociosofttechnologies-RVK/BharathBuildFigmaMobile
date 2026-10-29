// Buyer bottom navigation: Home · Search · Messages · Account
import React from "react";
import { Tabs, TabList, TabSlot, TabTrigger } from "expo-router/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, MessageSquare, Search, User } from "lucide-react-native";
import { TabButton, tabBarStyle } from "@/components/TabButton";

export default function BuyerTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1, minHeight: 0 }} />
      <TabList style={[tabBarStyle, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TabTrigger name="home" href="/home" asChild><TabButton icon={House} label="Home" /></TabTrigger>
        <TabTrigger name="search" href="/search" asChild><TabButton icon={Search} label="Search" /></TabTrigger>
        <TabTrigger name="messages" href="/messages" asChild><TabButton icon={MessageSquare} label="Messages" /></TabTrigger>
        <TabTrigger name="account" href="/account" asChild><TabButton icon={User} label="Account" /></TabTrigger>
      </TabList>
    </Tabs>
  );
}
