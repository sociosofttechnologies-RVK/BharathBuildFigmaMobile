// Buyer › Messages — the customer's enquiry threads
import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { C } from "@/theme";
import { EmptyState, Initial, PageHeader, Txt } from "@/components/ui";
import { getThreads, type LocalThread } from "@/lib/local";
import { refreshThread } from "@/lib/messaging";
import { useAuth } from "@/context/AuthContext";

const when = (iso: string) => {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const days = (now.getTime() - d.getTime()) / 864e5;
  return days < 7 ? d.toLocaleDateString("en-IN", { weekday: "short" }) : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function BuyerMessages() {
  const router = useRouter();
  const { user } = useAuth();
  const [threads, setThreads] = useState<LocalThread[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (pull = false) => {
    let t = (await getThreads()).filter((x) => x.messages.length > 0);
    if (pull) t = await Promise.all(t.map((x) => refreshThread(x).catch(() => x)));
    setThreads(t.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }, []);
  useFocusEffect(useCallback(() => { load(true); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <PageHeader title="Messages" subtitle="Your enquiries with vendors." />
      <FlatList
        data={threads}
        keyExtractor={(t) => t.threadId}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={C.orange} onRefresh={async () => { setRefreshing(true); await load(true); setRefreshing(false); }} />}
        ListEmptyComponent={
          <EmptyState icon={MessageSquare} title="No conversations yet"
            body={user ? "Find a vendor and tap Message to start an enquiry." : "Log in to message vendors directly."}
            action={user ? "Find vendors" : "Log in"} onAction={() => router.push(user ? "/search" : "/login")} />
        }
        renderItem={({ item: t }) => {
          const last = t.messages[t.messages.length - 1];
          return (
            <Pressable onPress={() => router.push({ pathname: "/chat/[listingId]", params: { listingId: t.listingId } })}
              style={({ pressed }) => [{ paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: pressed ? C.bg : C.white, borderBottomWidth: 1, borderBottomColor: C.divider }]}>
              <Initial name={t.vendorName} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Txt size={14} weight="bold" numberOfLines={1} style={{ flex: 1 }}>{t.vendorName}</Txt>
                  <Txt size={11} color={C.muted}>{when(last.created_at)}</Txt>
                </View>
                <Txt size={12} color={C.orangeDark} weight="semibold" numberOfLines={1}>{t.categoryLabel}</Txt>
                <Txt size={13} color={C.muted} numberOfLines={1} style={{ marginTop: 2 }}>{last.sender_type === "user" ? "You: " : ""}{last.body}</Txt>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
