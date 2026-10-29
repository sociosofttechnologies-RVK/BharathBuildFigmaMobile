// Vendor › Portfolio (PDF/brochure per ad, stored in the "portfolios" bucket like the web app)
import React, { useState } from "react";
import { Alert, FlatList, Linking, Pressable, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { ChevronDown, FileText, Trash2, Upload } from "lucide-react-native";
import { C, R } from "@/theme";
import { Button, Card, EmptyState, IconButton, Loading, ScreenHeader, SelectField, Txt } from "@/components/ui";
import { PickerSheet } from "@/components/PickerSheet";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { getVendorAds } from "@/lib/ads";

const BUCKET = "portfolios";
const MAX_MB = 10;

export default function Portfolio() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const ads = useQuery({ queryKey: ["vendorAds", uid], queryFn: () => getVendorAds(uid) });
  const files = useQuery({
    queryKey: ["portfolioFiles", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_files").select("id,name,file_path,size_bytes,listing_id,created_at").eq("vendor_id", uid).order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const [listingId, setListingId] = useState("");
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const adName = (id: string) => ads.data?.find((a) => a.id === id)?.name ?? "Ad";

  const upload = async () => {
    if (!listingId) return Alert.alert("Choose an ad", "Pick which ad this portfolio belongs to.");
    const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (res.canceled) return;
    const f = res.assets[0];
    if ((f.size ?? 0) > MAX_MB * 1024 * 1024) return Alert.alert("File too large", `Keep it under ${MAX_MB} MB.`);
    setBusy(true);
    try {
      const path = `${uid}/${listingId}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const buf = await (await fetch(f.uri)).arrayBuffer();
      const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: "application/pdf" });
      if (error) throw error;
      const { error: e2 } = await supabase.from("portfolio_files").insert({ vendor_id: uid, listing_id: listingId, name: f.name, file_path: path, size_bytes: f.size ?? buf.byteLength });
      if (e2) throw e2;
      qc.invalidateQueries({ queryKey: ["portfolioFiles", uid] });
    } catch (e) { Alert.alert("Upload failed", (e as Error).message); }
    finally { setBusy(false); }
  };

  const open = async (path: string) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
    if (data?.signedUrl) Linking.openURL(data.signedUrl);
  };
  const remove = (id: string, path: string) => Alert.alert("Remove this file?", "", [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: async () => {
      await supabase.storage.from(BUCKET).remove([path]);
      const { error } = await supabase.from("portfolio_files").delete().eq("id", id);
      if (error) Alert.alert("Couldn't remove", error.message);
      qc.invalidateQueries({ queryKey: ["portfolioFiles", uid] });
    } },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Portfolio" />
      <FlatList
        data={files.data ?? []}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <Card style={{ gap: 12, marginBottom: 6 }}>
            <Txt heading size={15}>Upload a portfolio</Txt>
            <Txt size={12} color={C.muted}>A PDF brochure or past-projects deck. Buyers open it from your ad's Portfolio button.</Txt>
            <SelectField label="For ad" value={listingId ? adName(listingId) : ""} placeholder="Choose an ad" onPress={() => setPick(true)} right={<ChevronDown size={16} color={C.muted} />} />
            <Button title="Choose PDF" icon={Upload} loading={busy} onPress={upload} />
          </Card>
        }
        ListEmptyComponent={files.isLoading ? <Loading /> : <EmptyState icon={FileText} title="No files yet" body="Upload a PDF to show buyers your past work." />}
        renderItem={({ item: f }) => (
          <Pressable onPress={() => open(f.file_path)} style={{ padding: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.orangeTint, alignItems: "center", justifyContent: "center" }}><FileText size={20} color={C.orange} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="bold" numberOfLines={1}>{f.name}</Txt>
              <Txt size={12} color={C.muted} numberOfLines={1}>{adName(f.listing_id)} · {(f.size_bytes / 1024 / 1024).toFixed(1)} MB</Txt>
            </View>
            <IconButton icon={Trash2} label="Remove file" color={C.danger} onPress={() => remove(f.id, f.file_path)} />
          </Pressable>
        )}
      />
      <PickerSheet visible={pick} title="Choose an ad" value={listingId} options={(ads.data ?? []).map((a) => ({ value: a.id, label: a.name }))} onSelect={setListingId} onClose={() => setPick(false)} />
    </View>
  );
}
