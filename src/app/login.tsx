// 02 · Login / Sign up
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Eye, EyeOff, Lock, Mail, Phone, User, X } from "lucide-react-native";
import { C, R, shadow } from "@/theme";
import { Button, Field, IconButton, Segmented, Txt } from "@/components/ui";
import { Logo } from "@/components/brand";
import { signIn, signInWithGoogle, signUp } from "@/lib/auth";

type Mode = "login" | "signup";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: Mode; next?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === "signup" ? "signup" : "login");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"form" | "google" | null>(null);

  const done = () => {
    if (params.next) router.replace(params.next);
    else if (router.canGoBack()) router.back();
    else router.replace("/home");
  };

  const submit = async () => {
    setBusy("form");
    try {
      if (mode === "login") { await signIn(id, password); done(); }
      else {
        const r = await signUp({ fullName, email: id, phone, password });
        if (r.needsConfirmation) {
          Alert.alert("Check your email", "We sent a confirmation link. Open it, then log in here.");
          setMode("login");
        } else done();
      }
    } catch (e) { Alert.alert(mode === "login" ? "Couldn't log in" : "Couldn't sign up", (e as Error).message); }
    finally { setBusy(null); }
  };

  const google = async () => {
    setBusy("google");
    try { if (await signInWithGoogle()) done(); }
    catch (e) { Alert.alert("Google sign-in failed", (e as Error).message); }
    finally { setBusy(null); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ position: "absolute", right: 8, top: -8 }}><IconButton icon={X} label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))} /></View>
          <Logo height={54} />
        </View>

        <View style={[{ marginTop: 28, marginHorizontal: 16, paddingVertical: 22, paddingHorizontal: 18, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, gap: 16 }, shadow.card]}>
          <Segmented<Mode> options={[{ key: "login", label: "Login" }, { key: "signup", label: "Sign Up" }]} value={mode} onChange={setMode} />
          <View>
            <Txt heading="xb" size={22}>{mode === "login" ? "Welcome back" : "Create your account"}</Txt>
            <Txt size={13} color={C.muted} style={{ marginTop: 4 }}>
              {mode === "login" ? "Log in to contact vendors and manage your business." : "Join to message vendors, save favourites and list your business."}
            </Txt>
          </View>

          {mode === "signup" && <Field label="Full Name" icon={User} value={fullName} onChangeText={setFullName} placeholder="Your name" autoComplete="name" textContentType="name" />}
          <Field label={mode === "login" ? "Email ID or Phone Number" : "Email"} icon={Mail} value={id} onChangeText={setId}
            placeholder={mode === "login" ? "you@example.com or 98XXXXXXXX" : "you@example.com"} autoCapitalize="none" autoCorrect={false}
            keyboardType={mode === "login" ? "default" : "email-address"} autoComplete={mode === "login" ? "username" : "email"} textContentType={mode === "login" ? "username" : "emailAddress"} />
          {mode === "signup" && <Field label="Phone (optional)" icon={Phone} value={phone} onChangeText={setPhone} placeholder="10-digit mobile" keyboardType="phone-pad" autoComplete="tel" />}
          <Field
            label="Password" icon={Lock} value={password} onChangeText={setPassword} secureTextEntry={!show}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} autoCapitalize="none"
            autoComplete={mode === "login" ? "current-password" : "new-password"} textContentType={mode === "login" ? "password" : "newPassword"}
            onSubmitEditing={submit} returnKeyType="go"
            labelRight={mode === "login" ? <Pressable onPress={() => router.push("/reset-password")} hitSlop={8}><Txt size={13} weight="semibold" color={C.orangeDark}>Forgot password?</Txt></Pressable> : undefined}
            right={<IconButton icon={show ? EyeOff : Eye} label={show ? "Hide password" : "Show password"} size={18} color={C.muted} onPress={() => setShow(!show)} style={{ marginRight: -8, width: 40, height: 40 }} />}
          />

          <Button title={mode === "login" ? "Login" : "Create account"} onPress={submit} loading={busy === "form"} disabled={!!busy} textSize={16} />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            <Txt size={12} weight="semibold" color={C.muted}>OR</Txt>
            <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
          </View>

          <Pressable accessibilityRole="button" onPress={google} disabled={!!busy}
            style={({ pressed }) => [{ height: 50, borderRadius: R.md, borderWidth: 1, borderColor: C.borderStrong, backgroundColor: C.white, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }, (pressed || busy === "google") && { opacity: 0.7 }]}>
            <GoogleG />
            <Txt size={15} weight="semibold">Continue with Google</Txt>
          </Pressable>
        </View>

        <Txt size={13} color={C.muted} center style={{ marginTop: 20, marginHorizontal: 24 }}>
          {mode === "login" ? "New to BharathBuild? " : "Already have an account? "}
          <Txt size={13} weight="bold" color={C.orangeDark} onPress={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Log in"}</Txt>
        </Txt>
        <View style={{ flex: 1 }} />
        <Txt size={11} color={C.muted} center lh={1.5} style={{ marginTop: 24, marginHorizontal: 32 }}>
          By continuing you agree to our <Txt size={11} color={C.orangeDark} onPress={() => router.push("/terms")}>Terms</Txt> and <Txt size={11} color={C.orangeDark} onPress={() => router.push("/terms")}>Privacy Policy</Txt>.
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoogleG() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </Svg>
  );
}
