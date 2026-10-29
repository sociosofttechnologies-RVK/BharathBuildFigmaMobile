import React from "react";
import { ScrollView, View } from "react-native";
import { BadgeCheck, MessageCircle, Network, Star } from "lucide-react-native";
import { C } from "@/theme";
import { Card, IconTile, ScreenHeader, Txt } from "@/components/ui";
import { Logo } from "@/components/brand";

const POINTS = [
  [BadgeCheck, "Verified vendors", "Every business is reviewed before it can list."],
  [Network, "Pan-India network", "Builders, materials, labour and vehicles from metros to tier-3 towns."],
  [MessageCircle, "Direct contact", "Call or message vendors yourself — no middlemen."],
  [Star, "Genuine reviews", "Ratings come from buyers who worked with the vendor."],
] as const;

export default function About() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="About Us" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
        <Card style={{ alignItems: "center", gap: 12 }}>
          <Logo height={48} />
          <Txt size={14} color={C.body} lh={1.55} center>
            BharathBuild is India's B2B marketplace for construction — helping buyers find verified builders, architects,
            materials, labour and equipment, and helping vendors grow with direct enquiries.
          </Txt>
        </Card>
        {POINTS.map(([Icon, t, d]) => (
          <Card key={t} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <IconTile icon={Icon} size={40} iconSize={20} />
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={15}>{t}</Txt>
              <Txt size={13} color={C.muted} lh={1.45} style={{ marginTop: 3 }}>{d}</Txt>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
