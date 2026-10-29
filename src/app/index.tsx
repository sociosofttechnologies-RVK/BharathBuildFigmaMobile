// 01 · Splash
import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { BlueprintGrid, LOGO } from "@/components/brand";
import { Txt } from "@/components/ui";
import { C } from "@/theme";

export default function Splash() {
  const router = useRouter();
  const { loading, isVendor } = useAuth();
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => router.replace(isVendor ? "/vendor" : "/home"), 900);
    return () => clearTimeout(t);
  }, [loading, isVendor, router]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <BlueprintGrid />
      <View style={{ width: 320, paddingVertical: 18, paddingHorizontal: 10, backgroundColor: C.bg, borderRadius: 20, alignItems: "center" }}>
        <Image source={LOGO} style={{ width: 300, height: 87 }} contentFit="contain" accessibilityLabel="BharathBuild — Building India Together" />
      </View>
      <Txt size={15} color={C.body} center lh={1.5} style={{ marginTop: 28, maxWidth: 280 }}>
        India's B2B marketplace for builders, materials, labour and equipment.
      </Txt>
      <View style={{ marginTop: 36, width: 120, height: 4, borderRadius: 2, backgroundColor: C.border, overflow: "hidden" }}>
        <View style={{ width: 64, height: 4, borderRadius: 2, backgroundColor: C.orange }} />
      </View>
      <View style={{ position: "absolute", bottom: 44, left: 0, right: 0, alignItems: "center" }}>
        <Txt size={12} weight="semibold" color={C.muted} style={{ letterSpacing: 1.9, textTransform: "uppercase" }}>Made in India</Txt>
      </View>
    </View>
  );
}
