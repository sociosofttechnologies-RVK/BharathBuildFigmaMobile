// 07 · Message vendor (customer side)
import React, { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChatView } from "@/components/ChatView";
import { ErrorBox, Loading } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getListing } from "@/lib/listings";
import { getOrCreateThread, refreshThread, sendCustomerMessage } from "@/lib/messaging";
import type { LocalThread } from "@/lib/local";
import { subLabel } from "@/lib/adFields";

export default function CustomerChat() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const { user, loading, displayName, profile } = useAuth();
  const q = useQuery({ queryKey: ["listing", listingId], queryFn: () => getListing(listingId!), enabled: !!listingId && !!user });
  const [thread, setThread] = useState<LocalThread | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!q.data) return;
    getOrCreateThread(q.data.listing, { name: displayName, phone: profile?.phone ?? user?.phone ?? "" }).then(setThread);
  }, [q.data, displayName, profile, user]);

  // poll for vendor replies while open (same 10s cadence as the web)
  useFocusEffect(useCallback(() => {
    if (!thread?.messages.length) return;
    const tick = () => refreshThread(thread).then((t) => t.messages.length !== thread.messages.length && setThread(t)).catch(() => {});
    tick();
    const i = setInterval(tick, 10_000);
    return () => clearInterval(i);
  }, [thread]));

  if (!loading && !user) return <Redirect href={{ pathname: "/login", params: { next: `/chat/${listingId}` } }} />;
  if (q.isLoading || !thread) return <View style={{ flex: 1, paddingTop: 60 }}><Loading /></View>;
  if (q.error || !q.data) return <ErrorBox message={(q.error as Error)?.message ?? "Vendor not found"} />;
  const l = q.data.listing;

  return (
    <ChatView
      title={l.name}
      verified={l.verified}
      subtitle={l.categoryLabel}
      phone={l.contactPhone}
      context={{ image: l.images[0], label: [l.subcategory ? subLabel(l.category, l.subcategory) : l.tags[0], l.categoryLabel].filter(Boolean).join(" · "), onView: () => router.push({ pathname: "/listing/[id]", params: { id: l.id } }) }}
      messages={thread.messages.map((m) => ({ id: m.id, body: m.body, created_at: m.created_at, mine: m.sender_type === "user" }))}
      sending={sending}
      emptyHint={`Say hello to ${l.name}. Share your location, plot size or quantity so they can quote quickly.`}
      onSend={async (text) => {
        setSending(true);
        try { setThread(await sendCustomerMessage(thread, text)); }
        catch (e) { Alert.alert("Message not sent", (e as Error).message); throw e; }
        finally { setSending(false); }
      }}
    />
  );
}
