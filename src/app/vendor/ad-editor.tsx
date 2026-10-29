// 13 · Create new ad (also edits an existing ad when opened with ?id=)
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, ImagePlus, X } from "lucide-react-native";
import { C, R } from "@/theme";
import { Button, Card, Field, IconButton, Loading, SelectField, Txt } from "@/components/ui";
import { CITIES, PickerSheet } from "@/components/PickerSheet";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { AD_FIELDS, subLabel, type SpecField } from "@/lib/adFields";
import { emptyDraft, loadAd, MAX_PHOTOS, saveAd, uploadAdPhoto, validateAd, type AdDraft } from "@/lib/ads";
import { useAuth } from "@/context/AuthContext";

export default function AdEditor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const uid = user?.id;
  const [d, setD] = useState<AdDraft>(emptyDraft());
  const [errors, setErrors] = useState<Partial<Record<keyof AdDraft, string>>>({});
  const [loading, setLoading] = useState(!!id);
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState<"draft" | "active" | "preview" | null>(null);
  const [picker, setPicker] = useState<"category" | "sub" | "city" | null>(null);

  useEffect(() => {
    if (!id) return;
    loadAd(id).then((a) => setD(a)).catch((e) => Alert.alert("Couldn't load ad", e.message)).finally(() => setLoading(false));
  }, [id]);

  const up = <K extends keyof AdDraft>(k: K, v: AdDraft[K]) => { setD((x) => ({ ...x, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })); };
  const subs = AD_FIELDS[d.category] ?? [];
  const specs: SpecField[] = subs.find((s) => s.slug === d.subcategory)?.specs ?? [];
  const setAttr = (k: string, v: string) => setD((x) => ({ ...x, attributes: { ...x.attributes, [k]: v } }));

  const addPhotos = async () => {
    if (!uid) return;
    const left = MAX_PHOTOS - d.images.length;
    if (left <= 0) return Alert.alert("Photo limit reached", `You can add up to ${MAX_PHOTOS} photos.`);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: left, quality: 0.7 });
    if (res.canceled) return;
    setUploading(res.assets.length);
    for (const a of res.assets.slice(0, left)) {
      try {
        const url = await uploadAdPhoto(uid, a.uri, a.mimeType ?? "image/jpeg");
        setD((x) => ({ ...x, images: [...x.images, url] }));
      } catch (e) { Alert.alert("Upload failed", (e as Error).message); break; }
      finally { setUploading((n) => Math.max(0, n - 1)); }
    }
  };
  const photoActions = (i: number) => Alert.alert(`Photo ${i + 1}`, undefined, [
    ...(i > 0 ? [{ text: "Make cover", onPress: () => setD((x) => ({ ...x, images: [x.images[i], ...x.images.filter((_, j) => j !== i)] })) }] : []),
    { text: "Remove", style: "destructive" as const, onPress: () => setD((x) => ({ ...x, images: x.images.filter((_, j) => j !== i) })) },
    { text: "Cancel", style: "cancel" as const },
  ]);

  const save = async (mode: "draft" | "active" | "preview") => {
    if (!uid) return;
    if (mode !== "draft") {
      const e = validateAd(d);
      setErrors(e);
      if (Object.keys(e).length) return Alert.alert("Check the form", "Fill in the required fields marked *.");
      if (mode === "active" && d.images.length === 0) return Alert.alert("Add a photo", "Ads with photos get far more enquiries. Add at least one.");
    } else if (!d.name.trim() || !d.category) {
      return Alert.alert("Add a name and category", "A draft needs at least a name and category.");
    }
    setSaving(mode);
    try {
      const saved = await saveAd(uid, { ...d, city: d.city || "—", location: d.location || "—" }, { id, status: mode === "active" ? "active" : "draft" });
      qc.invalidateQueries({ queryKey: ["vendorAds", uid] });
      qc.invalidateQueries({ queryKey: ["vendorStats", uid] });
      qc.invalidateQueries({ queryKey: ["listing", saved] });
      if (mode === "preview") router.replace({ pathname: "/listing/[id]", params: { id: saved } });
      else {
        Alert.alert(mode === "active" ? "Ad published" : "Draft saved", mode === "active" ? "Your ad will be visible to buyers once approved." : "You can finish it later from My Ads.");
        router.back();
      }
    } catch (e) { Alert.alert("Couldn't save", (e as Error).message); }
    finally { setSaving(null); }
  };

  if (loading) return <View style={{ flex: 1, paddingTop: insets.top + 40 }}><Loading /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingTop: Platform.OS === "ios" ? 10 : insets.top + 10, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <IconButton icon={X} label="Close" onPress={() => router.back()} />
        <Txt heading size={18} style={{ flex: 1 }}>{id ? "Edit Ad" : "Create New Ad"}</Txt>
        <Pressable onPress={() => save("draft")} disabled={!!saving} hitSlop={8} style={{ height: 40, paddingHorizontal: 12, justifyContent: "center" }}>
          {saving === "draft" ? <ActivityIndicator color={C.orange} /> : <Txt weight="bold" color={C.orangeDark}>Save draft</Txt>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Card style={{ marginTop: 14, marginHorizontal: 16 }}>
          <Txt heading size={15} style={{ marginBottom: 4 }}>Photos</Txt>
          <Txt size={12} color={C.muted} style={{ marginBottom: 12 }}>Add clear photos of your work or product. First photo is the cover.</Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Add photo" onPress={addPhotos}
              style={{ width: 84, height: 84, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.orange, borderRadius: R.md, backgroundColor: C.orangeTint, alignItems: "center", justifyContent: "center", gap: 4 }}>
              {uploading ? <ActivityIndicator color={C.orange} /> : <ImagePlus size={22} color={C.orangeDark} />}
              <Txt size={11} weight="bold" color={C.orangeDark}>{uploading ? "Uploading" : "Add photo"}</Txt>
            </Pressable>
            {d.images.map((u, i) => (
              <Pressable key={u} onPress={() => photoActions(i)} accessibilityLabel={i === 0 ? "Cover photo, options" : `Photo ${i + 1}, options`}>
                <Image source={{ uri: u }} style={{ width: 84, height: 84, borderRadius: R.md }} contentFit="cover" />
                {i === 0 && <View style={{ position: "absolute", left: 6, bottom: 6, height: 18, paddingHorizontal: 6, borderRadius: 5, backgroundColor: C.navy, justifyContent: "center" }}><Txt size={10} weight="bold" color={C.white}>Cover</Txt></View>}
              </Pressable>
            ))}
            {d.images.length < 2 && <View style={{ width: 84, height: 84, borderRadius: R.md, backgroundColor: C.chip }} />}
          </ScrollView>
        </Card>

        <Card style={{ marginTop: 14, marginHorizontal: 16, gap: 12 }}>
          <Txt heading size={15}>Ad details</Txt>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <SelectField label="Category *" value={d.category ? categoryLabel(d.category) : ""} placeholder="Choose" onPress={() => setPicker("category")} right={<ChevronDown size={16} color={C.muted} />} />
            <SelectField label="Sub-category *" value={d.subcategory ? subLabel(d.category, d.subcategory) : ""} placeholder="Choose"
              onPress={() => (d.category ? setPicker("sub") : Alert.alert("Pick a category first"))} right={<ChevronDown size={16} color={C.muted} />} />
          </View>
          {(errors.category || errors.subcategory) && <Txt size={12} color={C.danger}>{errors.category ?? errors.subcategory}</Txt>}
          <Field label="Name / Product Name *" placeholder="e.g. UltraTech OPC 53 Cement" value={d.name} onChangeText={(v) => up("name", v)} error={errors.name} />
          <SelectField label="City *" value={d.city} placeholder="City" onPress={() => setPicker("city")} right={<ChevronDown size={16} color={C.muted} />} />
          {errors.city && <Txt size={12} color={C.danger}>{errors.city}</Txt>}
          <Field label="Location / Address *" placeholder="Shop or yard address" value={d.location} onChangeText={(v) => up("location", v)} error={errors.location} />
          <Field label="Contact number 1 *" placeholder="10-digit mobile" keyboardType="phone-pad" value={d.phone1} onChangeText={(v) => up("phone1", v)} error={errors.phone1} />
          <Field label="Contact number 2 (optional)" placeholder="10-digit mobile" keyboardType="phone-pad" value={d.phone2} onChangeText={(v) => up("phone2", v)} error={errors.phone2} />
          <Field label="Services / Tags (comma separated)" placeholder="Bulk supply, Door delivery" value={d.services} onChangeText={(v) => up("services", v)} />
          <Txt size={12} color={C.muted}>You can add up to two contact numbers.</Txt>
        </Card>

        <Card style={{ marginTop: 14, marginHorizontal: 16, gap: 12 }}>
          <Txt heading size={15}>{d.subcategory ? `${subLabel(d.category, d.subcategory)} specifications` : "Specifications"}</Txt>
          {!d.subcategory && <Txt size={13} color={C.muted}>Pick a sub-category to see the details buyers look for.</Txt>}
          {specs.map((f) => f.type === "choice" ? (
            <View key={f.key}>
              <Txt size={13} weight="semibold" style={{ marginBottom: 8 }}>{f.label}</Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {f.options.map((o) => {
                  const on = d.attributes[f.key] === o;
                  return (
                    <Pressable key={o} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setAttr(f.key, on ? "" : o)}
                      style={[{ height: 38, paddingHorizontal: 14, borderRadius: 10, justifyContent: "center" }, on ? { borderWidth: 1.5, borderColor: C.orange, backgroundColor: C.orangeTint } : { borderWidth: 1, borderColor: C.borderStrong }]}>
                      <Txt size={13} weight={on ? "bold" : "semibold"} color={on ? C.orangeDark : C.navy}>{o}</Txt>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : f.type === "price" ? (
            <Field key={f.key} label={f.label} prefix="₹" suffix={f.unit} keyboardType="decimal-pad" placeholder="Your price" value={d.attributes[f.key] ?? ""} onChangeText={(v) => setAttr(f.key, v.replace(/[^\d.]/g, ""))} />
          ) : (
            <Field key={f.key} label={f.label} placeholder={f.placeholder} keyboardType={f.keyboard === "numeric" ? "number-pad" : "default"} value={d.attributes[f.key] ?? ""} onChangeText={(v) => setAttr(f.key, v)} />
          ))}
          <Field label="Description" multiline maxLength={2000} placeholder="Brand, packaging, minimum order, delivery area…" value={d.description} onChangeText={(v) => up("description", v)} />
        </Card>
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12) + 8, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", gap: 10 }}>
        <Button title="Preview" variant="outline" style={{ flex: 1 }} loading={saving === "preview"} disabled={!!saving || uploading > 0} onPress={() => save("preview")} />
        <Button title={id ? "Save & publish" : "Publish ad"} style={{ flex: 2 }} loading={saving === "active"} disabled={!!saving || uploading > 0} onPress={() => save("active")} />
      </View>

      <PickerSheet visible={picker === "category"} title="Category" value={d.category} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
        onSelect={(v) => setD((x) => ({ ...x, category: v, subcategory: v === x.category ? x.subcategory : "", attributes: v === x.category ? x.attributes : {} }))} onClose={() => setPicker(null)} />
      <PickerSheet visible={picker === "sub"} title="Sub-category" value={d.subcategory} options={subs.map((s) => ({ value: s.slug, label: s.label }))}
        onSelect={(v) => up("subcategory", v)} onClose={() => setPicker(null)} />
      <PickerSheet visible={picker === "city"} title="City" value={d.city} searchable allowCustom options={CITIES.map((c) => ({ value: c, label: c }))}
        onSelect={(v) => up("city", v)} onClose={() => setPicker(null)} />
    </KeyboardAvoidingView>
  );
}
