// Everything under /vendor requires a signed-in vendor (RLS still enforces access server-side).
import React from "react";
import { View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { Loading } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { C } from "@/theme";

export default function VendorLayout() {
  const { user, isVendor, isAdmin, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, paddingTop: 80, backgroundColor: C.bg }}><Loading /></View>;
  if (!user) return <Redirect href={{ pathname: "/login", params: { next: "/vendor" } }} />;
  if (!isVendor && !isAdmin) return <Redirect href="/become-business" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ad-editor" options={{ presentation: "modal" }} />
    </Stack>
  );
}
