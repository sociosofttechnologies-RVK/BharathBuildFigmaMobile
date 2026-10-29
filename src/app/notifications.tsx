import React from "react";
import { View } from "react-native";
import { Bell } from "lucide-react-native";
import { C } from "@/theme";
import { EmptyState, ScreenHeader } from "@/components/ui";

export default function Notifications() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Notifications" />
      <EmptyState icon={Bell} title="You're all caught up" body="Replies from vendors and updates on your enquiries will show up here." />
    </View>
  );
}
