import "react-native-url-polyfill/auto";
import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
// Per-weight imports so only the six weights we use are bundled.
import { Montserrat_700Bold } from "@expo-google-fonts/montserrat/700Bold";
import { Montserrat_800ExtraBold } from "@expo-google-fonts/montserrat/800ExtraBold";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";
import { supabaseConfigError } from "@/lib/supabase";
import { Txt } from "@/components/ui";
import { C } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function RootLayout() {
  const [loaded, error] = useFonts({ Montserrat_700Bold, Montserrat_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync().catch(() => {}); }, [loaded, error]);
  if (!loaded && !error) return null;

  if (supabaseConfigError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: C.bg }}>
        <Txt heading size={18} center>App not configured</Txt>
        <Txt color={C.muted} center style={{ marginTop: 8 }}>{supabaseConfigError}</Txt>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SearchProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
              <Stack.Screen name="index" options={{ animation: "fade" }} />
              <Stack.Screen name="(buyer)" options={{ animation: "fade" }} />
              <Stack.Screen name="vendor" options={{ animation: "fade" }} />
              <Stack.Screen name="filters" options={{ presentation: "formSheet", sheetAllowedDetents: [0.85], sheetGrabberVisible: true, sheetCornerRadius: 24 }} />
              <Stack.Screen name="login" options={{ presentation: "modal" }} />
            </Stack>
          </SearchProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
