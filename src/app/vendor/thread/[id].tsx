// Vendor › conversation with a buyer
import React, { useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatView } from "@/components/ChatView";
import { useAuth } from "@/context/AuthContext";
import { getVendorMessages, markThreadRead, vendorReply } from "@/lib/vendor";
import { getVendorAds } from "@/lib/ads";

export default function VendorThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user!.id;
  const msgs = useQuery({ queryKey: ["vendorMessages", uid], queryFn: () => getVendorMessages(uid), refetchInterval: 10_000 });
  const ads = useQuery({ queryKey: ["vendorAds", uid], queryFn: () => getVendorAds(uid) });
  const rows = useMemo(() => (msgs.data ?? []).filter((m) => m.thread_id === id), [msgs.data, id]);
  const first = rows[0];
  const ad = ads.data?.find((a) => a.id === first?.listing_id);
  const unread = rows.some((m) => m.sender_type === "user" && !m.vendor_read);

  useEffect(() => {
    if (!unread) return;
    markThreadRead(uid, id!).then(() => { qc.invalidateQueries({ queryKey: ["vendorMessages", uid] }); qc.invalidateQueries({ queryKey: ["vendorStats", uid] }); });
  }, [unread, uid, id, qc]);

  const reply = useMutation({
    mutationFn: (text: string) => vendorReply(uid, id!, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendorMessages", uid] }),
  });

  const name = rows.find((m) => m.user_name)?.user_name ?? "Customer";
  return (
    <ChatView
      title={name}
      subtitle={first?.user_phone ?? undefined}
      phone={first?.user_phone ?? null}
      roundAvatar
      context={ad ? { image: ad.images?.[0], label: ad.name, onView: () => router.push({ pathname: "/listing/[id]", params: { id: ad.id } }) } : undefined}
      messages={rows.map((m) => ({ id: m.id, body: m.body, created_at: m.created_at, mine: m.sender_type === "vendor" }))}
      sending={reply.isPending}
      onSend={async (text) => {
        try { await reply.mutateAsync(text); }
        catch (e) { Alert.alert("Reply not sent", (e as Error).message); throw e; }
      }}
    />
  );
}
