// 08 · Account
import React from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Building2, ChevronRight, FileText, Heart, Info, LayoutDashboard, LogOut, MessageSquare, Pencil, Phone, Settings, Store } from "lucide-react-native";
import { C, R, shadow } from "@/theme";
import { Badge, Button, IconButton, Txt } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { businessStatus } from "@/lib/business";

type Item = { label: string; icon: typeof Info; href: string };

export default function Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, displayName, isVendor, signOut } = useAuth();
  const pending = businessStatus(user?.user_metadata) === "pending" && !isVendor;

  const acct: Item[] = [
    { label: "Account Settings", icon: Settings, href: "/account-settings" },
    { label: "Saved vendors", icon: Heart, href: "/saved" },
    { label: "My enquiries", icon: MessageSquare, href: "/messages" },
  ];
  const support: Item[] = [
    { label: "About Us", icon: Info, href: "/about" },
    { label: "Contact Us", icon: Phone, href: "/contact" },
    { label: "Terms & Privacy", icon: FileText, href: "/terms" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingTop: insets.top + 22, paddingHorizontal: 16, paddingBottom: 54, backgroundColor: C.navy }}>
          <Txt heading size={20} color={C.white} style={{ marginBottom: 16 }}>Account</Txt>
          {user ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }}>
                <Txt heading="xb" size={24} color={C.white}>{displayName[0]?.toUpperCase()}</Txt>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt size={17} weight="bold" color={C.white} numberOfLines={1}>{displayName}</Txt>
                <Txt size={13} color={C.navyMuted} numberOfLines={1} style={{ marginTop: 2 }}>{user.email ?? user.phone}</Txt>
              </View>
              <IconButton icon={Pencil} label="Edit profile" color={C.white} style={{ backgroundColor: "rgba(255,255,255,0.12)" }} onPress={() => router.push("/account-settings")} />
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Txt size={13} color={C.navyMuted}>Log in to contact vendors and manage your business.</Txt>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button title="Login" style={{ flex: 1 }} height={46} onPress={() => router.push("/login")} />
                <Button title="Sign Up" variant="outline" style={{ flex: 1 }} height={46} onPress={() => router.push({ pathname: "/login", params: { mode: "signup" } })} />
              </View>
            </View>
          )}
        </View>

        {isVendor ? (
          <Banner icon={LayoutDashboard} title="Business dashboard" body="Manage your ads, leads and messages" onPress={() => router.push("/vendor")} />
        ) : pending ? (
          <Banner icon={Store} title="Application in review" body="We'll unlock your business dashboard once approved" badge onPress={() => router.push("/become-business")} />
        ) : (
          <Banner icon={Building2} title="Become a Business" body="List your services and get leads across India"
            onPress={() => router.push(user ? "/become-business" : { pathname: "/login", params: { mode: "signup", next: "/become-business" } })} />
        )}

        <Group title="My account" items={user ? acct : acct.slice(1)} />
        <Group title="Support" items={support} />

        {user && (
          <Pressable accessibilityRole="button" onPress={() => Alert.alert("Log out?", "", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: "destructive", onPress: () => signOut() }])}
            style={{ marginTop: 18, marginHorizontal: 16, height: 50, borderRadius: 14, borderWidth: 1, borderColor: "#F3C4C0", backgroundColor: C.white, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <LogOut size={18} color={C.danger} />
            <Txt weight="bold" color={C.danger}>Logout</Txt>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function Banner({ icon, title, body, onPress, badge }: { icon: typeof Info; title: string; body: string; onPress: () => void; badge?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [{ marginTop: -34, marginHorizontal: 16, padding: 16, borderRadius: R.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", gap: 12 }, shadow.card, pressed && { backgroundColor: C.bg }]}>
      <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }}>
        {React.createElement(icon, { size: 22, color: C.white })}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Txt weight="bold" size={15}>{title}</Txt>
          {badge && <Badge kind="pending" h={20} />}
        </View>
        <Txt size={12} color={C.muted} style={{ marginTop: 2 }}>{body}</Txt>
      </View>
      <ChevronRight size={18} color={C.muted} />
    </Pressable>
  );
}

function Group({ title, items }: { title: string; items: Item[] }) {
  const router = useRouter();
  return (
    <View>
      <Txt size={12} weight="bold" color={C.muted} style={{ marginTop: 22, marginBottom: 8, marginHorizontal: 16, letterSpacing: 0.8, textTransform: "uppercase" }}>{title}</Txt>
      <View style={{ marginHorizontal: 16, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, overflow: "hidden" }}>
        {items.map((m, i) => (
          <Pressable key={m.label} accessibilityRole="button" onPress={() => router.push(m.href)}
            style={({ pressed }) => [{ minHeight: 56, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.divider }, pressed && { backgroundColor: C.bg }]}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.chip, alignItems: "center", justifyContent: "center" }}>{React.createElement(m.icon, { size: 17, color: C.navy })}</View>
            <Txt size={15} weight="semibold" style={{ flex: 1 }}>{m.label}</Txt>
            <ChevronRight size={18} color={C.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
