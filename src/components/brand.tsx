import React from "react";
import { Alert, Linking, Platform, Pressable, Share, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";
import { useRouter } from "expo-router";
import {
  Briefcase, Building2, HardHat, Package, Paintbrush, PencilRuler, Truck, Users, Wrench,
  MessageSquare, Phone, Star, MapPin, type LucideIcon,
} from "lucide-react-native";
import { C, R, shadow } from "@/theme";
import { Badge, Button, Initial, Txt } from "@/components/ui";
import type { Listing } from "@/lib/listings";

export const LOGO = require("../../assets/images/bharathbuild-logo-full.png");
export const LOGO_MARK = require("../../assets/images/bharathbuild-logo.png");
export const HERO = require("../../assets/images/hero-construction.jpg");

export function Logo({ height = 38 }: { height?: number }) {
  // full lockup is ~3.5:1
  return <Image source={LOGO} style={{ height, width: height * 3.46 }} contentFit="contain" accessibilityLabel="BharathBuild — Building India Together" />;
}

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  builders: Building2,
  architects: PencilRuler,
  "interior-designers": Paintbrush,
  labourers: HardHat,
  "construction-materials": Package,
  "construction-vehicles": Truck,
  jobs: Briefcase,
  technicians: Wrench,
  "labour-agents": Users,
};

/* ---------- contact helpers ---------- */
export function callNumber(phone?: string | null) {
  if (!phone) return Alert.alert("No phone number", "This vendor hasn't shared a phone number. Send them a message instead.");
  Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`).catch(() => Alert.alert("Can't place a call", phone));
}
export function emailTo(email?: string | null, subject?: string) {
  if (!email) return;
  Linking.openURL(`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`).catch(() => Alert.alert("No mail app", email));
}
export function shareListing(l: Listing) {
  const url = `https://bharathbuild.com/listings/${l.id}`;
  Share.share(Platform.OS === "ios" ? { message: `${l.name} on BharathBuild`, url } : { message: `${l.name} — ${l.categoryLabel}, ${l.city}\n${url}` }).catch(() => {});
}

/* ---------- Listing card (Search results) ---------- */
export function ListingCard({ l, style }: { l: Listing; style?: ViewStyle }) {
  const router = useRouter();
  const open = () => router.push({ pathname: "/listing/[id]", params: { id: l.id } });
  const sub = l.subcategory ? `${l.categoryLabel} · ${l.subcategory.replace(/-/g, " ")}` : l.categoryLabel;
  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${l.name}, ${l.categoryLabel}, rated ${l.rating}`}
      style={[{ padding: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: R.lg }, shadow.soft, style]}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {l.images[0]
          ? <Image source={{ uri: l.images[0] }} style={{ width: 52, height: 52, borderRadius: 14 }} contentFit="cover" />
          : <Initial name={l.name} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Txt heading size={15} lh={1.3} style={{ flex: 1 }} numberOfLines={2}>{l.name}</Txt>
            <Badge kind="rating" label={l.rating.toFixed(1)} />
          </View>
          <Txt size={12} color={C.muted} style={{ marginTop: 2, textTransform: "capitalize" }} numberOfLines={1}>{sub}</Txt>
          <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MapPin size={13} color={C.body} />
            <Txt size={12} color={C.body} numberOfLines={1} style={{ flex: 1 }}>{l.location} · {l.experience} yrs exp</Txt>
          </View>
        </View>
      </View>
      <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {l.verified && <Badge kind="verified" />}
        {l.topRated && <Badge kind="top" />}
        {l.tags.slice(0, 2).map((t) => <Badge key={t} kind="neutral" label={t} />)}
      </View>
      <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
        <Button title="View Details" height={42} textSize={14} onPress={open} style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Call vendor" onPress={() => callNumber(l.contactPhone)} style={cardIconBtn}><Phone size={18} color={C.navy} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Message vendor" onPress={() => router.push({ pathname: "/chat/[listingId]", params: { listingId: l.id } })} style={cardIconBtn}><MessageSquare size={18} color={C.navy} /></Pressable>
      </View>
    </Pressable>
  );
}
const cardIconBtn: ViewStyle = { width: 44, height: 42, borderRadius: 11, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", backgroundColor: C.white };

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }} accessibilityLabel={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} color={C.orange} fill={i <= Math.round(value) ? C.orange : "transparent"} />)}
    </View>
  );
}

export function MiniVendor({ l }: { l: Listing }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push({ pathname: "/listing/[id]", params: { id: l.id } })}
      style={{ width: 200, padding: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14, flexDirection: "row", gap: 10, alignItems: "center" }}>
      <Initial name={l.name} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={13} weight="bold" numberOfLines={1}>{l.name}</Txt>
        <Txt size={12} color={C.muted} numberOfLines={1}>★ {l.rating.toFixed(1)} · {l.city}</Txt>
      </View>
    </Pressable>
  );
}

/** Faint blueprint grid background from the Splash / Subscription designs. */
export function BlueprintGrid({ color = C.navy, opacity = 0.05, size = 32, id = "grid" }: { color?: string; opacity?: number; size?: number; id?: string }) {
  return (
    <Svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" pointerEvents="none" aria-hidden>
      <Defs>
        <Pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <Line x1={0} y1={0} x2={size} y2={0} stroke={color} strokeOpacity={opacity} strokeWidth={1} />
          <Line x1={0} y1={0} x2={0} y2={size} stroke={color} strokeOpacity={opacity} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
