// Shared conversation UI (07 · Message vendor, and the vendor's thread view).
import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeCheck, ChevronLeft, Phone, SendHorizontal } from "lucide-react-native";
import { C, F, R, shadow } from "@/theme";
import { IconButton, Initial, Txt } from "@/components/ui";
import { callNumber } from "@/components/brand";

export type ChatMsg = { id: string; body: string; created_at: string; mine: boolean; seen?: boolean };

const MAX = 500;
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
function dayLabel(iso: string) {
  const d = new Date(iso), now = new Date();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "TODAY";
  if (d.toDateString() === y.toDateString()) return "YESTERDAY";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" }).toUpperCase();
}

export function ChatView({ title, subtitle, verified, phone, context, messages, onSend, sending, emptyHint, roundAvatar }: {
  title: string; subtitle?: string; verified?: boolean; phone?: string | null;
  context?: { image?: string; label: string; onView: () => void };
  messages: ChatMsg[]; onSend: (text: string) => Promise<void>; sending?: boolean; emptyHint?: string; roundAvatar?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const list = useRef<FlatList>(null);
  useEffect(() => { setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50); }, [messages.length]);

  // Insert day separators
  const rows: ({ kind: "day"; id: string; label: string } | ({ kind: "msg" } & ChatMsg))[] = [];
  let last = "";
  for (const m of messages) {
    const lbl = dayLabel(m.created_at);
    if (lbl !== last) { rows.push({ kind: "day", id: `d-${m.id}`, label: lbl }); last = lbl; }
    rows.push({ kind: "msg", ...m });
  }

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    try { await onSend(t); setText(""); } catch { /* keep the draft so the user can retry */ }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingTop: insets.top + 10, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <IconButton icon={ChevronLeft} label="Back" size={22} onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))} />
        <Initial name={title} size={40} round={roundAvatar} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={15} weight="bold" numberOfLines={1}>{title}</Txt>
          {verified ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 }}>
              <BadgeCheck size={13} color={C.green} />
              <Txt size={12} weight="semibold" color={C.green}>Verified vendor</Txt>
            </View>
          ) : subtitle ? <Txt size={12} color={C.muted} numberOfLines={1}>{subtitle}</Txt> : null}
        </View>
        {phone !== undefined && (
          <Pressable accessibilityRole="button" accessibilityLabel="Call" onPress={() => callNumber(phone)}
            style={{ width: 44, height: 44, borderRadius: R.md, backgroundColor: C.orangeTint, alignItems: "center", justifyContent: "center" }}>
            <Phone size={19} color={C.orange} />
          </Pressable>
        )}
      </View>

      <FlatList
        ref={list}
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingTop: 14, gap: 12, flexGrow: 1 }}
        ListHeaderComponent={context ? (
          <View style={{ padding: 10, paddingHorizontal: 12, borderRadius: R.md, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, flexDirection: "row", gap: 10, alignItems: "center" }}>
            {context.image ? <Image source={{ uri: context.image }} style={{ width: 44, height: 44, borderRadius: 8 }} contentFit="cover" /> : <Initial name={context.label} size={44} />}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt size={12} color={C.muted}>Enquiry about</Txt>
              <Txt size={13} weight="bold" numberOfLines={1} style={{ marginTop: 1 }}>{context.label}</Txt>
            </View>
            <Pressable onPress={context.onView} hitSlop={10} accessibilityRole="link"><Txt size={12} weight="bold" color={C.orangeDark}>View</Txt></Pressable>
          </View>
        ) : undefined}
        ListEmptyComponent={emptyHint ? <Txt size={13} color={C.muted} center style={{ marginTop: 24 }}>{emptyHint}</Txt> : undefined}
        renderItem={({ item, index }) => {
          if (item.kind === "day") return <Txt size={11} weight="semibold" color={C.muted} center style={{ letterSpacing: 0.5 }}>{item.label}</Txt>;
          const lastMine = item.mine && rows.slice(index + 1).every((r) => r.kind !== "msg" || !r.mine);
          return (
            <View style={{ alignSelf: item.mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <View style={[{ paddingVertical: 10, paddingHorizontal: 13 },
                item.mine ? { backgroundColor: C.orange, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 }
                  : { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 }]}>
                <Txt size={14} lh={1.45} color={item.mine ? C.white : C.navy}>{item.body}</Txt>
              </View>
              <Txt size={11} color={C.muted} style={{ marginTop: 4, marginHorizontal: 4, textAlign: item.mine ? "right" : "left" }}>
                {time(item.created_at)}{lastMine && item.seen ? " · Seen" : ""}
              </Txt>
            </View>
          );
        }}
      />

      <View style={{ paddingTop: 10, paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 12) + 6, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border, borderRadius: 16, backgroundColor: C.bg }}>
            <TextInput value={text} onChangeText={(t) => setText(t.slice(0, MAX))} placeholder="Type your message..." placeholderTextColor={C.muted}
              multiline accessibilityLabel="Message" style={{ minHeight: 40, maxHeight: 120, fontFamily: F.regular, fontSize: 14, color: C.navy, padding: 0, textAlignVertical: "top" }} />
            <Txt size={11} color={C.muted} style={{ alignSelf: "flex-end" }}>{MAX - text.length} characters left</Txt>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={send} disabled={!text.trim() || sending}
            style={[{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" }, shadow.orange, (!text.trim() || sending) && { opacity: 0.6 }]}>
            <SendHorizontal size={20} color={C.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
