import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Mail, Phone, User } from "lucide-react-native";
import { C } from "@/theme";
import { Button, Card, Field, ScreenHeader, Txt } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { sendReset } from "@/lib/auth";

export default function AccountSettings() {
  const router = useRouter();
  const { user, loading, profile, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setFullName(profile?.full_name ?? ""); setPhone(profile?.phone ?? ""); }, [profile]);
  if (!loading && !user) return <Redirect href="/login" />;

  const save = async () => {
    if (fullName.trim().length < 2) return Alert.alert("Enter your name");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() || null }).eq("id", user!.id);
    setBusy(false);
    if (error) return Alert.alert("Couldn't save", error.message);
    await refresh();
    Alert.alert("Saved", "Your profile has been updated.", [{ text: "OK", onPress: () => router.back() }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title="Account Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          <Txt heading size={15}>Profile</Txt>
          <Field label="Full Name" icon={User} value={fullName} onChangeText={setFullName} autoComplete="name" />
          <Field label="Phone" icon={Phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
          <Field label="Email" icon={Mail} value={user?.email ?? ""} editable={false} hint="Contact support to change your login email." />
          <Button title="Save changes" onPress={save} loading={busy} />
        </Card>
        <Card style={{ gap: 10 }}>
          <Txt heading size={15}>Password</Txt>
          <Txt size={13} color={C.muted}>We'll email you a link to set a new password.</Txt>
          <Button title="Send reset link" variant="outline" onPress={async () => {
            try { await sendReset(user?.email ?? ""); Alert.alert("Email sent", "Check your inbox for the reset link."); }
            catch (e) { Alert.alert("Couldn't send", (e as Error).message); }
          }} />
        </Card>
      </ScrollView>
    </View>
  );
}
