// 09 · Become a Business
import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown, Info } from "lucide-react-native";
import { C } from "@/theme";
import { Badge, Button, Card, Field, Notice, ScreenHeader, SelectField, Txt } from "@/components/ui";
import { PickerSheet } from "@/components/PickerSheet";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { BUSINESS_TYPES, businessStatus, submitBusinessApplication, validateBusiness, type BusinessForm } from "@/lib/business";
import { useAuth } from "@/context/AuthContext";

const EMPTY: BusinessForm = { businessName: "", category: "", businessType: "", experience: "", services: "", description: "", phone: "", email: "", website: "", city: "", pincode: "", gst: "" };

export default function BecomeBusiness() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, profile, isVendor, refresh } = useAuth();
  const saved = (user?.user_metadata?.business ?? null) as (BusinessForm & { services: string[] | string }) | null;
  const [f, setF] = useState<BusinessForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessForm, string>>>({});
  const [picker, setPicker] = useState<"category" | "type" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (saved) setF({ ...EMPTY, ...saved, services: Array.isArray(saved.services) ? saved.services.join(", ") : saved.services ?? "" });
    else setF((x) => ({ ...x, email: x.email || user?.email || "", phone: x.phone || profile?.phone || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const up = (k: keyof BusinessForm) => (v: string) => { setF((x) => ({ ...x, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })); };
  const progress = useMemo(() => {
    const e = validateBusiness(f);
    const biz = !e.businessName && !e.category && !e.businessType && !e.experience;
    const contact = !e.phone && !e.email && f.phone.length > 0;
    const addr = !e.city && !e.pincode && !e.gst;
    return [biz, biz && contact, biz && contact && addr];
  }, [f]);

  if (!loading && !user) return <Redirect href={{ pathname: "/login", params: { mode: "signup", next: "/become-business" } }} />;
  if (isVendor) return <Redirect href="/vendor" />;
  const pending = businessStatus(user?.user_metadata) === "pending";

  const submit = async () => {
    const e = validateBusiness(f);
    setErrors(e);
    if (Object.keys(e).length) return Alert.alert("Check the form", "Some fields need your attention.");
    setBusy(true);
    try {
      await submitBusinessApplication(user!.id, f);
      await refresh();
      Alert.alert("Application submitted", "Our team will review it. You'll get the business dashboard once approved.", [{ text: "OK", onPress: () => router.replace("/account") }]);
    } catch (err) { Alert.alert("Couldn't submit", (err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScreenHeader title="Become a Business Partner" right={pending ? <View style={{ marginRight: 8 }}><Badge kind="pending" /></View> : undefined} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {progress.map((on, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: on ? C.orange : C.border }} />)}
          </View>
          <View style={{ marginTop: 6, flexDirection: "row", justifyContent: "space-between" }}>
            {["Business", "Contact", "Address & KYC"].map((l, i) => <Txt key={l} size={12} weight="semibold" color={progress[i] ? C.orangeDark : C.muted}>{l}</Txt>)}
          </View>
        </View>

        <Card style={{ marginTop: 16, marginHorizontal: 16, gap: 12 }}>
          <Txt heading size={15}>Business details</Txt>
          <Field label="Business name" value={f.businessName} onChangeText={up("businessName")} placeholder="e.g. Sri Lakshmi Constructions" error={errors.businessName} />
          <SelectField label="Business category" value={f.category ? categoryLabel(f.category) : ""} placeholder="Choose a category" onPress={() => setPicker("category")} right={<ChevronDown size={16} color={C.muted} />} />
          {errors.category && <Txt size={12} color={C.danger}>{errors.category}</Txt>}
          <SelectField label="Business type" value={f.businessType} placeholder="Proprietorship, Pvt Ltd…" onPress={() => setPicker("type")} right={<ChevronDown size={16} color={C.muted} />} />
          {errors.businessType && <Txt size={12} color={C.danger}>{errors.businessType}</Txt>}
          <Field label="Years of experience" value={f.experience} onChangeText={up("experience")} keyboardType="number-pad" placeholder="e.g. 12" maxLength={2} error={errors.experience} />
          <Field label="Services (comma separated)" value={f.services} onChangeText={up("services")} placeholder="RCC work, Interiors, Plumbing" />
          <Field label="Description" value={f.description} onChangeText={up("description")} multiline maxLength={1000} placeholder="Tell buyers what you do, where you work and what makes you different." />
        </Card>

        <Card style={{ marginTop: 14, marginHorizontal: 16, gap: 12 }}>
          <Txt heading size={15}>Contact</Txt>
          <Field label="Phone" value={f.phone} onChangeText={up("phone")} keyboardType="phone-pad" placeholder="+91 98XXX XXXXX" autoComplete="tel" error={errors.phone} />
          <Field label="Email" value={f.email} onChangeText={up("email")} keyboardType="email-address" autoCapitalize="none" placeholder="you@business.in" error={errors.email} />
          <Field label="Website" value={f.website} onChangeText={up("website")} keyboardType="url" autoCapitalize="none" placeholder="https://" />
        </Card>

        <Card style={{ marginTop: 14, marginHorizontal: 16, gap: 12 }}>
          <Txt heading size={15}>Address & registration</Txt>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Field containerStyle={{ flex: 1 }} label="City" value={f.city} onChangeText={up("city")} placeholder="City" error={errors.city} />
            <Field containerStyle={{ flex: 1 }} label="Pincode" value={f.pincode} onChangeText={up("pincode")} placeholder="6-digit" keyboardType="number-pad" maxLength={6} error={errors.pincode} />
          </View>
          <Field label="GST number (optional)" value={f.gst} onChangeText={(v) => up("gst")(v.toUpperCase())} autoCapitalize="characters" placeholder="22AAAAA0000A1Z5" maxLength={15} error={errors.gst} />
        </Card>

        <View style={{ marginTop: 14, marginHorizontal: 16 }}>
          <Notice icon={Info}>Your application is reviewed by our team. You'll get access to the business dashboard once approved.</Notice>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12) + 8, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border }}>
        <Button title={pending ? "Update application" : "Submit application"} onPress={submit} loading={busy} />
      </View>

      <PickerSheet visible={picker === "category"} title="Business category" value={f.category} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} onSelect={up("category")} onClose={() => setPicker(null)} />
      <PickerSheet visible={picker === "type"} title="Business type" value={f.businessType} options={BUSINESS_TYPES.map((t) => ({ value: t, label: t }))} onSelect={up("businessType")} onClose={() => setPicker(null)} />
    </KeyboardAvoidingView>
  );
}
