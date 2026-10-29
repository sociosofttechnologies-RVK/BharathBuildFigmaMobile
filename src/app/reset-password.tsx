// Request a reset link, or (when opened from the emailed link with ?code=) set the new password.
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import { C } from "@/theme";
import { Button, Card, Field, ScreenHeader, Txt } from "@/components/ui";
import { sendReset } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [stage, setStage] = useState<"request" | "set">(code ? "set" : "request");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) { Alert.alert("Link expired", "Request a new reset link."); setStage("request"); }
    });
  }, [code]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title={stage === "request" ? "Forgot password" : "Set a new password"} />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          {stage === "request" ? (
            <>
              <Txt size={13} color={C.muted}>Enter the email you signed up with and we'll send you a reset link.</Txt>
              <Field label="Email" icon={Mail} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Button title="Send reset link" loading={busy} onPress={async () => {
                setBusy(true);
                try { await sendReset(email); Alert.alert("Email sent", "Open the link on this phone to set a new password."); }
                catch (e) { Alert.alert("Couldn't send", (e as Error).message); }
                finally { setBusy(false); }
              }} />
            </>
          ) : (
            <>
              <Field label="New password" icon={Lock} value={pw} onChangeText={setPw} secureTextEntry autoComplete="new-password" hint="At least 8 characters" />
              <Button title="Update password" loading={busy} onPress={async () => {
                if (pw.length < 8) return Alert.alert("Password must be at least 8 characters.");
                setBusy(true);
                const { error } = await supabase.auth.updateUser({ password: pw });
                setBusy(false);
                if (error) return Alert.alert("Couldn't update", error.message);
                Alert.alert("Password updated", "", [{ text: "OK", onPress: () => router.replace("/home") }]);
              }} />
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
