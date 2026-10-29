import React from "react";
import { Pressable, View } from "react-native";
import type { TabTriggerSlotProps } from "expo-router/ui";
import type { LucideIcon } from "lucide-react-native";
import { C } from "@/theme";
import { Txt } from "@/components/ui";

export type TabButtonProps = TabTriggerSlotProps & { icon: LucideIcon; label: string; badge?: number };

export function TabButton({ icon: Icon, label, isFocused, badge, ref: _ref, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 6 }}
    >
      <View>
        <Icon size={22} color={isFocused ? C.orange : C.muted} strokeWidth={isFocused ? 2.4 : 2} />
        {!!badge && (
          <View style={{ position: "absolute", top: -4, right: -8, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: C.orange, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.white }}>
            <Txt size={9} weight="bold" color={C.white}>{badge > 9 ? "9+" : badge}</Txt>
          </View>
        )}
      </View>
      <Txt size={11} weight={isFocused ? "bold" : "semibold"} color={isFocused ? C.orangeDark : C.muted}>{label}</Txt>
    </Pressable>
  );
}

export const tabBarStyle = { flexDirection: "row" as const, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, paddingHorizontal: 8 };
