// 10 · Contact us
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View } from "react-native";
import { Mail, MapPin, Phone, Send } from "lucide-react-native";
import { C } from "@/theme";
import { Button, Card, Field, IconTile, ScreenHeader, Txt } from "@/components/ui";
import { SUPPORT } from "@/config";
import { useAuth } from "@/context/AuthContext";

export default function Contact() {
  const { user, displayName } = useAuth();
  const [name, setName] = useState(user ? displayName : "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [msg, setMsg] = useState("");

  const send = async () => {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || msg.trim().length < 5) return Alert.alert("Almost there", "Add your name, a valid email and a short message.");
    const body = `${msg.trim()}\n\n— ${name.trim()} (${email.trim()})`;
    const url = `mailto:${SUPPORT.email}?subject=${encodeURIComponent("BharathBuild app enquiry")}&body=${encodeURIComponent(body)}`;
    try { await Linking.openURL(url); setMsg(""); }
    catch { Alert.alert("No mail app found", `Write to us at ${SUPPORT.email}`); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Contact Us" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
          <Txt heading="xb" size={22}>How can we help?</Txt>
          <Txt size={14} color={C.muted} lh={1.5} style={{ marginTop: 6 }}>Reach our team for support, partnerships or general enquiries.</Txt>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, flexDirection: "row", gap: 8 }}>
          <Tile icon={Phone} title="Call" sub={SUPPORT.phone} onPress={() => Linking.openURL(`tel:${SUPPORT.phone.replace(/\s/g, "")}`)} />
          <Tile icon={Mail} title="Email" sub={SUPPORT.email} onPress={() => Linking.openURL(`mailto:${SUPPORT.email}`)} />
          <Tile icon={MapPin} title="Visit" sub={SUPPORT.address} onPress={() => Linking.openURL(Platform.OS === "ios" ? `maps:?q=${encodeURIComponent(SUPPORT.mapsQuery)}` : `geo:0,0?q=${encodeURIComponent(SUPPORT.mapsQuery)}`)} />
        </View>
        <Card style={{ marginTop: 16, marginHorizontal: 16, gap: 12 }}>
          <Txt heading size={16}>Send us a message</Txt>
          <Field label="Full Name" placeholder="Your name" value={name} onChangeText={setName} autoComplete="name" />
          <Field label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Message" placeholder="How can we help?" value={msg} onChangeText={setMsg} multiline style={{ minHeight: 90 }} maxLength={2000} />
          <Button title="Send Message" icon={Send} onPress={send} textSize={16} />
          <Txt size={12} color={C.muted} center>We reply within 24 hours.</Txt>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Tile({ icon, title, sub, onPress }: { icon: typeof Phone; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${sub}`} onPress={onPress}
      style={({ pressed }) => [{ flex: 1, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 14, backgroundColor: pressed ? C.bg : C.white, borderWidth: 1, borderColor: C.border, alignItems: "center", gap: 8 }]}>
      <IconTile icon={icon} size={40} iconSize={20} />
      <Txt size={13} weight="bold">{title}</Txt>
      <Txt size={11} color={C.muted} center numberOfLines={2}>{sub}</Txt>
    </Pressable>
  );
}
