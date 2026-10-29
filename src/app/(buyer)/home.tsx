// 03 · Home
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ArrowRight, BadgeCheck, Bell, ChevronDown, LayoutGrid, MapPin, MessageCircle, Network, Package, Search, ShieldCheck, Star, Phone } from "lucide-react-native";
import { C, F, R, shadow } from "@/theme";
import { Button, H2, IconButton, IconTile, SectionTitle, Txt } from "@/components/ui";
import { CATEGORY_ICON, HERO, Logo } from "@/components/brand";
import { CITIES, PickerSheet } from "@/components/PickerSheet";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filters, set } = useSearch();
  const { user, displayName } = useAuth();
  const [picker, setPicker] = useState<"city" | "category" | null>(null);
  const [keyword, setKeyword] = useState(filters.keyword);

  const go = (patch: Partial<typeof filters> = {}) => { set({ keyword: keyword.trim(), ...patch }); router.push("/search"); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[st.header, { paddingTop: insets.top }]}>
        <Logo height={38} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <IconButton icon={Bell} label="Notifications" onPress={() => router.push("/notifications")} />
          <Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={() => router.push(user ? "/account" : "/login")}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }}>
            <Txt weight="bold" color={C.white}>{user ? displayName[0]?.toUpperCase() : "?"}</Txt>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 20 }}>
          <Image source={HERO} style={st.heroImg} contentFit="cover" contentPosition={{ left: "60%", top: "50%" }} />
          <Svg style={st.heroImg} width="100%" height={302} aria-hidden>
            <Defs>
              <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={C.bg} stopOpacity={0.82} />
                <Stop offset="0.55" stopColor={C.bg} stopOpacity={0.7} />
                <Stop offset="1" stopColor={C.bg} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height={302} fill="url(#fade)" />
          </Svg>

          <Txt size={12} weight="bold" color={C.orangeDark} style={{ letterSpacing: 1.7, textTransform: "uppercase", marginBottom: 8 }}>Building India Together</Txt>
          <Txt heading="xb" size={28} lh={1.18}>India's Leading <Txt heading="xb" size={28} color={C.orange}>B2B Platform</Txt> for Construction Needs</Txt>
          <Txt size={14} color={C.body} lh={1.5} style={{ marginTop: 10 }}>Source verified builders, architects, materials, labour and vehicles — from one trusted pan-India network.</Txt>

          <View style={[st.form, shadow.card]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Location: ${filters.location || "All India"}. Change`} onPress={() => setPicker("city")} style={[st.inputRow, { backgroundColor: C.bg }]}>
              <MapPin size={18} color={C.orange} />
              <Txt size={15} weight="semibold" style={{ flex: 1 }}>{filters.location || "All India"}</Txt>
              <Txt size={12} weight="semibold" color={C.orangeDark}>Change</Txt>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Category" onPress={() => setPicker("category")} style={st.inputRow}>
              <LayoutGrid size={18} color={C.muted} />
              <Txt size={14} color={filters.category ? C.navy : C.muted} weight={filters.category ? "semibold" : "regular"} style={{ flex: 1 }}>{filters.category ? categoryLabel(filters.category) : "All Categories"}</Txt>
              <ChevronDown size={16} color={C.muted} />
            </Pressable>
            <View style={st.inputRow}>
              <Search size={18} color={C.muted} />
              <TextInput value={keyword} onChangeText={setKeyword} placeholder="Search cement, crane, plumber…" placeholderTextColor={C.muted}
                returnKeyType="search" onSubmitEditing={() => go()} accessibilityLabel="Keyword"
                style={{ flex: 1, fontFamily: F.regular, fontSize: 15, color: C.navy, paddingVertical: 12 }} />
            </View>
            <Button title="Search" icon={Search} onPress={() => go()} textSize={16} />
          </View>

          <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between" }}>
            <Trust icon={ShieldCheck} text="Verified vendors" />
            <Trust icon={Package} text="10,000+ listings" />
            <Trust icon={Phone} text="Direct contact" />
          </View>
        </View>

        {/* Featured categories */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <SectionTitle title="Featured Categories" action="See all" onAction={() => go({ category: "" })} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.key} accessibilityRole="button" onPress={() => go({ category: c.key })}
                style={({ pressed }) => [st.catTile, pressed && { backgroundColor: C.bg }]}>
                <IconTile icon={CATEGORY_ICON[c.key] ?? LayoutGrid} />
                <Txt size={12} weight="semibold" center lh={1.25}>{c.label}</Txt>
              </Pressable>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={{ paddingHorizontal: 16, paddingTop: 28 }}>
          <H2 size={19} style={{ marginBottom: 4 }}>How It Works</H2>
          <Txt size={13} color={C.muted} style={{ marginBottom: 14 }}>Find what you need in three simple steps.</Txt>
          <View style={{ gap: 10 }}>
            {[
              ["Search", "Enter your location, pick a category and add a keyword."],
              ["Connect", "Browse verified vendor profiles and contact them directly."],
              ["Build", "Negotiate, finalise and get your requirements fulfilled with confidence."],
            ].map(([t, d], i) => (
              <View key={t} style={st.step}>
                <View style={st.stepNum}><Txt heading="xb" size={14} color={C.white}>{i + 1}</Txt></View>
                <View style={{ flex: 1 }}>
                  <Txt size={15} weight="bold">{t}</Txt>
                  <Txt size={13} color={C.muted} lh={1.45} style={{ marginTop: 3 }}>{d}</Txt>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Why */}
        <View style={{ paddingHorizontal: 16, paddingTop: 28 }}>
          <H2 size={19} style={{ marginBottom: 14 }}>Why BharathBuild?</H2>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {([
              [BadgeCheck, "Verified Vendors", "Connect only with trusted partners."],
              [Network, "Pan-India Network", "From metros to tier-3 towns."],
              [MessageCircle, "Direct Contact", "No middlemen, best deals."],
              [Star, "Ratings & Reviews", "Genuine reviews from real buyers."],
            ] as const).map(([Icon, t, d]) => (
              <View key={t} style={st.why}>
                <IconTile icon={Icon} size={34} iconSize={18} />
                <Txt size={14} weight="bold" style={{ marginTop: 10, marginBottom: 2 }}>{t}</Txt>
                <Txt size={12} color={C.muted} lh={1.4}>{d}</Txt>
              </View>
            ))}
          </View>

          <View style={st.cta}>
            <Txt heading size={20} lh={1.25} color={C.white}>Ready to grow your construction business?</Txt>
            <Txt size={13} lh={1.45} color={C.navyMuted}>Join thousands of vendors and buyers building India together.</Txt>
            <Pressable accessibilityRole="button" onPress={() => router.push(user ? "/become-business" : { pathname: "/login", params: { mode: "signup", next: "/become-business" } })}
              style={({ pressed }) => [st.ctaBtn, pressed && { opacity: 0.85 }]}>
              <Txt weight="bold" size={15} color={C.white}>Get Started Free</Txt>
              <ArrowRight size={18} color={C.white} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <PickerSheet visible={picker === "city"} title="Choose location" searchable allowCustom value={filters.location}
        options={[{ value: "", label: "All India" }, ...CITIES.map((c) => ({ value: c, label: c }))]}
        onSelect={(v) => set({ location: v })} onClose={() => setPicker(null)} />
      <PickerSheet visible={picker === "category"} title="Category" value={filters.category}
        options={[{ value: "", label: "All Categories" }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
        onSelect={(v) => set({ category: v })} onClose={() => setPicker(null)} />
    </View>
  );
}

function Trust({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Icon size={14} color={C.greenIcon} />
      <Txt size={12} weight="semibold" color={C.body}>{text}</Txt>
    </View>
  );
}

const st = StyleSheet.create({
  header: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 64 },
  heroImg: { position: "absolute", left: 0, top: 0, right: 0, width: "100%", height: 302 },
  form: { marginTop: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: R.xl, padding: 14, gap: 10 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, borderRadius: R.md },
  catTile: { width: "31.4%", flexGrow: 1, alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 6, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14 },
  step: { flexDirection: "row", gap: 14, alignItems: "flex-start", padding: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14 },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  why: { width: "48%", flexGrow: 1, padding: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14 },
  cta: { marginTop: 20, paddingVertical: 22, paddingHorizontal: 20, borderRadius: R.xl, backgroundColor: C.navy, gap: 10 },
  ctaBtn: { marginTop: 4, alignSelf: "flex-start", height: 46, paddingHorizontal: 20, borderRadius: R.md, backgroundColor: C.orange, flexDirection: "row", alignItems: "center", gap: 8 },
});
