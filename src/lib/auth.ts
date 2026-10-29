import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const isPhone = (id: string) => /^\+?[\d\s-]{10,15}$/.test(id.trim());
export const normalizePhone = (p: string) => {
  const d = p.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? d : d.length === 10 ? `+91${d}` : `+${d}`;
};

export async function signIn(identifier: string, password: string) {
  const id = identifier.trim();
  if (!id || !password) throw new Error("Enter your email or phone and password.");
  const { error } = isPhone(id)
    ? await supabase.auth.signInWithPassword({ phone: normalizePhone(id), password })
    : await supabase.auth.signInWithPassword({ email: id.toLowerCase(), password });
  if (error) throw new Error(error.message === "Invalid login credentials" ? "Wrong email/phone or password." : error.message);
}

export async function signUp(p: { fullName: string; email: string; phone: string; password: string }) {
  if (p.fullName.trim().length < 2) throw new Error("Enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(p.email.trim())) throw new Error("Enter a valid email.");
  if (p.phone && !isPhone(p.phone)) throw new Error("Enter a valid phone number.");
  if (p.password.length < 8) throw new Error("Password must be at least 8 characters.");
  const { data, error } = await supabase.auth.signUp({
    email: p.email.trim().toLowerCase(),
    password: p.password,
    options: {
      data: { full_name: p.fullName.trim(), phone: p.phone.trim(), account_type: "customer" },
      emailRedirectTo: Linking.createURL("/login"),
    },
  });
  if (error) throw new Error(error.message);
  return { needsConfirmation: !data.session };
}

export async function sendReset(email: string) {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("Enter the email you signed up with.");
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: Linking.createURL("/reset-password") });
  if (error) throw new Error(error.message);
}

/** Google sign-in through Supabase OAuth (PKCE). The redirect URL must be allowed in Supabase Auth settings. */
export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("/auth-callback");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw new Error(error?.message ?? "Google sign-in is unavailable.");
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== "success") return false;
  const { queryParams } = Linking.parse(res.url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  if (!code) throw new Error(typeof queryParams?.error_description === "string" ? queryParams.error_description : "Sign-in was cancelled.");
  const { error: e2 } = await supabase.auth.exchangeCodeForSession(code);
  if (e2) throw new Error(e2.message);
  return true;
}
